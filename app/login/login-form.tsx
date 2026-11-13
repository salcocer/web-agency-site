"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { SubmitButton } from "@/components/form";
import { sendMagicLink } from "./actions";

const linkErrors: Record<string, string> = {
  link: "That sign-in link has expired or was already used. Request a new one below.",
};

// The form itself renders statically; only the parts that read the URL wait for it.
export function LoginForm() {
  const [state, action] = useActionState(sendMagicLink, null);

  if (state?.ok) {
    return (
      <p className="notice" role="status">
        {state.ok}
      </p>
    );
  }

  return (
    <form action={action} className="stack">
      {!state && (
        <Suspense>
          <LinkError />
        </Suspense>
      )}
      <Suspense fallback={<input type="hidden" name="next" value="/portal" />}>
        <NextField />
      </Suspense>
      <div className="field">
        <label className="f" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      <SubmitButton pendingLabel="Sending link…">Email me a sign-in link</SubmitButton>
      {state?.error && (
        <p className="notice notice--error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

function NextField() {
  const next = useSearchParams().get("next") ?? "/portal";
  return <input type="hidden" name="next" value={next} />;
}

function LinkError() {
  const message = linkErrors[useSearchParams().get("error") ?? ""];
  if (!message) return null;
  return (
    <p className="notice notice--error" role="alert">
      {message}
    </p>
  );
}
