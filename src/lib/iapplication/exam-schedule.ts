import type { IApplicationExamSchedule } from "@/lib/iapplication/types";

export type LegacyExamDates = {
  lawDate?: string | null;
  tradeDate?: string | null;
};

export function effectiveExamSchedule(
  schedule: IApplicationExamSchedule | null | undefined,
  legacyDates: LegacyExamDates | undefined,
  applicationCount: number,
): IApplicationExamSchedule | null {
  if (applicationCount !== 1) return schedule ?? null;

  const lawDate = schedule?.law_exam_scheduled_at || legacyDates?.lawDate || null;
  const tradeDate = schedule?.trade_exam_scheduled_at || legacyDates?.tradeDate || null;
  if (!schedule && !lawDate && !tradeDate) return null;

  const bothScheduled = Boolean(lawDate && tradeDate);
  return {
    ...schedule,
    law_exam_scheduled_at: lawDate,
    trade_exam_scheduled_at: tradeDate,
    scheduled: schedule?.scheduled ?? bothScheduled,
    state: schedule?.state || (bothScheduled ? "SCHEDULED" : "PARTIALLY_SCHEDULED"),
  };
}
