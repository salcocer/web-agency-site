import type { Enums } from "@/lib/database.types";

const TIME_ZONE = "Asia/Bangkok";

// Amounts are stored in the smallest currency unit (satang for THB).
export function formatMoney(amount: number, currency = "thb") {
  const value = amount / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  // A bare date (yyyy-mm-dd) has no time zone; read it as noon so it never shifts a day.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00+07:00`) : new Date(value);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE }).format(date);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(value));
}

type Tone = "p" | "s" | "g";

export const projectStatuses: Record<Enums<"project_status">, { label: string; tone: Tone }> = {
  discovery: { label: "Discovery", tone: "g" },
  design: { label: "In design", tone: "p" },
  build: { label: "In build", tone: "p" },
  review: { label: "In review", tone: "s" },
  live: { label: "Live", tone: "s" },
  paused: { label: "Paused", tone: "g" },
};

export const requestStatuses: Record<Enums<"request_status">, { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "p" },
  in_progress: { label: "In progress", tone: "s" },
  done: { label: "Done", tone: "g" },
};

export const chargeStatuses: Record<Enums<"charge_status">, { label: string; tone: Tone }> = {
  due: { label: "Due", tone: "p" },
  paid: { label: "Paid", tone: "s" },
  void: { label: "Void", tone: "g" },
};

// Stripe subscription statuses that still count as a running plan.
export const LIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due", "unpaid", "incomplete"];

export function subscriptionStatus(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "active":
    case "trialing":
      return { label: "Active", tone: "s" };
    case "past_due":
    case "unpaid":
      return { label: "Payment due", tone: "p" };
    case "incomplete":
      return { label: "Awaiting payment", tone: "p" };
    default:
      return { label: "Ended", tone: "g" };
  }
}
