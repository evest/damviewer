import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Asset, AssetField, ImageAsset, Label } from "@/lib/types/asset";
import { formatDate } from "@/lib/constants";

interface AssetDetailProps {
  asset: Asset;
}

export function AssetDetail({ asset }: AssetDetailProps) {
  const imageAsset = asset.__typename === "PublicImageAsset" ? (asset as ImageAsset) : null;
  const description = "Description" in asset ? (asset as { Description: string }).Description : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium uppercase text-muted-foreground">Details</h2>
        <Separator className="my-2" />
        <dl className="space-y-2 text-sm">
          <DetailRow label="Title" value={asset.Title || "Untitled"} />
          {description && <DetailRow label="Description" value={description} />}
          <DetailRow label="MIME Type" value={asset.MimeType} />
          <DetailRow label="Created" value={formatDate(asset.DateCreated)} />
          <DetailRow label="Modified" value={formatDate(asset.DateModified)} />
          {imageAsset && (
            <DetailRow
              label="Dimensions"
              value={`${imageAsset.Width} x ${imageAsset.Height}`}
            />
          )}
          <DetailRow label="Library Path" value={asset.LibraryPath} />
        </dl>
      </div>

      {asset.Tags && asset.Tags.length > 0 && (
        <div>
          <h2 className="text-sm font-medium uppercase text-muted-foreground">Tags</h2>
          <Separator className="my-2" />
          <div className="flex flex-wrap gap-1.5">
            {asset.Tags.map((tag) => (
              <Link key={tag.Guid} href={`/?tags=${encodeURIComponent(tag.Name)}`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                  {tag.Name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {asset.Labels && asset.Labels.length > 0 && (
        <div>
          <h2 className="text-sm font-medium uppercase text-muted-foreground">Labels</h2>
          <Separator className="my-2" />
          <div className="space-y-3">
            {asset.Labels.map((label: Label, i: number) => (
              <div key={i}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {label.Group.Name}
                </p>
                <div className="flex flex-wrap gap-1">
                  {label.Values.map((v) => (
                    <Badge key={v.Name} variant="outline">
                      {v.Name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {asset.Fields && asset.Fields.length > 0 && (
        <div>
          <h2 className="text-sm font-medium uppercase text-muted-foreground">Custom Fields</h2>
          <Separator className="my-2" />
          <div className="space-y-3">
            {asset.Fields.map((field: AssetField) => (
              <div key={field.Id}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {field.Name}
                </p>
                <div className="flex flex-wrap gap-1">
                  {resolveFieldValues(field).map((name) => (
                    <Badge key={name} variant="outline">
                      {name}
                    </Badge>
                  ))}
                  {resolveFieldValues(field).length === 0 && (
                    <span className="text-xs text-muted-foreground italic">Not set</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function resolveFieldValues(field: AssetField): string[] {
  if (!field.Values || field.Values.length === 0) return [];
  if (!field._json?.Choices) return field.Values;

  const choiceMap = new Map(field._json.Choices.map((c) => [c.Id, c.Name]));
  return field.Values.map((id) => choiceMap.get(id) ?? id);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right break-all">{value}</dd>
    </div>
  );
}
