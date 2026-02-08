"use client";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailRow } from "@/app/components/ui/DetailRow";
import { useCmpData } from "@/lib/hooks/useCmpData";
import { ExternalLink } from "lucide-react";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface CmpDetailsProps {
  assetId: string;
  isImage: boolean;
}

export function CmpDetails({ assetId, isImage }: CmpDetailsProps) {
  const { image, lineages, imageLoading, lineagesLoading, imageError, lineagesError } =
    useCmpData(assetId, isImage);

  return (
    <div className="space-y-6">
      {isImage && (
        <div>
          <h2 className="text-sm font-medium uppercase text-muted-foreground">
            CMP Properties
          </h2>
          <Separator className="my-2" />
          {imageLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : imageError ? (
            <p className="text-sm text-muted-foreground italic">
              Unable to load CMP properties
            </p>
          ) : image ? (
            <dl className="space-y-2 text-sm">
              <DetailRow label="File Size" value={formatFileSize(image.file_size)} />
              <DetailRow
                label="Resolution"
                value={`${image.image_resolution.width} x ${image.image_resolution.height}`}
              />
              <DetailRow label="Version" value={String(image.version_number)} />
              <DetailRow label="Public" value={image.is_public ? "Yes" : "No"} />
              <DetailRow label="Archived" value={image.is_archived ? "Yes" : "No"} />
              {image.attribution_text && (
                <DetailRow label="Attribution" value={image.attribution_text} />
              )}
            </dl>
          ) : null}
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium uppercase text-muted-foreground">Lineages</h2>
        <Separator className="my-2" />
        {lineagesLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : lineagesError ? (
          <p className="text-sm text-muted-foreground italic">
            Unable to load lineages
          </p>
        ) : lineages && lineages.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {lineages.map((lineage) => (
              <li key={lineage.id}>
                <a
                  href={lineage.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="break-all">{lineage.name || lineage.uri}</span>
                </a>
                {lineage.used_in && (
                  <p className="ml-5 text-xs text-muted-foreground">{lineage.used_in}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">No lineages found</p>
        )}
      </div>
    </div>
  );
}
