import type { RoadmapNode } from "../lib/api";
import { STATUS_LABELS, nextStatus } from "../lib/status";
import { FileTextIcon, PencilIcon, PlusIcon, StatusIcon, TrashIcon } from "./ui/icons";

interface Props {
  node: RoadmapNode;
  pending: boolean;
  creatingNote: boolean;
  deleting: boolean;
  onChangeStatus: (node: RoadmapNode) => void;
  onEdit: (node: RoadmapNode) => void;
  onAddChild: (node: RoadmapNode) => void;
  onCreateNote: (node: RoadmapNode) => void;
  onDelete: (node: RoadmapNode) => void;
}

const BUTTON =
  "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded text-muted transition hover:bg-raised hover:text-ink active:scale-90 disabled:cursor-default disabled:opacity-40";
const DELETE_BUTTON =
  "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded text-muted transition hover:bg-raised hover:text-danger active:scale-90 disabled:cursor-default disabled:opacity-40";

/**
 * 노드 위에 떠서 나타나는 도구 모음입니다.
 *
 * 흐름(flow)에 자리를 차지하지 않도록 absolute로 띄웁니다 — 예전처럼 행 안에
 * 두고 opacity만 0으로 하면 안 보이는 채로 자리를 먹어 옆이 휑해 보입니다.
 * bottom-full + pb-1 구조라 노드와 메뉴 사이에 틈이 없어, 마우스를 위로
 * 올리는 동안 hover가 끊기지 않습니다.
 */
export function NodeActions({
  node,
  pending,
  creatingNote,
  deleting,
  onChangeStatus,
  onEdit,
  onAddChild,
  onCreateNote,
  onDelete,
}: Props) {
  return (
    <div
      className="absolute bottom-full left-0 z-30 hidden pb-1 group-hover/row:block"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex animate-tool-in items-center gap-0.5 rounded-lg border border-line bg-canvas p-1 shadow-lg">
        <button
          type="button"
          disabled={pending}
          aria-label={`${STATUS_LABELS[nextStatus(node.status)]}로 바꾸기`}
          title={`${STATUS_LABELS[nextStatus(node.status)]}로 바꾸기`}
          onClick={() => onChangeStatus(node)}
          className={BUTTON}
        >
          <StatusIcon status={node.status} className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="수정"
          title="수정"
          onClick={() => onEdit(node)}
          className={BUTTON}
        >
          <PencilIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="하위 단계 추가"
          title="하위 단계 추가"
          onClick={() => onAddChild(node)}
          className={BUTTON}
        >
          <PlusIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={creatingNote}
          aria-label="새 기록"
          title="새 기록"
          onClick={() => onCreateNote(node)}
          className={BUTTON}
        >
          <FileTextIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={deleting}
          aria-label="이 단계 삭제"
          title="이 단계 삭제 (하위 단계·기록도 함께 삭제됩니다)"
          onClick={() => onDelete(node)}
          className={DELETE_BUTTON}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
