import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "subtle" | "dashed" | "danger";
type Size = "sm" | "md";

/**
 * 버튼 생김새는 여기서만 정의합니다.
 *
 * 모든 variant는 평상시에도 테두리나 배경을 갖습니다.
 * 글자만 있는 버튼은 눌러도 되는지 알 수 없기 때문에 만들지 않습니다.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "border border-ink bg-ink text-canvas hover:opacity-90",
  secondary: "border border-line bg-canvas text-ink hover:border-ink hover:bg-raised",
  subtle: "border border-line bg-canvas text-muted hover:border-ink hover:text-ink",
  dashed:
    "border border-dashed border-line bg-canvas text-muted hover:border-ink hover:text-ink",
  danger: "border border-danger bg-danger text-canvas hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  sm: "gap-1.5 px-2.5 py-1.5 text-xs",
  md: "gap-2 px-3 py-2 text-sm",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "secondary", size = "md", className = "", type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center rounded transition duration-200 active:scale-95 disabled:cursor-default disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  );
});
