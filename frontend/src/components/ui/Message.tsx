import type { ReactNode } from "react";

/** 화면 가운데 한 줄 안내. 로딩·빈 상태·에러에 공통으로 씁니다. */
export function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <p className="animate-rise text-sm text-muted">{children}</p>
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="animate-rise text-sm text-danger">{children}</p>;
}
