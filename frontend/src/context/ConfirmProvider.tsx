import { useCallback, useState, type ReactNode } from "react";
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from "./confirmContext";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

interface Pending {
  options: ConfirmOptions;
  resolve: (result: boolean) => void;
}

/**
 * window.confirm 대신 쓰는 확인 창입니다.
 * 어느 컴포넌트에서든 const confirm = useConfirm() 후
 * if (await confirm({ title: "..." })) 형태로 씁니다.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise((resolve) => {
        setPending({ options, resolve });
      }),
    []
  );

  function handleResolve(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {pending && (
        <ConfirmDialog options={pending.options} onResolve={handleResolve} />
      )}
    </ConfirmContext.Provider>
  );
}
