declare module "react-file-icon" {
  import { ComponentType } from "react";

  interface FileIconProps {
    color?: string;
    extension?: string;
    fold?: boolean;
    foldColor?: string;
    glyphColor?: string;
    gradientColor?: string;
    gradientOpacity?: number;
    labelColor?: string;
    labelTextColor?: string;
    labelTextStyle?: object;
    labelUppercase?: boolean;
    radius?: number;
    type?: "3d" | "acrobat" | "android" | "audio" | "binary" | "code" | "compressed" | "document" | "drive" | "font" | "image" | "presentation" | "settings" | "spreadsheet" | "vector" | "video";
  }

  export const FileIcon: ComponentType<FileIconProps>;
  export const defaultStyles: Record<string, Partial<FileIconProps>>;
}
