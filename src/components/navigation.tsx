"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/vyber", label: "Výběr přednášek" },
    { href: "/prednasky", label: "Přednášky" },
    { href: "/muj-program", label: "Můj program" },
  ];

  async function logout() {
    setMenuOpen(false);
    await createClient().auth.signOut();
    router.push("/");
  }

  function linkClassName(active: boolean) {
    return `rounded-lg px-3 py-2 font-medium transition-colors ${
      active
        ? "bg-slate-100 font-bold text-ink underline decoration-sun decoration-2 underline-offset-4"
        : "text-muted hover:bg-slate-50 hover:text-ink"
    }`;
  }

  return (
    <nav
      aria-label="Hlavní navigace"
      className="border-b border-slate-200/80 bg-white/95 shadow-sm"
    >
      <div className="mx-auto flex max-w-6xl items-center px-5 py-3 text-sm">
        <Link
          className="mr-auto rounded-lg"
          href="/vyber"
          onClick={() => setMenuOpen(false)}
        >
          <span className="relative block h-10 w-28 overflow-hidden">
            <Image
              src="/plejady-logo.svg"
              alt="Plejády"
              fill
              sizes="112px"
              className="object-cover object-[center_52%]"
            />
          </span>
        </Link>
        <div className="hidden items-center gap-x-1 sm:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={linkClassName(active)}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            className="rounded-lg px-3 py-2 font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
            onClick={logout}
          >
            Odhlásit se
          </button>
        </div>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Zavřít navigaci" : "Otevřít navigaci"}
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-ink hover:bg-slate-50 sm:hidden"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            {menuOpen ? "×" : "☰"}
          </span>
        </button>
      </div>
      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-200 px-5 py-3 sm:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1 text-sm">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={linkClassName(active)}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <button
              className="rounded-lg px-3 py-2 text-left font-medium text-muted underline-offset-4 hover:bg-slate-50 hover:text-ink hover:underline"
              onClick={logout}
            >
              Odhlásit se
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
