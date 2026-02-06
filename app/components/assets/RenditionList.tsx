"use client";

import { useState } from "react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { damLoader } from "@/lib/constants";
import type { Rendition } from "@/lib/types/asset";

interface RenditionListProps {
  renditions: Rendition[];
}

export function RenditionList({ renditions }: RenditionListProps) {
  const [selected, setSelected] = useState<Rendition | null>(null);

  if (renditions.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-medium uppercase text-muted-foreground">
        Renditions
      </h2>
      <Separator className="my-2" />

      <div className="flex gap-2 overflow-x-auto pb-2">
        {renditions.map((rendition) => (
          <button
            key={rendition.Id}
            onClick={() =>
              setSelected(selected?.Id === rendition.Id ? null : rendition)
            }
            className={`shrink-0 rounded-lg border-2 p-1 transition-colors ${
              selected?.Id === rendition.Id
                ? "border-primary"
                : "border-transparent hover:border-muted"
            }`}
          >
            <div className="relative h-16 w-20 overflow-hidden rounded bg-muted">
              <Image
                loader={damLoader}
                src={rendition.Url}
                alt={rendition.Name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <p className="mt-1 w-20 truncate text-center text-xs">
              {rendition.Name}
            </p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <Image
              loader={damLoader}
              src={selected.Url}
              alt={selected.Name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {selected.Name} ({selected.Width}x{selected.Height})
          </p>
        </div>
      )}
    </div>
  );
}
