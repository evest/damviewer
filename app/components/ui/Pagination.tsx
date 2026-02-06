"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE } from "@/lib/constants";

interface PaginationProps {
  total: number;
}

export function Pagination({ total }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skip = parseInt(searchParams.get("skip") ?? "0", 10);
  const start = skip + 1;
  const end = Math.min(skip + PAGE_SIZE, total);
  const hasPrev = skip > 0;
  const hasNext = skip + PAGE_SIZE < total;

  function navigate(newSkip: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newSkip > 0) {
      params.set("skip", String(newSkip));
    } else {
      params.delete("skip");
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
          onClick={() => navigate(Math.max(0, skip - PAGE_SIZE))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => navigate(skip + PAGE_SIZE)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
