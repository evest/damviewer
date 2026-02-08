"use client";

import { useEffect, useReducer } from "react";
import type { CmpImageDetail, CmpLineage } from "@/lib/cmp/types";

interface CmpDataState {
  image: CmpImageDetail | null;
  lineages: CmpLineage[] | null;
  imageLoading: boolean;
  lineagesLoading: boolean;
  imageError: string | null;
  lineagesError: string | null;
}

type CmpDataAction =
  | { type: "IMAGE_SUCCESS"; payload: CmpImageDetail }
  | { type: "IMAGE_ERROR"; payload: string }
  | { type: "LINEAGES_SUCCESS"; payload: CmpLineage[] }
  | { type: "LINEAGES_ERROR"; payload: string };

function reducer(state: CmpDataState, action: CmpDataAction): CmpDataState {
  switch (action.type) {
    case "IMAGE_SUCCESS":
      return { ...state, image: action.payload, imageLoading: false };
    case "IMAGE_ERROR":
      return { ...state, imageError: action.payload, imageLoading: false };
    case "LINEAGES_SUCCESS":
      return { ...state, lineages: action.payload, lineagesLoading: false };
    case "LINEAGES_ERROR":
      return { ...state, lineagesError: action.payload, lineagesLoading: false };
  }
}

export function useCmpData(assetId: string, isImage: boolean) {
  const [state, dispatch] = useReducer(reducer, {
    image: null,
    lineages: null,
    imageLoading: isImage,
    lineagesLoading: true,
    imageError: null,
    lineagesError: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    if (isImage) {
      fetch(`/api/cmp/images/${assetId}`, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status}`);
          return res.json();
        })
        .then((data) => dispatch({ type: "IMAGE_SUCCESS", payload: data }))
        .catch((err) => {
          if (err.name !== "AbortError") {
            dispatch({ type: "IMAGE_ERROR", payload: err.message });
          }
        });
    }

    fetch(`/api/cmp/asset-lineages/${assetId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data) => dispatch({ type: "LINEAGES_SUCCESS", payload: data }))
      .catch((err) => {
        if (err.name !== "AbortError") {
          dispatch({ type: "LINEAGES_ERROR", payload: err.message });
        }
      });

    return () => controller.abort();
  }, [assetId, isImage]);

  return state;
}
