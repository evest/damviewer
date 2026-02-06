import Link from "next/link";
import { notFound } from "next/navigation";
import { graphqlFetch } from "@/lib/graphql/client";
import { ASSET_DETAIL_QUERY } from "@/lib/graphql/queries";
import { AssetDetail } from "@/app/components/assets/AssetDetail";
import { RenditionList } from "@/app/components/assets/RenditionList";
import { DamImage } from "@/app/components/ui/DamImage";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import type { Asset, ImageAsset, VideoAsset, RawFileAsset } from "@/lib/types/asset";

interface AssetDetailResponse {
  Asset: {
    items: Asset[];
  };
}

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

  const isImage = asset.__typename === "PublicImageAsset";
  const isVideo = asset.__typename === "PublicVideoAsset";
  const isRaw = asset.__typename === "PublicRawFileAsset";

  const imageAsset = isImage ? (asset as ImageAsset) : null;
  const videoAsset = isVideo ? (asset as VideoAsset) : null;
  const rawAsset = isRaw ? (asset as RawFileAsset) : null;

  const url = imageAsset?.Url ?? videoAsset?.Url ?? rawAsset?.Url;
  const renditions = imageAsset?.Renditions ?? videoAsset?.Renditions ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">{asset.Title || "Untitled"}</h1>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto"
          >
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          {/* Preview */}
          <div className="overflow-hidden rounded-lg border bg-muted">
            {imageAsset ? (
              <div className="relative aspect-video">
                <DamImage
                  src={imageAsset.Url}
                  alt={imageAsset.AltText || imageAsset.Title || "Image"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
              </div>
            ) : videoAsset ? (
              <video
                src={videoAsset.Url}
                controls
                className="aspect-video w-full"
              >
                Your browser does not support the video tag.
              </video>
            ) : rawAsset ? (
              <div className="flex aspect-video flex-col items-center justify-center gap-4">
                <Download className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {asset.MimeType}
                </p>
                <a href={rawAsset.Url} target="_blank" rel="noopener noreferrer">
                  <Button>Download File</Button>
                </a>
              </div>
            ) : null}
          </div>

          {/* Renditions */}
          {renditions.length > 0 && <RenditionList renditions={renditions} />}
        </div>

        {/* Metadata sidebar */}
        <aside>
          <AssetDetail asset={asset} />
        </aside>
      </div>
    </div>
  );
}
