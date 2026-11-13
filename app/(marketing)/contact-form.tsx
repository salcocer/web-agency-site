"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/form";
import { submitEnquiry } from "./actions";

export function ContactForm() {
  const [state, action] = useActionState(submitEnquiry, null);
  const v = state?.values;

  if (state?.ok) {
    return (
      <div className="enquiry">
        <p className="notice" role="status">
          {state.ok}
        </p>
      </div>
    );
  }

  return (
    <form className="enquiry" action={action}>
      <div className="row2">
        <div className="field">
          <label className="f" htmlFor="f-name">Your name</label>
          <input id="f-name" name="name" autoComplete="name" required maxLength={200} defaultValue={v?.name} />
        </div>
        <div className="field">
          <label className="f" htmlFor="f-email">Email</label>
          <input id="f-email" name="email" type="email" autoComplete="email" required maxLength={320} defaultValue={v?.email} />
        </div>
      </div>
      <div className="row2">
        <div className="field">
          <label className="f" htmlFor="f-biz">Business</label>
          <input id="f-biz" name="business" placeholder="Villa, resort, clinic, café…" maxLength={200} defaultValue={v?.business} />
        </div>
        <div className="field">
          <label className="f" htmlFor="f-type">What do you need?</label>
          <select id="f-type" name="need" defaultValue={v?.need}>
            <option>A new website</option>
            <option>A redesign</option>
            <option>SEO &amp; AI search</option>
            <option>Ongoing care</option>
            <option>Not sure yet</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label className="f" htmlFor="f-msg">Message</label>
        <textarea id="f-msg" name="message" maxLength={5000} defaultValue={v?.message} />
      </div>
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="f-website">Leave this empty</label>
        <input id="f-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <SubmitButton pendingLabel="Sending…">Send enquiry</SubmitButton>
      {state?.error && (
        <p className="notice notice--error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
