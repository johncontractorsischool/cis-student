"use client";

import {
  BookOpen,
  BriefcaseBusiness,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Home,
  Layers3,
  LogOut,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";

type NavItem = {
  active: (pathname: string) => boolean;
  href: string;
  icon: LucideIcon;
  label: string;
  mobile?: boolean;
};

const PROTECTED_PREFIXES = [
  "/account",
  "/audio",
  "/contract-forms",
  "/courses",
  "/dashboard",
  "/live",
  "/practice",
  "/reading",
  "/resources",
  "/videos",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isImmersivePath(pathname: string): boolean {
  return /\/practice\/test\/[^/]+\/attempt$/.test(pathname)
    || /\/reading\/[^/]+\/[^/]+$/.test(pathname)
    || /\/videos\/watch\/[^/]+$/.test(pathname)
    || /\/audio\/[^/]+\/[^/]+$/.test(pathname)
    || /\/live\/watch\/[^/]+$/.test(pathname);
}

const NAV_ITEMS: NavItem[] = [
  { active: (path) => path === "/dashboard", href: "/dashboard", icon: Home, label: "Home", mobile: true },
  { active: (path) => path.startsWith("/practice"), href: "/practice", icon: ClipboardCheck, label: "Practice", mobile: true },
  {
    active: (path) => ["/courses", "/videos", "/reading", "/audio", "/live"].some((prefix) => path === prefix || path.startsWith(`${prefix}/`)),
    href: "/courses",
    icon: GraduationCap,
    label: "Courses",
    mobile: true,
  },
  { active: () => false, href: "/dashboard#iapplication", icon: FileText, label: "iApplication", mobile: true },
  { active: (path) => path.startsWith("/resources"), href: "/resources", icon: Layers3, label: "Resources" },
  { active: (path) => path.startsWith("/contract-forms"), href: "/contract-forms", icon: BriefcaseBusiness, label: "Contract Forms" },
  { active: (path) => path.startsWith("/account"), href: "/account", icon: UserRound, label: "Account", mobile: true },
];

function withLanguage(href: string, language: string | null): string {
  if (language !== "es" || href.includes("#") || href === "/account" || href === "/contract-forms") return href;
  return `${href}?l=es`;
}

export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const language = searchParams.get("l");
  const protectedPath = isProtectedPath(pathname);
  const immersive = isImmersivePath(pathname);

  useEffect(() => {
    if (language === "es" || language === "en") document.documentElement.lang = language;
  }, [language]);

  if (!protectedPath || immersive) return children;

  return (
    <div className="student-shell">
      <aside className="student-sidebar">
        <Link className="student-sidebar-brand" href="/dashboard">
          <span><BookOpen aria-hidden="true" /></span>
          <div><strong>ExamPrep</strong><small>Student Portal</small></div>
        </Link>
        <nav aria-label="Student navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                aria-current={item.active(pathname) ? "page" : undefined}
                className={item.active(pathname) ? "active" : ""}
                href={withLanguage(item.href, language)}
                key={item.label}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <form action="/api/auth/logout" method="post">
          <button type="submit"><LogOut aria-hidden="true" />Sign out</button>
        </form>
      </aside>

      <div className="student-shell-content">{children}</div>

      <nav className="student-bottom-nav" aria-label="Primary navigation">
        {NAV_ITEMS.filter((item) => item.mobile).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              aria-current={item.active(pathname) ? "page" : undefined}
              className={item.active(pathname) ? "active" : ""}
              href={withLanguage(item.href, language)}
              key={item.label}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
