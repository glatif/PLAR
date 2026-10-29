import { ArrowRight, Check, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { HeroPreview } from "@/components/site/hero-preview";
import { ButtonLink } from "@/components/ui/button";
import { commitments, journey, roles } from "@/lib/content";

function SectionHeading({ kicker, title, intro }: { kicker: string; title: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">{kicker}</p>
      <h2 className="text-balance mt-3 text-[32px] font-bold leading-[38px] tracking-[-0.022em] sm:text-[40px] sm:leading-[46px]">
        {title}
      </h2>
      {intro ? <p className="text-balance mt-4 text-[17px] leading-[26px] text-label-2">{intro}</p> : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[820px]" aria-hidden />
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-accent-subtle px-3 py-1.5 text-[13px] font-medium text-accent-ink">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              TRU Open Learning · Prior Learning Assessment &amp; Recognition
            </p>
            <h1 className="text-balance mt-6 text-[44px] font-bold leading-[48px] tracking-[-0.035em] sm:text-[60px] sm:leading-[62px]">
              Prior learning, recognised <span className="text-accent">with care.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[19px] leading-[29px] text-label-2">
              One secure home for the Competency-based Portfolio journey, from a student&rsquo;s first readiness check to
              credit on their transcript. AI handles the repetitive work. People make every decision.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/sign-in" size="lg">
                Sign in <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
              <ButtonLink href="/#journey" size="lg" variant="neutral">
                See how it works
              </ButtonLink>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-label-2">
              {["People decide", "Never used to train AI", "WCAG 2.2 AA"].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <Check aria-hidden className="size-4 text-accent" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <HeroPreview />
        </section>

        {/* Journey */}
        <section id="journey" className="scroll-mt-24 border-t border-separator bg-surface py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              kicker="How it works"
              title="The whole journey, in one place."
              intro="Today the process runs across email, Moodle, Word documents and calendars. The platform brings each stage together, with AI helping where the work is repetitive."
            />
            <ol className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {journey.map((step, i) => (
                <li key={step.title} className="card flex flex-col p-6 transition-shadow duration-250 ease-calm hover:shadow-2">
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-sm bg-accent-subtle text-accent">
                      <step.icon aria-hidden className="size-5" />
                    </span>
                    <span className="text-[13px] font-semibold text-label-2">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.01em]">{step.title}</h3>
                  <p className="text-[14px] font-medium text-accent-ink">{step.summary}</p>
                  <p className="mt-3 text-[15px] leading-[22px] text-label-2">{step.detail}</p>
                  {step.ai ? (
                    <p className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-medium text-accent">
                      <Sparkles aria-hidden className="size-3.5" />
                      AI helps: {step.ai}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="scroll-mt-24 py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              kicker="Who it's for"
              title="Built around the people in the process."
              intro="Each person sees exactly what they need, and nothing they shouldn't."
            />
            <div className="mt-16 grid gap-4 md:grid-cols-2">
              {roles.map((role) => (
                <article key={role.slug} className="card flex flex-col gap-5 p-7 sm:flex-row">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-teal-400 to-teal-700 text-white shadow-2">
                    <role.icon aria-hidden className="size-6" />
                  </span>
                  <div>
                    <h3 className="text-[20px] font-semibold tracking-[-0.01em]">{role.title}</h3>
                    <p className="mt-1 text-[15px] leading-[22px] text-label-2">{role.blurb}</p>
                    <ul className="mt-4 space-y-2">
                      {role.points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-[15px] leading-[22px]">
                          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.5} />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section id="trust" className="scroll-mt-24 px-4 pb-24 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-xl bg-teal-950 px-6 py-16 text-white sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_90%_0%,rgba(59,181,170,0.45),transparent_70%),radial-gradient(50%_50%_at_0%_100%,rgba(13,127,119,0.6),transparent_70%)]"
            />
            <div className="relative">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-teal-300">Our commitments</p>
              <h2 className="text-balance mt-3 max-w-2xl text-[32px] font-bold leading-[38px] tracking-[-0.022em] sm:text-[40px] sm:leading-[46px]">
                AI assists. People decide.
              </h2>
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {commitments.map((c) => (
                  <div
                    key={c.title}
                    className="rounded-md bg-white/[0.07] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
                  >
                    <c.icon aria-hidden className="size-6 text-teal-300" />
                    <h3 className="mt-4 text-[17px] font-semibold">{c.title}</h3>
                    <p className="mt-2 text-[14px] leading-[21px] text-white/75">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
