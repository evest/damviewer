import { Suspense } from "react";
import Link from "next/link";
import { SearchInput } from "@/app/components/ui/SearchInput";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0 text-lg font-semibold">
          DAM Viewer
        </Link>
        <div className="flex flex-1 justify-center">
          <Suspense>
            <SearchInput />
          </Suspense>
        </div>
        <div className="hidden w-[100px] sm:block" />
      </div>
    </header>
  );
}
