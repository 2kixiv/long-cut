import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "secondary" | "subtle" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  secondary: "border-line bg-canvas text-ink hover:border-ink hover:bg-raised",
  subtle: "border-line bg-canvas text-muted hover:border-ink hover:text-ink",
  danger: "border-line bg-canvas text-muted hover:border-danger hover:text-danger",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 아이콘만 있으므로 화면에 안 보이는 이름이 반드시 필요합니다 */
  label: string;
  icon: ReactNode;
  variant?: Variant;
  size?: Size;
}

export function IconButton({
  label,
  icon,
  variant = "subtle",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded border transition duration-200 active:scale-90 disabled:cursor-default disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
}
