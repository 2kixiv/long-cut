import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 생략하면 라벨 없이 렌더링됩니다 (예: 탭으로 이미 용도가 드러나는 본문 입력) */
  label?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, Props>(function TextArea(
  { label, className = "", id, ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const textarea = (
    <textarea
      ref={ref}
      id={inputId}
      className={`w-full resize-none rounded border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink ${className}`}
      {...rest}
    />
  );

  if (!label) return textarea;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-xs font-medium text-muted">
        {label}
      </label>
      {textarea}
    </div>
  );
});
