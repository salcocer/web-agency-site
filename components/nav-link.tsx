"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// A sidebar link that marks itself as the current page.
export function NavLink({
  href,
  exact = false,
  className,
  children,
}: {
  href: string;
  exact?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={[className, active && "on"].filter(Boolean).join(" ") || undefined}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
