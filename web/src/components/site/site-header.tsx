import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { ButtonLink } from "@/components/ui/button";

const links = [
  { href: "/#journey", label: "How it works" },
  { href: "/#roles", label: "Who it's for" },
  { href: "/#trust", label: "Privacy" },
];

/** Glass top bar (design system §9.4): floats above content, never part of it. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
      <div className="glass mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-full pl-5 pr-2">
        <BrandMark />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-[14px] font-medium text-label-2 transition-colors hover:text-label"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <ButtonLink href="/sign-in" size="sm" className="h-10 px-4 text-[14px]">
          Sign in
        </ButtonLink>
      </div>
    </header>
  );
}
