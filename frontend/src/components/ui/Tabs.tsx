interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** 밑줄이 활성 탭을 따라 움직이는 단순한 탭 전환 */
export function Tabs<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="flex border-b border-line">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`relative cursor-pointer px-3 py-2 text-sm font-medium transition-colors ${
              active ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {option.label}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 animate-rise bg-ink" />
            )}
          </button>
        );
      })}
    </div>
  );
}
