"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export type FormState = { error?: string; ok?: string } | null;
export type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

// A form bound to a Server Action that shows the action's error or success message.
export function ActionForm({
  action,
  children,
  className,
  style,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className} style={style}>
      {children}
      {state?.error && (
        <p className="notice notice--error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="notice" role="status">
          {state.ok}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  className = "btn",
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}
