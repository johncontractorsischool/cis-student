"use client";

import { CalendarDays } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { IApplicationExamSchedule } from "@/lib/iapplication/types";

export function examDateValue(value: string | null | undefined): string {
  const match = value?.match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? "";
}

function todayValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ExamDateEditor({
  applicationId,
  onSaved,
  schedule,
}: {
  applicationId: number | string;
  onSaved: (schedule: IApplicationExamSchedule) => void;
  schedule: IApplicationExamSchedule | null | undefined;
}) {
  const savedLawDate = examDateValue(schedule?.law_exam_scheduled_at);
  const savedTradeDate = examDateValue(schedule?.trade_exam_scheduled_at);
  const [lawDate, setLawDate] = useState(savedLawDate);
  const [tradeDate, setTradeDate] = useState(savedTradeDate);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const datesComplete = Boolean(lawDate && tradeDate);
  const dirty = lawDate !== savedLawDate || tradeDate !== savedTradeDate;

  async function saveDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!datesComplete || !dirty || state === "saving") return;

    setState("saving");
    setMessage("");
    try {
      const response = await fetch(
        `/api/dashboard/iapplication/exam-dates/${encodeURIComponent(String(applicationId))}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ law_date: lawDate, trade_date: tradeDate }),
        },
      );
      const payload = (await response.json()) as {
        data?: { exam_schedule?: IApplicationExamSchedule };
        error?: { message?: string };
      };
      if (!response.ok || !payload.data?.exam_schedule) {
        throw new Error(payload.error?.message || "Unable to save your exam dates.");
      }

      onSaved(payload.data.exam_schedule);
      setState("saved");
      setMessage("Exam dates saved to your application and CIS account.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to save your exam dates.");
    }
  }

  return (
    <form className="exam-date-editor" onSubmit={saveDates}>
      <header>
        <span><CalendarDays aria-hidden="true" /></span>
        <div>
          <strong>Enter your scheduled exam dates</strong>
          <p>Both dates are saved to this application and your CIS account.</p>
        </div>
      </header>

      <div className="exam-date-fields">
        <label>
          <span><i className="law" aria-hidden="true" />Law &amp; Business exam</span>
          <input
            type="date"
            min={todayValue()}
            required
            value={lawDate}
            onChange={(event) => {
              setLawDate(event.target.value);
              setState("idle");
              setMessage("");
            }}
          />
        </label>
        <label>
          <span><i className="trade" aria-hidden="true" />Trade exam</span>
          <input
            type="date"
            min={todayValue()}
            required
            value={tradeDate}
            onChange={(event) => {
              setTradeDate(event.target.value);
              setState("idle");
              setMessage("");
            }}
          />
        </label>
      </div>

      <button type="submit" disabled={!datesComplete || !dirty || state === "saving"}>
        {state === "saving"
          ? "Saving exam dates…"
          : !datesComplete
            ? "Enter both dates to save"
            : !dirty
              ? "Exam dates saved"
              : "Save exam dates"}
      </button>
      {message ? (
        <p className={`exam-date-message ${state === "error" ? "error" : ""}`} role={state === "error" ? "alert" : "status"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
