export type ProgressSource = {
  completed?: number | string;
  total?: number | string;
};

export type StudyProgressGroup = {
  exams?: ProgressSource;
  videos?: ProgressSource;
};

function ratio(source: ProgressSource | undefined): number {
  const completed = Number(source?.completed || 0);
  const total = Number(source?.total || 0);
  return total > 0 ? completed / total : 0;
}

export function calculateStudyProgress(
  group: StudyProgressGroup | null | undefined,
): number {
  const examTotal = Number(group?.exams?.total || 0);
  const videoTotal = Number(group?.videos?.total || 0);
  let value = 0;

  if (examTotal > 0 && videoTotal > 0) {
    value = ratio(group?.exams) * 70 + ratio(group?.videos) * 30;
  } else if (examTotal > 0) {
    value = ratio(group?.exams) * 100;
  } else if (videoTotal > 0) {
    value = ratio(group?.videos) * 100;
  }

  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : 0;
}

export function progressColor(value: number): string {
  if (value >= 80) return "#49982b";
  if (value >= 50) return "#df984d";
  return "#b85551";
}
