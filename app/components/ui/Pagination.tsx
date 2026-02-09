"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE } from "@/lib/constants";
import { useUrlParams } from "@/lib/hooks/useUrlParams";

interface PaginationProps {
  total: number;
  page: number;
}

export function Pagination({ total, page }: PaginationProps) {
  const { updateParams } = useUrlParams();

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  const hasPrev = page > 1;
  const hasNext = page * PAGE_SIZE < total;

  function navigate(newPage: number) {
    updateParams((params) => {
      params.delete("page");
      if (newPage > 1) {
        params.set("page", String(newPage));
      }
    });
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
          onClick={() => navigate(1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => navigate(page + 1)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
