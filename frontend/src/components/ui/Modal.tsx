import { useCallback, useEffect, useState, type ReactNode } from "react";

interface Props {
  onClose: () => void;
  children: (close: () => void) => ReactNode;
}

/**
 * 모바일에서는 하단 시트, 데스크톱에서는 중앙 모달로 뜹니다.
 * 닫기는 곧바로 언마운트하지 않고 나가는 애니메이션을 재생한 뒤 onClose를 부릅니다.
 * 그래서 내부에서 닫는 버튼도 onClose가 아니라 여기서 내려주는 close를 써야 합니다.
 */
export function Modal({ onClose, children }: Props) {
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => setClosing(true), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  return (
    <div
      onClick={close}
      className={`fixed inset-0 z-30 flex items-end justify-center bg-ink/30 sm:items-center sm:p-4 ${
        closing ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={() => {
          if (closing) onClose();
        }}
        className={`flex max-h-[80vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-2xl bg-canvas p-5 shadow-xl sm:rounded-2xl ${
          closing ? "animate-sheet-out" : "animate-sheet-in"
        }`}
      >
        {children(close)}
      </div>
    </div>
  );
}
