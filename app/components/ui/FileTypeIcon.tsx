"use client";

import { FileIcon, defaultStyles } from "react-file-icon";

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-photoshop": "psd",
  "image/vnd.adobe.photoshop": "psd",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/webm": "webm",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-word": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "text/csv": "csv",
  "application/cmp+structured-content": "doc",
};

function getExtension(mimeType: string): string | undefined {
  if (MIME_TO_EXTENSION[mimeType]) return MIME_TO_EXTENSION[mimeType];
  // Fallback: use the part after the slash
  const ext = mimeType.split("/").pop() ?? "";
  // Return undefined for complex MIME subtypes so we show a generic icon
  if (ext.includes("vnd.") || ext.includes("+") || ext.includes(".")) return undefined;
  return ext;
}

interface FileTypeIconProps {
  mimeType: string;
  size?: number;
}

export function FileTypeIcon({ mimeType, size = 48 }: FileTypeIconProps) {
  const ext = getExtension(mimeType);
  const styles = ext
    ? (defaultStyles as Record<string, object>)[ext] ?? {}
    : {};

  return (
    <div style={{ width: size }}>
      <FileIcon extension={ext} type={ext ? undefined : "document"} {...styles} />
    </div>
  );
}
