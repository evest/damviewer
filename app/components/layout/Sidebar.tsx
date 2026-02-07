"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal, X, Image, FileVideo, FileText, Calendar } from "lucide-react";
import type { FacetValue } from "@/lib/types/asset";

interface SidebarProps {
  tags: FacetValue[];
}

const TYPE_OPTIONS = [
  { value: "image", label: "Images", icon: Image },
  { value: "video", label: "Videos", icon: FileVideo },
  { value: "raw", label: "Files", icon: FileText },
] as const;

const DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last week" },
  { value: "month", label: "Last month" },
  { value: "3months", label: "Last 3 months" },
  { value: "6months", label: "Last 6 months" },
] as const;

function useFilterParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTypes = searchParams.get("type")?.split(",").filter(Boolean) ?? [];
  const activeTags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
  const activeCreated = searchParams.get("created") ?? "";
  const hasFilters = activeTypes.length > 0 || activeTags.length > 0 || !!activeCreated;

  function toggleParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(key)?.split(",").filter(Boolean) ?? [];
    const idx = current.indexOf(value);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }
    if (current.length > 0) {
      params.set(key, current.join(","));
    } else {
      params.delete(key);
    }
    params.delete("page");
    params.delete("cursor");
    router.push(`/?${params.toString()}`);
  }

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    params.delete("cursor");
    router.push(`/?${params.toString()}`);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("type");
    params.delete("tags");
    params.delete("created");
    params.delete("page");
    params.delete("cursor");
    router.push(`/?${params.toString()}`);
  }

  return { activeTypes, activeTags, activeCreated, hasFilters, toggleParam, setParam, clearFilters };
}

function ActiveBadges({
  activeTypes,
  activeTags,
  activeCreated,
  toggleParam,
  setParam,
}: {
  activeTypes: string[];
  activeTags: string[];
  activeCreated: string;
  toggleParam: (key: string, value: string) => void;
  setParam: (key: string, value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 px-4 py-3">
      {activeTypes.map((t) => (
        <Badge key={t} variant="default" className="cursor-pointer gap-1" onClick={() => toggleParam("type", t)}>
          {t}
          <X className="h-3 w-3" />
        </Badge>
      ))}
      {activeTags.map((t) => (
        <Badge key={t} variant="default" className="cursor-pointer gap-1" onClick={() => toggleParam("tags", t)}>
          {t}
          <X className="h-3 w-3" />
        </Badge>
      ))}
      {activeCreated && (
        <Badge variant="default" className="cursor-pointer gap-1" onClick={() => setParam("created", "")}>
          {DATE_OPTIONS.find((d) => d.value === activeCreated)?.label ?? activeCreated}
          <X className="h-3 w-3" />
        </Badge>
      )}
    </div>
  );
}

function TypeSection({
  activeTypes,
  toggleParam,
}: {
  activeTypes: string[];
  toggleParam: (key: string, value: string) => void;
}) {
  return (
    <div className="px-4 py-3">
      <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Asset Type</h3>
      <div className="space-y-1">
        {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isActive = activeTypes.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggleParam("type", value)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                isActive ? "bg-accent font-medium" : ""
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateSectionList({
  activeCreated,
  setParam,
}: {
  activeCreated: string;
  setParam: (key: string, value: string) => void;
}) {
  return (
    <div className="px-4 py-3">
      <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Created Date</h3>
      <div className="space-y-1">
        {DATE_OPTIONS.map(({ value, label }) => {
          const isActive = activeCreated === value;
          return (
            <button
              key={value}
              onClick={() => setParam("created", isActive ? "" : value)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                isActive ? "bg-accent font-medium" : ""
              }`}
            >
              <Calendar className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateSectionDropdown({
  activeCreated,
  setParam,
}: {
  activeCreated: string;
  setParam: (key: string, value: string) => void;
}) {
  return (
    <div className="px-4 py-3">
      <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Created Date</h3>
      <select
        value={activeCreated}
        onChange={(e) => setParam("created", e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <option value="">Any time</option>
        {DATE_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TagsSection({
  tags,
  activeTags,
  toggleParam,
  className,
}: {
  tags: FacetValue[];
  activeTags: string[];
  toggleParam: (key: string, value: string) => void;
  className?: string;
}) {
  return (
    <div className="px-4 py-3">
      <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Tags</h3>
      <div className={className ?? "space-y-1"}>
        {tags.map((tag) => {
          const isActive = activeTags.includes(tag.name);
          return (
            <button
              key={tag.name}
              onClick={() => toggleParam("tags", tag.name)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                isActive ? "bg-accent font-medium" : ""
              }`}
            >
              <span className="truncate">{tag.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{tag.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SidebarContent({ tags }: SidebarProps) {
  const { activeTypes, activeTags, activeCreated, hasFilters, toggleParam, setParam, clearFilters } = useFilterParams();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold">Filters</h2>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto px-2 py-1 text-xs">
            Clear all
          </Button>
        )}
      </div>
      <Separator />

      {hasFilters && (
        <ActiveBadges
          activeTypes={activeTypes}
          activeTags={activeTags}
          activeCreated={activeCreated}
          toggleParam={toggleParam}
          setParam={setParam}
        />
      )}

      <ScrollArea className="flex-1">
        <TypeSection activeTypes={activeTypes} toggleParam={toggleParam} />
        <Separator />
        <DateSectionList activeCreated={activeCreated} setParam={setParam} />
        <Separator />
        <TagsSection tags={tags} activeTags={activeTags} toggleParam={toggleParam} />
      </ScrollArea>
    </div>
  );
}

function MobileFilterContent({ tags }: SidebarProps) {
  const { activeTypes, activeTags, activeCreated, hasFilters, toggleParam, setParam, clearFilters } = useFilterParams();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Drag indicator */}
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted" />

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <SheetTitle className="text-sm font-semibold">Filters</SheetTitle>
        <SheetDescription className="sr-only">Filter assets by type, date, and tags</SheetDescription>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto px-2 py-1 text-xs">
              Clear all
            </Button>
          )}
          <SheetClose asChild>
            <Button variant="ghost" size="sm" className="h-auto p-1">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </SheetClose>
        </div>
      </div>
      <Separator />

      {hasFilters && (
        <div className="shrink-0">
          <ActiveBadges
            activeTypes={activeTypes}
            activeTags={activeTags}
            activeCreated={activeCreated}
            toggleParam={toggleParam}
            setParam={setParam}
          />
        </div>
      )}

      {/* Scrollable filter sections */}
      <ScrollArea className="min-h-0 flex-1">
        <TypeSection activeTypes={activeTypes} toggleParam={toggleParam} />
        <Separator />
        <DateSectionDropdown activeCreated={activeCreated} setParam={setParam} />
        <Separator />
        <TagsSection
          tags={tags}
          activeTags={activeTags}
          toggleParam={toggleParam}
          className="max-h-48 space-y-1 overflow-y-auto"
        />
      </ScrollArea>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r lg:block">
      <SidebarContent {...props} />
    </aside>
  );
}

export function MobileFilters(props: SidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="sr-only">Filters</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" showCloseButton={false} className="p-0">
        <MobileFilterContent {...props} />
      </SheetContent>
    </Sheet>
  );
}
