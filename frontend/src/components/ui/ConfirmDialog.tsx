import { useRef } from "react";
import type { ConfirmOptions } from "../../context/confirmContext";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface Props {
  options: ConfirmOptions;
  onResolve: (result: boolean) => void;
}

export function ConfirmDialog({ options, onResolve }: Props) {
  const {
    title,
    description,
    confirmLabel = "확인",
    cancelLabel = "취소",
    tone = "default",
  } = options;

  // 닫히는 애니메이션이 끝난 뒤에 결과를 넘기기 위해 값을 잠시 들고 있습니다
  const result = useRef(false);

  return (
    <Modal onClose={() => onResolve(result.current)}>
      {(close) => (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              title={cancelLabel}
              onClick={() => {
                result.current = false;
                close();
              }}
            >
              {cancelLabel}
            </Button>

            <Button
              title={confirmLabel}
              autoFocus
              variant={tone === "danger" ? "danger" : "primary"}
              onClick={() => {
                result.current = true;
                close();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
