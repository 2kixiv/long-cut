function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

interface Props {
  /** 완료 비율 (0~100). 초록으로 채워집니다. */
  value: number;
  /** 진행 중 비율 (0~100). value 뒤에 파란색으로 이어 채워집니다. */
  secondaryValue?: number;
  className?: string;
}

export function ProgressBar({ value, secondaryValue = 0, className = "" }: Props) {
  const primary = clamp(value);
  const combined = clamp(value + secondaryValue);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(primary)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative h-1.5 w-full overflow-hidden rounded-full bg-raised ${className}`}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-progress transition-[width] duration-500 ease-soft"
        style={{ width: `${combined}%` }}
      />
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-success transition-[width] duration-500 ease-soft"
        style={{ width: `${primary}%` }}
      />
    </div>
  );
}
