"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE } from "@/lib/constants";

interface PaginationProps {
  total: number;
  cursor: string;
  page: number;
}

export function Pagination({ total, cursor, page }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  const hasPrev = page > 1;
  const hasNext = page * PAGE_SIZE < total;

  function navigate(newPage: number, newCursor?: string) {
    const params = new URLSearchParams(searchParams.toString());

    // Remove pagination params
    params.delete("page");
    params.delete("cursor");

    if (newPage > 1) {
      params.set("page", String(newPage));
      if (newCursor) {
        params.set("cursor", newCursor);
      }
    }

    router.push(`/?${params.toString()}`);
  }

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between py-4">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={() => {
            if (page === 2) {
              // Going back to page 1 — no cursor needed
              navigate(1);
            } else {
              // Can't go backwards with cursor pagination — go to page 1
              navigate(1);
            }
          }}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => navigate(page + 1, cursor)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
