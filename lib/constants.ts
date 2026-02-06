export const PAGE_SIZE = 24;

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

export function isRawFile(mimeType: string): boolean {
  return !isImage(mimeType) && !isVideo(mimeType);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function damLoader({ src, width }: { src: string; width: number }): string {
  const u = new URL(src);
  u.searchParams.set("width", String(width));
  return u.toString();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
