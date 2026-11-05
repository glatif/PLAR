"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { signIn, type SignInState } from "@/app/sign-in/actions";
import { AlertFilled } from "@/components/ui/filled-icons";

const field =
  "h-11 w-full rounded-sm border border-border-strong bg-surface px-3.5 text-[16px] text-label outline-none transition-[border-color,box-shadow] placeholder:text-label-2/75 hover:border-[#6f6c67] focus:border-accent focus:shadow-[0_0_0_4px_var(--focus-ring)]";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-sm bg-accent text-[17px] font-semibold text-on-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(138,59,15,0.25)] transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? <span className="size-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden /> : null}
      {pending ? "Signing in…" : "Sign in"}
      {pending ? null : <ArrowRight aria-hidden className="size-4" />}
    </button>
  );
}

/** Email and password sign-in. Errors appear under the fields and say what to do next. */
export function SignInForm() {
  const [state, action] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-[14px] font-[550]">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} placeholder="name@example.test" className={field} aria-describedby={state.error ? "sign-in-error" : undefined} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-[14px] font-[550]">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" className={field} aria-describedby={state.error ? "sign-in-error" : undefined} />
      </div>
      {state.error ? (
        <p id="sign-in-error" role="alert" className="flex items-center gap-2 text-[13px] leading-[18px] text-danger">
          <AlertFilled className="size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}
      <Submit />
    </form>
  );
}
