import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { HeroPreview } from "@/components/site/hero-preview";
import { ButtonLink } from "@/components/ui/button";
import { AiSparkle, CheckCircleFilled } from "@/components/ui/filled-icons";
import { commitments, journey, roles } from "@/lib/content";

function SectionHeading({ kicker, title, intro }: { kicker: string; title: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-accent-text">{kicker}</p>
      <h2 className="text-balance mt-3 font-serif text-[34px] font-semibold leading-[40px] tracking-[-0.025em] sm:text-[44px] sm:leading-[50px]">
        {title}
      </h2>
      {intro ? <p className="text-balance mt-4 text-[17px] leading-[27px] text-label-2">{intro}</p> : null}
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
            <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-[13px] font-medium text-accent-ink">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              TRU Open Learning · Prior Learning Assessment &amp; Recognition
            </p>
            <h1 className="text-balance mt-6 font-serif text-[44px] font-semibold leading-[48px] tracking-[-0.03em] sm:text-[64px] sm:leading-[68px]">
              Prior learning, recognised <em className="font-medium text-accent-text">with care.</em>
            </h1>
            <p className="mt-6 max-w-xl text-[19px] leading-[30px] text-label-2">
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
                  <CheckCircleFilled className="size-4 text-accent" />
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
                <li
                  key={step.title}
                  className="flex flex-col rounded-lg bg-surface-2 p-6 shadow-1 transition-[box-shadow,transform] duration-200 ease-calm hover:-translate-y-0.5 hover:shadow-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-sm bg-accent-soft text-accent-text">
                      <step.icon aria-hidden className="size-5" />
                    </span>
                    <span className="font-mono text-[12px] text-label-2">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.015em]">{step.title}</h3>
                  <p className="text-[14px] font-medium text-accent-ink">{step.summary}</p>
                  <p className="mt-3 text-[15px] leading-[22px] text-label-2">{step.detail}</p>
                  {step.ai ? (
                    <p className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-medium text-ai">
                      <AiSparkle className="size-3.5" />
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
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-md text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                    style={{ background: role.tile }}
                  >
                    <role.icon className="size-6" />
                  </span>
                  <div>
                    <h3 className="text-[20px] font-semibold tracking-[-0.015em]">{role.title}</h3>
                    <p className="mt-1 text-[15px] leading-[22px] text-label-2">{role.blurb}</p>
                    <ul className="mt-4 space-y-2">
                      {role.points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-[15px] leading-[22px]">
                          <CheckCircleFilled className="mt-0.5 size-4 shrink-0 text-accent" />
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
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-xl bg-linear-to-br from-tangerine-950 via-[#4f1f08] to-tangerine-900 px-6 py-16 text-white sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_95%_0%,rgba(245,118,26,0.55),transparent_70%),radial-gradient(40%_50%_at_0%_100%,rgba(194,85,10,0.45),transparent_70%)]"
            />
            <div className="relative">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-tangerine-200">Our commitments</p>
              <h2 className="text-balance mt-3 max-w-2xl font-serif text-[34px] font-semibold leading-[40px] tracking-[-0.025em] sm:text-[44px] sm:leading-[50px]">
                AI assists. <em className="font-medium text-tangerine-200">People decide.</em>
              </h2>
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {commitments.map((c) => (
                  <div
                    key={c.title}
                    className="rounded-lg bg-white/[0.07] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] backdrop-blur-sm"
                  >
                    <c.icon aria-hidden className="size-6 text-tangerine-300" />
                    <h3 className="mt-4 text-[17px] font-semibold">{c.title}</h3>
                    <p className="mt-2 text-[14px] leading-[21px] text-white/80">{c.body}</p>
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
