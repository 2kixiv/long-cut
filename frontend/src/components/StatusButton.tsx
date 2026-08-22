import type { NodeStatus } from "../lib/api";
import { STATUS_BADGES, STATUS_LABELS, nextStatus } from "../lib/status";

interface Props {
  status: NodeStatus;
  pending: boolean;
  compact?: boolean;
  onClick: () => void;
}

/** 누를 때마다 시작 전 → 진행 중 → 완료 로 순환하는 상태 배지 */
export function StatusButton({ status, pending, compact = false, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={`누르면 '${STATUS_LABELS[nextStatus(status)]}'로 바뀝니다`}
      className={`shrink-0 cursor-pointer rounded-full font-medium transition duration-200 active:scale-95 disabled:cursor-default disabled:opacity-50 ${
        STATUS_BADGES[status]
      } ${compact ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"}`}
    >
      <span key={status} className="inline-block animate-rise">
        {pending ? "변경 중..." : STATUS_LABELS[status]}
      </span>
    </button>
  );
}
