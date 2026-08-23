import type { NodeStatus } from "./api";

const STATUS_ORDER: NodeStatus[] = ["not_started", "in_progress", "done"];

export const STATUS_LABELS: Record<NodeStatus, string> = {
    not_started: "시작 전",
    in_progress: "진행 중",
    done: "완료",
};

/**
 * 노드를 나타내는 화살표 바(chevron)의 색. 세 상태 모두 배경을 꽉 채웁니다.
 *
 * 테두리(border)를 쓰면 안 됩니다 — 화살촉은 clip-path로 잘라내는데,
 * clip-path는 테두리까지 같이 잘라서 선이 화살촉을 따라가지 못하고 끊겨 보입니다.
 * 같은 이유로 box-shadow도 클리핑되어 보이지 않습니다.
 */
export const STATUS_BAR: Record<NodeStatus, string> = {
    not_started: "bg-raised text-muted",
    in_progress: "bg-progress text-canvas",
    done: "bg-success text-canvas",
};

/**
 * 파일 트리 안 하위 노드 행의 색.
 * 최상위 화살표 바처럼 색을 꽉 채우면 트리가 너무 무거워 보여서,
 * 여기서는 옅은 배경 + 상태색 테두리·글자로 눌러 표현합니다.
 */
export const STATUS_ROW: Record<NodeStatus, string> = {
    not_started: "border-line bg-canvas text-muted hover:border-ink hover:text-ink",
    in_progress: "border-progress bg-progress/10 text-progress",
    done: "border-success bg-success/10 text-success",
};

/** 버튼을 누를 때마다 시작 전 → 진행 중 → 완료 → 시작 전으로 순환합니다 */
export function nextStatus(status: NodeStatus): NodeStatus {
    const index = STATUS_ORDER.indexOf(status);
    return STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
}
