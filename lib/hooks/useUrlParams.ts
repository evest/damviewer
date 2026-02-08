"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useUrlParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (modify: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      modify(params);
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams],
  );

  return { searchParams, updateParams };
}
