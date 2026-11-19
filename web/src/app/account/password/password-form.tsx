"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertFilled } from "@/components/ui/filled-icons";
import { changePassword, type PasswordState } from "@/app/account/password/actions";

const field =
  "h-11 w-full rounded-sm border border-border-strong bg-surface px-3.5 text-[16px] text-label outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_4px_var(--focus-ring)]";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-sm bg-accent text-[17px] font-semibold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save new password"}
    </button>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<PasswordState, FormData>(changePassword, {});
  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-[14px] font-[550]">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={field} aria-describedby="password-hint" />
        <p id="password-hint" className="text-[13px] text-label-2">At least 8 characters.</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-[14px] font-[550]">Type it again</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={field} />
      </div>
      {state.error ? (
        <p role="alert" className="flex items-center gap-2 text-[13.5px] text-danger">
          <AlertFilled className="size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}
      <Submit />
    </form>
  );
}
