"use client";

import Image, { type ImageProps } from "next/image";
import { damLoader } from "@/lib/constants";

export function DamImage({ alt, ...props }: ImageProps) {
  return <Image loader={damLoader} alt={alt} {...props} />;
}
