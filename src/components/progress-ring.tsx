import { progressColor } from "@/lib/domain/progress";

export function ProgressRing({ label, value }: { label: string; value: number }) {
  const rounded = Math.round(value);
  const color = progressColor(value);

  return (
    <figure className="progress-figure">
      <div
        className="progress-ring"
        style={{
          background: `conic-gradient(${color} ${rounded}%, #e4e8eb ${rounded}% 100%)`,
        }}
        role="img"
        aria-label={`${label}: ${rounded}% complete`}
      >
        <div className="progress-ring-inner">
          <strong style={{ color }}>{rounded}%</strong>
          <span>complete</span>
        </div>
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}
