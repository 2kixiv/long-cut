import type { NodeStatus } from "./api";

const STATUS_ORDER: NodeStatus[] = ["not_started", "in_progress", "done"];

export const STATUS_LABELS: Record<NodeStatus, string> = {
    not_started: "시작 전",
    in_progress: "진행 중",
    done: "완료",
};

/** 색 대신 채움 여부와 테두리 굵기로 상태를 구분합니다 */
export const STATUS_BADGES: Record<NodeStatus, string> = {
    not_started: "border border-line bg-canvas text-faint",
    in_progress: "border border-ink bg-canvas text-ink",
    done: "border border-ink bg-ink text-canvas",
};

export const STATUS_CIRCLES: Record<NodeStatus, string> = {
    not_started: "border-dashed border-line bg-surface text-faint",
    in_progress: "border-ink bg-canvas text-ink ring-4 ring-raised",
    done: "border-ink bg-ink text-canvas",
};

/** 버튼을 누를 때마다 시작 전 → 진행 중 → 완료 → 시작 전으로 순환합니다 */
export function nextStatus(status: NodeStatus): NodeStatus {
    const index = STATUS_ORDER.indexOf(status);
    return STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
}
