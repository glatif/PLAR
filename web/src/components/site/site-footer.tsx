import { BrandMark } from "@/components/ui/brand-mark";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-separator">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <BrandMark />
          <p className="max-w-md text-[13px] leading-[18px] text-label-2">
            A secure platform for the Competency-based Portfolio process at Thompson Rivers University Open Learning,
            Prior Learning Assessment &amp; Recognition.
          </p>
          <p className="text-[13px] text-label-2">
            Questions about PLAR?{" "}
            <a className="font-medium text-accent-text hover:underline hover:underline-offset-2" href="mailto:plar@tru.ca">
              plar@tru.ca
            </a>
          </p>
        </div>
        <p className="text-[13px] leading-[19px] text-label-2">
          Thompson Rivers University campuses are on the traditional lands of the Tk&#8217;emlúps te Secwépemc (Kamloops
          campus) and the T&#8217;exelc (Williams Lake campus) within Secwepemcúl&#8217;ecw, the traditional and unceded
          territory of the Secwépemc.
        </p>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-separator px-4 py-5 text-[12px] text-label-2 sm:flex-row sm:justify-between sm:px-6">
        <span>Preview build. Content and features are drafts for discussion.</span>
        <span>Your data is never used to train AI.</span>
      </div>
    </footer>
  );
}
