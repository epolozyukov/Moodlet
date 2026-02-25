interface StatsBarsProps {
  hunger: number;
  hygiene: number;
  energy: number;
  mood: number;
}

interface StatBarProps {
  label: string;
  value: number;
  isDerived?: boolean;
}

function getBarColor(value: number): string {
  if (value >= 80) return "bg-green-600";
  if (value >= 50) return "bg-yellow-500";
  if (value >= 20) return "bg-orange-500";
  return "bg-red-600";
}

function StatBar({ label, value, isDerived = false }: StatBarProps) {
  const isLow = value < 20;
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="mb-2" data-low={isLow ? "" : undefined}>
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-gb-dark text-xs">
          {label}
          {isDerived && <span className="opacity-60"> (derived)</span>}
        </span>
        <span className="font-mono text-gb-dark text-xs">{Math.round(clamped)}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={`h-3 border-2 border-gb-dark bg-gb-light shadow-pixel-inset ${
          isDerived ? "border-dashed" : ""
        } ${isLow ? "animate-pulse" : ""}`}
      >
        <div
          className={`h-full transition-none ${getBarColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default function StatsBars({ hunger, hygiene, energy, mood }: StatsBarsProps) {
  return (
    <div className="w-full">
      <StatBar label="Hunger" value={hunger} />
      <StatBar label="Hygiene" value={hygiene} />
      <StatBar label="Energy" value={energy} />
      <StatBar label="Mood" value={mood} isDerived />
    </div>
  );
}
