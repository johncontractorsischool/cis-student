"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  AlertTriangle,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Headphones,
  Layers3,
  LogOut,
  PlayCircle,
  Radio,
  RefreshCw,
  ShieldCheck,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { User } from "@/lib/api/types";
import { IApplicationJourney } from "@/components/iapplication-journey";
import type { DashboardPayload } from "@/lib/dashboard/types";
import { hasIApplicationAccess, isDemoAccount } from "@/lib/domain/demo";
import { applicationsFrom, presentAction } from "@/lib/iapplication/presentation";

const DEVICE_STORAGE_KEY = "cis:browser-device-id";
const LANGUAGE_STORAGE_KEY = "cis:demo-language";
const STALE_MS = 60_000;

const copy = {
  en: {
    audio: "Audio Course",
    continueApplication: "Continue application",
    continueReading: "Continue reading",
    journey: "Your licensing journey",
    nextStep: "Your next licensing step",
    notStarted: "Not started",
    practice: "Practice Tests",
    prepare: "Prepare for your contractor license exams",
    startListening: "Start listening",
    startPracticing: "Start practicing",
    startWatching: "Start watching",
    study: "Study",
    subtitle: "Continue where you left off or choose a study option.",
    video: "Video Course",
    welcome: "Welcome back",
  },
  es: {
    audio: "Curso de audio",
    continueApplication: "Continuar solicitud",
    continueReading: "Continuar leyendo",
    journey: "Su camino de licencia",
    nextStep: "Su próximo paso de licencia",
    notStarted: "No iniciado",
    practice: "Exámenes de práctica",
    prepare: "Prepárese para sus exámenes de licencia de contratista",
    startListening: "Comenzar a escuchar",
    startPracticing: "Comenzar a practicar",
    startWatching: "Comenzar a ver",
    study: "Estudiar",
    subtitle: "Continúe donde lo dejó o elija una opción de estudio.",
    video: "Curso de video",
    welcome: "Bienvenido de nuevo",
  },
} as const;

const LICENSING_STEPS = [
  "Licensing overview",
  "Complete your CSLB application",
  "Learn how to study",
  "Check in on your progress",
  "Review your acknowledgement letter",
  "Schedule your exams",
  "Prepare for test day",
  "Complete the final licensing steps",
] as const;

const JOURNEY_PHASES: Array<{
  description: string;
  end: number;
  icon: LucideIcon;
  iconClass: string;
  start: number;
  title: string;
}> = [
  {
    title: "CSLB Application",
    description: "Complete and submit your contractor license application.",
    start: 1,
    end: 2,
    icon: FileText,
    iconClass: "orange",
  },
  {
    title: "Prepare for Exams",
    description: "Build a study plan and prepare with your ExamPrep courses.",
    start: 3,
    end: 4,
    icon: BookOpen,
    iconClass: "purple",
  },
  {
    title: "Schedule & Pass Exams",
    description: "Schedule with PSI, prepare for test day, and pass both exams.",
    start: 5,
    end: 7,
    icon: CalendarCheck2,
    iconClass: "green",
  },
  {
    title: "Activate License",
    description: "Complete the final CSLB requirements and activate your license.",
    start: 8,
    end: 8,
    icon: BarChart3,
    iconClass: "blue",
  },
  {
    title: "Contracting With Success",
    description: "Use your resources and forms to start building your business.",
    start: 9,
    end: 9,
    icon: Trophy,
    iconClass: "purple",
  },
];

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function displayName(user: User): string {
  const name = [text(user.name), text(user.lname)].filter(Boolean).join(" ");
  return name || text(user.email) || "Student";
}

function initials(user: User): string {
  const parts = [text(user.name), text(user.lname)].filter(Boolean);
  if (parts.length) return parts.map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return text(user.email).slice(0, 2).toUpperCase() || "ST";
}

function liveIsActive(value: unknown): boolean {
  if (typeof value === "object" && value) {
    return Number((value as Record<string, unknown>).live_class_status) === 1;
  }
  return Number(value) === 1;
}

function combinedProgress(
  data: DashboardPayload["studyProgress"],
  type: "exams" | "videos",
): { completed: number; total: number } {
  const groups = [data?.law?.[type], data?.trade?.[type]];
  return groups.reduce<{ completed: number; total: number }>(
    (result, group) => ({
      completed: result.completed + Number(group?.completed || 0),
      total: result.total + Number(group?.total || 0),
    }),
    { completed: 0, total: 0 },
  );
}

function progressLabel(
  progress: { completed: number; total: number },
  fallback: string,
): string {
  if (progress.completed > 0 && progress.total > 0) {
    return `${progress.completed} of ${progress.total} complete`;
  }
  return fallback;
}

function journeyStatus(progress: number, start: number, end: number) {
  const currentStep = Math.min(progress + 1, 9);
  if (progress >= end) return { className: "complete", label: "Complete" };
  if (currentStep >= start && currentStep <= end) {
    return { className: "in-progress", label: "In progress" };
  }
  return { className: "not-started", label: "Not started" };
}

export function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [registeringDevice, setRegisteringDevice] = useState(false);
  const [deviceError, setDeviceError] = useState("");
  const [language, setLanguage] = useState<"en" | "es">(() =>
    typeof window !== "undefined" && window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "es"
      ? "es"
      : "en",
  );
  const lastLoadedAt = useRef(0);

  const load = useCallback(async (showSkeleton = false) => {
    const started = Date.now();
    if (showSkeleton) setLoading(true);
    setError("");

    try {
      const storedDeviceId = window.localStorage.getItem(DEVICE_STORAGE_KEY);
      const response = await fetch("/api/dashboard", {
        headers: storedDeviceId ? { "x-cis-device-id": storedDeviceId } : {},
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        data?: DashboardPayload;
        error?: { message?: string };
      };

      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "Unable to load your dashboard.");
      }

      if (showSkeleton) {
        const remaining = 2_000 - (Date.now() - started);
        if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      window.localStorage.setItem(DEVICE_STORAGE_KEY, payload.data.deviceId);
      if (!window.localStorage.getItem(LANGUAGE_STORAGE_KEY) && (payload.data.user.lang === "en" || payload.data.user.lang === "es")) {
        setLanguage(payload.data.user.lang);
      }
      setData(payload.data);
      lastLoadedAt.current = Date.now();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(true), 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  useEffect(() => {
    function refreshOnFocus() {
      if (Date.now() - lastLoadedAt.current >= STALE_MS) void load();
    }
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [load]);

  function changeLanguage(nextLanguage: "en" | "es") {
    setLanguage(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }

  async function registerDevice() {
    if (!data || registeringDevice) return;
    setRegisteringDevice(true);
    setDeviceError("");
    try {
      const response = await fetch("/api/device/register", { method: "POST" });
      const payload = (await response.json()) as {
        data?: DashboardPayload["deviceStatus"];
        error?: { message?: string };
      };
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to register this browser.");
      setData((current) => current ? { ...current, deviceStatus: payload.data! } : current);
      if (payload.data !== "verified") setDeviceError("The backend did not verify this browser. Please try again or contact CIS.");
    } catch (cause) {
      setDeviceError(cause instanceof Error ? cause.message : "Unable to register this browser.");
    } finally {
      setRegisteringDevice(false);
    }
  }

  const additionalTools = useMemo(() => {
    if (!data) return [];
    const user = data.user;
    const demo = isDemoAccount(user);
    const tools: Array<{ href: string; icon: LucideIcon; label: string }> = [
      { href: "/resources", icon: Layers3, label: "Resources" },
      {
        href: language === "es" ? "/live?l=es" : "/live",
        icon: Radio,
        label: language === "es" ? "Clase en vivo" : "Live Class",
      },
    ];

    if (demo || Number(user.account_type) === 1) {
      tools.push({ href: "/contract-forms", icon: BriefcaseBusiness, label: "Contract Forms" });
    }
    return tools;
  }, [data, language]);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <main className="centered-state">
        <h1>We couldn’t load your dashboard</h1>
        <p>{error || "Please try again."}</p>
        <button className="primary-button compact" onClick={() => void load(true)}>Try again</button>
      </main>
    );
  }

  const ui = copy[language];
  const user = data.user;
  const exams = combinedProgress(data.studyProgress, "exams");
  const videos = combinedProgress(data.studyProgress, "videos");
  const licensingProgress = Math.max(0, Math.min(8, Number(user.licensing_steps_progress || 0)));
  const licensingAccount = Number(user.account_type) === 1;
  const applicationAccount = hasIApplicationAccess(user);
  const liveApplications = applicationsFrom(data.iApplication);
  const showsApplicationStatus = licensingAccount || applicationAccount || liveApplications.length > 0;
  const actionPresentation = showsApplicationStatus
    ? presentAction(data.iApplication?.actionCenter?.primary_action)
    : null;
  const iApplicationAvailability = data.iApplication?.availability;
  const nextStepTitle = actionPresentation?.title || (
    showsApplicationStatus && iApplicationAvailability === "not_linked"
      ? "iApplication connection pending"
      : showsApplicationStatus && iApplicationAvailability === "not_found"
        ? "Application record not found"
        : showsApplicationStatus && iApplicationAvailability === "available" && liveApplications.length > 0
          ? "Your application is up to date"
          : licensingAccount
            ? LICENSING_STEPS[Math.min(licensingProgress, LICENSING_STEPS.length - 1)]
            : applicationAccount
              ? "Complete your CSLB application"
              : "Keep preparing for your exams"
  );
  const nextStepDescription = actionPresentation?.description || (
    showsApplicationStatus && iApplicationAvailability === "not_linked"
      ? "CIS is preparing the connection to your application record."
      : showsApplicationStatus && iApplicationAvailability === "not_found"
        ? "Contact CIS if you believe an application should appear here."
        : showsApplicationStatus && iApplicationAvailability === "unavailable"
          ? "Live application status is temporarily unavailable. Your other dashboard tools still work."
          : showsApplicationStatus && liveApplications.length > 0
            ? "There is no new licensing action for you right now."
            : showsApplicationStatus
              ? "Complete this step to keep your licensing journey moving."
              : "Continue studying to build confidence for exam day."
  );

  const deviceBlocked = !isDemoAccount(user) && data.deviceStatus !== "verified";
  if (deviceBlocked) {
    const canRegister = data.deviceStatus === "register";
    const limitReached = data.deviceStatus === "limit_reached";
    const message = canRegister
      ? data.app.registerDeviceMessage
      : limitReached
        ? data.app.deviceLimitMessage
        : "CIS could not verify this browser right now. Refresh to try the device check again.";
    return (
      <main className="journey-dashboard">
        <DashboardNotice app={data.app} />
        <header className="journey-welcome">
          <div><p className="journey-eyebrow">{ui.welcome}</p><h1>{displayName(user)}</h1><p>Verify this browser to continue to your courses.</p></div>
          <div className="journey-utilities">
            <div className="student-avatar" aria-label="Student profile"><span>{initials(user)}</span><UserRound aria-hidden="true" /></div>
            <SignOutButton />
          </div>
        </header>
        <section className="device-gate dashboard-surface" aria-labelledby="device-gate-title">
          <span className={limitReached ? "limit" : "register"}>{limitReached ? <AlertTriangle aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}</span>
          <div><p>Personal device access</p><h2 id="device-gate-title">{canRegister ? "Register this browser" : limitReached ? "Device limit reached" : "Device verification unavailable"}</h2><strong>{message}</strong></div>
          <div className="device-gate-actions">
            {canRegister ? <button type="button" disabled={registeringDevice} onClick={() => void registerDevice()}>{registeringDevice ? "Registering…" : "Register browser"}</button> : null}
            {!canRegister && !limitReached ? <button type="button" onClick={() => void load(true)}>Try again</button> : null}
            <a href="tel:+18882673926">Call 1-888-267-3926</a>
          </div>
          {deviceError ? <p className="form-error" role="alert">{deviceError}</p> : null}
        </section>
      </main>
    );
  }

  const studyCards = [
    {
      button: ui.startPracticing,
      href: language === "es" ? "/practice?l=es" : "/practice",
      icon: ClipboardCheck,
      label: ui.practice,
      status: progressLabel(exams, ui.notStarted),
    },
    {
      button: ui.startWatching,
      href: language === "es" ? "/courses/video?l=es" : "/courses/video",
      icon: PlayCircle,
      label: ui.video,
      status: progressLabel(videos, ui.notStarted),
    },
    {
      button: ui.continueReading,
      href: language === "es" ? "/courses/reading?l=es" : "/courses/reading",
      icon: BookOpen,
      label: language === "es" ? "Curso de lectura" : "Reading Course",
      status: language === "es" ? "Listo para continuar" : "Ready to continue",
    },
    {
      button: ui.startListening,
      href: language === "es" ? "/courses/audio?l=es" : "/courses/audio",
      icon: Headphones,
      label: ui.audio,
      status: ui.notStarted,
    },
  ];

  return (
    <main className="journey-dashboard">
      <DashboardNotice app={data.app} />
      {liveIsActive(data.liveClassStatus) ? (
        <Link className="journey-live-banner" href={language === "es" ? "/live?l=es" : "/live"}><span />{language === "es" ? "Clase en vivo en progreso" : "Live Class in Progress"}</Link>
      ) : null}

      <header className="journey-welcome">
        <div>
          <p className="journey-eyebrow">{ui.welcome}</p>
          <h1>{displayName(user)}</h1>
          <p>{ui.subtitle}</p>
        </div>
        <div className="journey-utilities">
          <button className="icon-button" onClick={() => void load()} aria-label="Refresh dashboard" title="Refresh dashboard">
            <RefreshCw aria-hidden="true" />
          </button>
          <div className="journey-language" aria-label="Content language">
            <button className={language === "en" ? "selected" : ""} onClick={() => changeLanguage("en")}>EN</button>
            <button className={language === "es" ? "selected" : ""} onClick={() => changeLanguage("es")}>ES</button>
          </div>
          <div className="student-avatar" aria-label="Student profile">
            <span>{initials(user)}</span>
            <UserRound aria-hidden="true" />
          </div>
          <SignOutButton />
        </div>
      </header>

      <RenewalCard renewal={data.renewal} />

      <section className="study-panel dashboard-surface" aria-labelledby="study-title">
        <div className="study-panel-heading">
          <span className="study-heading-icon"><BookOpen aria-hidden="true" /></span>
          <div>
            <h2 id="study-title">{ui.study}</h2>
            <p>{ui.prepare}</p>
          </div>
        </div>
        <div className="study-card-grid">
          {studyCards.map((card) => {
            const Icon = card.icon;
            return (
              <article className="study-card" key={card.href}>
                <Icon className="study-card-icon" aria-hidden="true" />
                <h3>{card.label}</h3>
                <p><span />{card.status}</p>
                <Link className="study-card-button" href={card.href}>{card.button}</Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="next-step-card dashboard-surface" aria-labelledby="next-step-title">
        <span className="next-step-icon"><FileText aria-hidden="true" /></span>
        <div className="next-step-copy">
          <p>{ui.nextStep}</p>
          <h2 id="next-step-title">{nextStepTitle}</h2>
          <span>{nextStepDescription}</span>
        </div>
        {actionPresentation ? (
          <span className={`next-step-state ${actionPresentation.tone}`}>{actionPresentation.label}</span>
        ) : showsApplicationStatus ? (
          <span className={`next-step-state ${iApplicationAvailability === "unavailable" ? "unavailable" : "owner-cis"}`}>
            {iApplicationAvailability === "unavailable" ? "Status unavailable" : "No action needed"}
          </span>
        ) : (
          <Link className="next-step-button" href={language === "es" ? "/practice?l=es" : "/practice"}>{ui.startPracticing}</Link>
        )}
      </section>

      {liveApplications.length && data.iApplication ? (
        <IApplicationJourney
          checklists={data.iApplicationChecklists}
          data={data.iApplication}
          legacyExamDates={{
            lawDate: data.user.test_date_law,
            tradeDate: data.user.test_date_trade,
          }}
          studyProgress={data.studyProgress}
        />
      ) : licensingAccount ? (
        <section className="journey-section" aria-labelledby="journey-title">
          <h2 id="journey-title">{ui.journey}</h2>
          <div className="journey-list dashboard-surface">
            {JOURNEY_PHASES.map((phase) => {
              const Icon = phase.icon;
              const status = journeyStatus(licensingProgress, phase.start, phase.end);
              return (
                <details className="journey-row" key={phase.title}>
                  <summary>
                    <span className={`journey-row-icon ${phase.iconClass}`}><Icon aria-hidden="true" /></span>
                    <strong>{phase.title}</strong>
                    <span className={`journey-status ${status.className}`}>{status.label}</span>
                    <ChevronDown className="journey-chevron" aria-hidden="true" />
                  </summary>
                  <div className="journey-row-detail">
                    <p>{phase.description}</p>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="more-tools" aria-labelledby="more-tools-title">
        <h2 id="more-tools-title">More tools</h2>
        <div className="more-tools-grid">
          {additionalTools.map((tool) => {
            const Icon = tool.icon;
            return <Link href={tool.href} key={tool.href}><Icon aria-hidden="true" /><span>{tool.label}</span></Link>;
          })}
        </div>
      </section>
    </main>
  );
}

function SignOutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button className="icon-button" type="submit" aria-label="Sign out" title="Sign out"><LogOut aria-hidden="true" /></button>
    </form>
  );
}

function DashboardNotice({ app }: { app: DashboardPayload["app"] }) {
  if (!app.maintenance) return null;
  return (
    <details className="dashboard-maintenance">
      <summary><AlertTriangle aria-hidden="true" />{app.maintenance.title}</summary>
      <p>{app.maintenance.description}</p>
    </details>
  );
}

function dashboardDate(value: string | null): string {
  if (!value) return "";
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function RenewalCard({ renewal }: { renewal: DashboardPayload["renewal"] }) {
  if (!renewal.buttons.length) return null;
  const extending = renewal.type === "extension";
  const relevantDate = extending
    ? renewal.extensionDate || renewal.expiresAt
    : renewal.reEnrollmentDate || renewal.expiresAt;
  return (
    <section className="renewal-card dashboard-surface" aria-labelledby="renewal-title">
      <span><RefreshCw aria-hidden="true" /></span>
      <div><p>Course access</p><h2 id="renewal-title">{extending ? "Extend access" : "Renew access"}</h2><strong>{relevantDate ? `Account expired on ${dashboardDate(relevantDate)}` : "Continue to secure checkout."}</strong></div>
      <div className="renewal-actions">
        {renewal.buttons.map((button) => <a key={`${button.label}:${button.url}`} href={button.url} target="_blank" rel="noopener noreferrer">{button.label}</a>)}
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <main className="journey-dashboard skeleton-page" aria-busy="true" aria-label="Loading dashboard">
      <div className="skeleton welcome-skeleton" />
      <div className="skeleton study-skeleton" />
      <div className="skeleton callout-skeleton" />
      <div className="skeleton journey-skeleton" />
    </main>
  );
}
