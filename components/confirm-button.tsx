"use client";

import type { ReactNode } from "react";

// A submit button that asks before doing something that can't be undone.
export function ConfirmButton({ message, children }: { message: string; children: ReactNode }) {
  return (
    <button
      type="submit"
      className="link-btn"
      style={{ fontSize: 14 }}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
