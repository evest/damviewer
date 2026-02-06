"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileVideo, FileText } from "lucide-react";
import type { Asset } from "@/lib/types/asset";
import { isImage, isVideo, formatDate } from "@/lib/constants";

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const hasUrl = "Url" in asset && asset.Url;

  return (
    <Link href={`/assets/${asset.Id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md py-0 gap-0">
        <div className="relative aspect-square bg-muted">
          {hasUrl && isImage(asset.MimeType) ? (
            <Image
              src={asset.Url as string}
              alt={(asset as { AltText?: string }).AltText || asset.Title || "Asset"}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            />
          ) : isVideo(asset.MimeType) ? (
            <div className="flex h-full items-center justify-center">
              <FileVideo className="h-12 w-12 text-muted-foreground" />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <p className="truncate text-sm font-medium" title={asset.Title}>
            {asset.Title || "Untitled"}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {asset.MimeType.split("/").pop()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(asset.DateCreated)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
