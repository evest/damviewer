"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/constants";
import type {
  CmpAssetKind,
  CmpAssetMetadata,
  CmpEditableField,
  CmpFieldUpdate,
} from "@/lib/cmp/types";

const CHOICE_TYPES = new Set(["dropdown", "radio_button", "checkbox", "label"]);
const NUMBER_TYPES = new Set(["simple_number", "percentage_number", "currency_number"]);
const LONG_TEXT_TYPES = new Set(["text_area", "rich_text"]);
// Attachment fields need an upload key to write, so they aren't editable here
const ATTACHMENT_TYPES = new Set(["image", "video"]);

const MAX_TAG_LENGTH = 100;

interface Draft {
  tags: string[];
  tagInput: string;
  /** yyyy-mm-dd, or "" for no expiry */
  expiresDate: string;
  fields: Record<string, unknown[]>;
}

interface LoadState {
  metadata: CmpAssetMetadata | null;
  fields: CmpEditableField[] | null;
  loading: boolean;
  error: string | null;
}

type LoadAction =
  | { type: "LOADED"; metadata: CmpAssetMetadata; fields: CmpEditableField[] }
  | { type: "ERROR"; error: string };

function loadReducer(state: LoadState, action: LoadAction): LoadState {
  switch (action.type) {
    case "LOADED":
      return { metadata: action.metadata, fields: action.fields, loading: false, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.error };
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error([data?.error ?? `Request failed (${res.status})`, data?.detail].filter(Boolean).join(": "));
  }
  return data;
}

function isMultiChoice(field: CmpEditableField): boolean {
  return field.type === "checkbox" || (field.type !== "radio_button" && field.is_multi_select);
}

/** Converts draft values (numbers are kept as strings while typing) to the PUT payload shape. */
function toPayloadValues(field: CmpEditableField, values: unknown[]): unknown[] {
  if (NUMBER_TYPES.has(field.type)) {
    return values.filter((v) => v !== "").map(Number);
  }
  return values;
}

function displayValues(field: CmpEditableField): string[] {
  if (field.type === "date") return field.values.map((v) => formatDate(String(v)));
  if (field.choices.length === 0) return field.values.map(String);
  const names = new Map(field.choices.map((c) => [c.id, c.name]));
  return field.values.map((v) => names.get(String(v)) ?? String(v));
}

function sameValues(a: unknown[], b: unknown[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

interface CmpMetadataEditorProps {
  assetId: string;
  kind: CmpAssetKind;
  canEdit: boolean;
}

/**
 * Reads tags, expiry and custom fields straight from the CMP REST API and,
 * when write-back is enabled, edits them: tags and expiry via
 * PATCH /{images|videos|raw-files}/{id}, custom fields via PUT /assets/{id}/fields.
 */
export function CmpMetadataEditor({ assetId, kind, canEdit }: CmpMetadataEditorProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(loadReducer, {
    metadata: null,
    fields: null,
    loading: true,
    error: null,
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    Promise.all([
      requestJson<CmpAssetMetadata>(`/api/cmp/assets/${assetId}?kind=${kind}`, { signal }),
      requestJson<CmpEditableField[]>(`/api/cmp/assets/${assetId}/fields`, { signal }),
    ])
      .then(([metadata, fields]) => dispatch({ type: "LOADED", metadata, fields }))
      .catch((err) => {
        if (err.name !== "AbortError") dispatch({ type: "ERROR", error: err.message });
      });

    return () => controller.abort();
  }, [assetId, kind]);

  const { metadata, fields, loading, error } = state;

  function startEditing() {
    if (!metadata || !fields) return;
    setDraft({
      tags: metadata.tags,
      tagInput: "",
      expiresDate: metadata.expires_at?.slice(0, 10) ?? "",
      fields: Object.fromEntries(
        fields.map((f) => [f.id, NUMBER_TYPES.has(f.type) ? f.values.map(String) : f.values])
      ),
    });
    setSaveError(null);
    setSavedNote(false);
  }

  function addTag(raw: string) {
    const tag = raw.trim().slice(0, MAX_TAG_LENGTH);
    setDraft((d) =>
      d && { ...d, tagInput: "", tags: tag && !d.tags.includes(tag) ? [...d.tags, tag] : d.tags }
    );
  }

  function setFieldValues(id: string, values: unknown[]) {
    setDraft((d) => d && { ...d, fields: { ...d.fields, [id]: values } });
  }

  async function save() {
    if (!draft || !metadata || !fields) return;
    setSaving(true);
    setSaveError(null);

    // Include a tag that was typed but not yet confirmed with Enter
    const pendingTag = draft.tagInput.trim().slice(0, MAX_TAG_LENGTH);
    const tags = pendingTag && !draft.tags.includes(pendingTag) ? [...draft.tags, pendingTag] : draft.tags;

    const metadataUpdate: Partial<CmpAssetMetadata> = {};
    if (!sameValues(tags, metadata.tags)) metadataUpdate.tags = tags;
    if (draft.expiresDate !== (metadata.expires_at?.slice(0, 10) ?? "")) {
      metadataUpdate.expires_at = draft.expiresDate ? `${draft.expiresDate}T00:00:00Z` : null;
    }

    const editable = fields.filter((f) => !ATTACHMENT_TYPES.has(f.type));
    const fieldsChanged = editable.some(
      (f) => !sameValues(toPayloadValues(f, draft.fields[f.id] ?? []), f.values)
    );
    // PUT replaces the asset's fields, so send the complete set: everything with a
    // value, plus fields that had a value before (now empty) so they get cleared
    const fieldsUpdate: CmpFieldUpdate[] = editable
      .map((f) => ({ id: f.id, type: f.type, values: toPayloadValues(f, draft.fields[f.id] ?? []) }))
      .filter((u, i) => u.values.length > 0 || editable[i].values.length > 0);

    try {
      let nextMetadata = metadata;
      let nextFields = fields;
      if (Object.keys(metadataUpdate).length > 0) {
        nextMetadata = await requestJson<CmpAssetMetadata>(`/api/cmp/assets/${assetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, ...metadataUpdate }),
        });
      }
      if (fieldsChanged) {
        nextFields = await requestJson<CmpEditableField[]>(`/api/cmp/assets/${assetId}/fields`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldsUpdate),
        });
      }
      dispatch({ type: "LOADED", metadata: nextMetadata, fields: nextFields });
      setDraft(null);
      setSavedNote(true);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase text-muted-foreground">CMP Metadata</h2>
        {canEdit && !draft && metadata && fields && (
          <Button variant="ghost" size="xs" onClick={startEditing}>
            <Pencil />
            Edit
          </Button>
        )}
      </div>
      <Separator className="my-2" />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : error || !metadata || !fields ? (
        <p className="text-sm text-muted-foreground italic">Unable to load CMP metadata</p>
      ) : draft ? (
        <div className="space-y-4 text-sm">
          <EditorRow label="Tags">
            {draft.tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {draft.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remove tag ${tag}`}
                      className="rounded-sm hover:bg-muted-foreground/20"
                      onClick={() => setDraft({ ...draft, tags: draft.tags.filter((t) => t !== tag) })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <Input
              value={draft.tagInput}
              placeholder="Add tag and press Enter"
              maxLength={MAX_TAG_LENGTH}
              onChange={(e) => setDraft({ ...draft, tagInput: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(draft.tagInput);
                }
              }}
            />
          </EditorRow>

          <EditorRow label="Expires (UTC)">
            <div className="flex gap-2">
              <Input
                type="date"
                value={draft.expiresDate}
                onChange={(e) => setDraft({ ...draft, expiresDate: e.target.value })}
              />
              {draft.expiresDate && (
                <Button variant="outline" size="sm" className="h-9" onClick={() => setDraft({ ...draft, expiresDate: "" })}>
                  Clear
                </Button>
              )}
            </div>
          </EditorRow>

          {fields.map((field) => (
            <EditorRow key={field.id} label={field.name}>
              <FieldInput
                field={field}
                values={draft.fields[field.id] ?? []}
                onChange={(values) => setFieldValues(field.id, values)}
              />
            </EditorRow>
          ))}

          {saveError && <p className="wrap-break-word text-xs text-destructive">{saveError}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={saving} onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving} onClick={save}>
              {saving && <Loader2 className="animate-spin" />}
              Save to CMP
            </Button>
          </div>
        </div>
      ) : (
        <dl className="space-y-3 text-sm">
          {savedNote && (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Saved to CMP. The Tags and Custom Fields sections above come from Content Graph
              and update after its next sync.
            </p>
          )}
          <ReadRow label="Tags" values={metadata.tags} />
          <ReadRow
            label="Expires"
            values={metadata.expires_at ? [formatDate(metadata.expires_at)] : []}
          />
          {fields
            .filter((f) => f.values.length > 0)
            .map((field) => (
              <ReadRow key={field.id} label={field.name} values={displayValues(field)} />
            ))}
          {!canEdit && (
            <p className="text-xs text-muted-foreground italic">
              Editing is disabled. Set ENABLE_CMP_WRITE=true to enable it.
            </p>
          )}
        </dl>
      )}
    </div>
  );
}

function EditorRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function ReadRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <dt className="mb-1 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap gap-1">
        {values.length > 0 ? (
          values.map((v) => (
            <Badge key={v} variant="outline">
              {v}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground italic">Not set</span>
        )}
      </dd>
    </div>
  );
}

const textareaClass =
  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px] md:text-sm";

function FieldInput({
  field,
  values,
  onChange,
}: {
  field: CmpEditableField;
  values: unknown[];
  onChange: (values: unknown[]) => void;
}) {
  if (CHOICE_TYPES.has(field.type)) {
    const multi = isMultiChoice(field);
    const toggle = (id: string) => {
      if (values.includes(id)) onChange(values.filter((v) => v !== id));
      else onChange(multi ? [...values, id] : [id]);
    };
    return (
      <div className="flex flex-wrap gap-1" role="group" aria-label={field.name}>
        {field.choices.map((choice) => {
          const selected = values.includes(choice.id);
          return (
            <button key={choice.id} type="button" aria-pressed={selected} onClick={() => toggle(choice.id)}>
              <Badge
                variant={selected ? "default" : "outline"}
                className={cn("cursor-pointer", !selected && "hover:bg-accent")}
              >
                {choice.name}
              </Badge>
            </button>
          );
        })}
      </div>
    );
  }

  const first = values[0] == null ? "" : String(values[0]);

  if (NUMBER_TYPES.has(field.type)) {
    return (
      <Input
        type="number"
        step="any"
        value={first}
        onChange={(e) => onChange(e.target.value === "" ? [] : [e.target.value])}
      />
    );
  }

  if (field.type === "date") {
    return (
      <Input
        type="date"
        value={first.slice(0, 10)}
        onChange={(e) => onChange(e.target.value ? [`${e.target.value}T00:00:00Z`] : [])}
      />
    );
  }

  if (LONG_TEXT_TYPES.has(field.type)) {
    return (
      <textarea
        className={textareaClass}
        value={first}
        placeholder={field.type === "rich_text" ? "HTML" : undefined}
        onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
      />
    );
  }

  if (ATTACHMENT_TYPES.has(field.type)) {
    return <p className="text-xs text-muted-foreground italic">Attachment fields can&apos;t be edited here</p>;
  }

  return <Input value={first} onChange={(e) => onChange(e.target.value ? [e.target.value] : [])} />;
}
