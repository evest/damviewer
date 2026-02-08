import Link from "next/link";
import { notFound } from "next/navigation";
import { graphqlFetch } from "@/lib/graphql/client";
import { ASSET_DETAIL_QUERY } from "@/lib/graphql/queries";
import { AssetDetail } from "@/app/components/assets/AssetDetail";
import { RenditionList } from "@/app/components/assets/RenditionList";
import { DamImage } from "@/app/components/ui/DamImage";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { FileTypeIcon } from "@/app/components/ui/FileTypeIcon";
import { isPreviewable } from "@/lib/constants";
import { isImageAsset, isVideoAsset } from "@/lib/types/asset";
import type { AssetDetailResponse } from "@/lib/graphql/types";

export default async function AssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await graphqlFetch<AssetDetailResponse>(ASSET_DETAIL_QUERY, {
    where: { Id: { eq: id } },
  });

  const asset = data.Asset.items[0];
  if (!asset) notFound();

  const url = "Url" in asset ? asset.Url : undefined;
  const renditions =
    (isImageAsset(asset) ? asset.Renditions : isVideoAsset(asset) ? asset.Renditions : null) ?? [];
  const canPreview = isPreviewable(asset.MimeType);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-auto sm:px-3">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Back</span>
          </Button>
        </Link>
        <h1 className="min-w-0 break-all text-xl font-semibold">{asset.Title || "Untitled"}</h1>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0"
          >
            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-auto sm:px-3">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Download</span>
            </Button>
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="min-w-0 space-y-6">
          {/* Preview */}
          <div className="overflow-hidden rounded-lg border bg-muted">
            {isImageAsset(asset) && canPreview ? (
              <div className="relative aspect-video">
                <DamImage
                  src={asset.Url}
                  alt={asset.AltText || asset.Title || "Image"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
              </div>
            ) : isVideoAsset(asset) && canPreview ? (
              <video
                src={asset.Url}
                controls
                className="aspect-video w-full"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-4">
                <FileTypeIcon mimeType={asset.MimeType} size={96} />
                <p className="text-sm text-muted-foreground">
                  No preview available for {asset.MimeType}
                </p>
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Button>Download File</Button>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Renditions */}
          {renditions.length > 0 && <RenditionList renditions={renditions} />}
        </div>

        {/* Metadata sidebar */}
        <aside className="min-w-0">
          <AssetDetail asset={asset} />
        </aside>
      </div>
    </div>
  );
}
