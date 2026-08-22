import { useId, type InputHTMLAttributes } from "react";

type Size = "sm" | "md";

const SIZES: Record<Size, string> = {
  sm: "px-2 py-1.5 text-sm",
  md: "px-3 py-2 text-sm",
};

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * 항상 입력창 위에 표시됩니다.
   * 무엇을 넣는 칸인지는 label로만 알립니다 —
   * placeholder는 입력을 시작하면 사라져서 설명 역할을 할 수 없습니다.
   */
  label: string;
  /** 형식 예시(예: you@example.com)에만 씁니다. 항목 이름을 여기 넣지 마세요. */
  placeholder?: string;
  size?: Size;
}

export function TextInput({
  label,
  size = "md",
  className = "",
  type = "text",
  id,
  ...rest
}: Props) {
  // id를 직접 넘기지 않아도 label과 input이 연결되도록 합니다
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-xs font-medium text-muted">
        {label}
      </label>

      <input
        id={inputId}
        type={type}
        className={`rounded border border-line bg-canvas outline-none transition-colors focus:border-ink ${SIZES[size]} ${className}`}
        {...rest}
      />
    </div>
  );
}
