import { Suspense } from "react";
import { Bell, Search } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { WorkspaceNav } from "@/components/app/workspace-nav";
import { ViewerMenu } from "@/components/app/viewer-menu";

/** Authenticated app shell: glass top bar and glass sidebar over solid content. */
export default function WorkspaceLayout({ children }: LayoutProps<"/workspace">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="glass sticky top-0 z-40 flex h-14 items-center gap-4 px-4 sm:px-6">
        <BrandMark href="/workspace" />
        <div className="mx-auto hidden w-full max-w-md md:block">
          <label className="relative block">
            <span className="sr-only">Search cases</span>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-label-2" />
            <input
              type="search"
              placeholder="Search cases (coming in M1)"
              disabled
              className="h-9 w-full rounded-full bg-fill-1 pl-10 pr-4 text-[14px] placeholder:text-label-2 disabled:cursor-not-allowed"
            />
          </label>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Notifications"
            className="flex size-9 items-center justify-center rounded-full text-label-2 transition-colors hover:bg-fill-1 hover:text-label"
          >
            <Bell aria-hidden className="size-[18px]" />
          </button>
          <Suspense fallback={<span className="size-8 animate-pulse rounded-full bg-fill-1" />}>
            <ViewerMenu />
          </Suspense>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="glass sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[260px] shrink-0 overflow-y-auto p-4 lg:block">
          <Suspense>
            <WorkspaceNav />
          </Suspense>
        </aside>
        <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 lg:hidden">
              <Suspense>
                <WorkspaceNav variant="tabs" />
              </Suspense>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
