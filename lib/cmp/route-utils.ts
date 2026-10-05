import "server-only";
import { NextResponse } from "next/server";
import { CmpApiError, isCmpWriteEnabled } from "./client";

/**
 * Turns a failed CMP call into a JSON error response. CMP's 4xx responses are
 * passed through with their body, so validation errors reach the editor UI.
 */
export function cmpErrorResponse(error: unknown, message: string) {
  console.error(`${message}:`, error);
  if (error instanceof CmpApiError && error.status >= 400 && error.status < 500) {
    return NextResponse.json({ error: message, detail: error.body }, { status: error.status });
  }
  return NextResponse.json({ error: message }, { status: 502 });
}

/** Returns a 403 response when write-back is disabled, otherwise null. */
export function writeDisabledResponse() {
  return isCmpWriteEnabled()
    ? null
    : NextResponse.json(
        { error: "CMP write-back is disabled. Set ENABLE_CMP_WRITE=true to enable it." },
        { status: 403 }
      );
}
