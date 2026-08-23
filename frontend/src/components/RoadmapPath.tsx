import { Fragment } from "react";
import type { Note, RoadmapNode } from "../lib/api";
import { STATUS_BAR } from "../lib/status";
import { NodeActions } from "./NodeActions";
import { NodeTree } from "./NodeTree";
import { PlusIcon, StatusIcon } from "./ui/icons";

const STAGGER_MS = 70;
/** 최상위 화살표 바의 높이. 칸 사이 연결선을 이 높이의 절반에 맞춥니다. */
const BAR_HEIGHT = 40;
/** 화살촉이 파고드는 깊이 */
const NOTCH = 16;

interface Props {
  nodes: RoadmapNode[];
  /** 부모 id별 하위 노드 목록 */
  childrenByParent: Record<number, RoadmapNode[]>;
  /** 노드 id별 기록 목록. 트리에 상시 노출됩니다. */
  notesByNode: Record<number, Note[] | null>;
  pendingId: number | null;
  /** 기록을 새로 만드는 중인 노드 id */
  creatingNoteForId: number | null;
  onChangeStatus: (node: RoadmapNode) => void;
  onEdit: (node: RoadmapNode) => void;
  onOpenNote: (node: RoadmapNode, note: Note) => void;
  onCreateNote: (node: RoadmapNode) => void;
  onAddNode: () => void;
  onAddChildNode: (parent: RoadmapNode) => void;
}

/**
 * 최상위 노드를 가로로 나열하고, 각 노드 아래에 자기 기록과 하위 트리를
 * 파일 탐색기처럼 그립니다. 절대 좌표 대신 일반 흐름(flex)으로 배치해서
 * 제목이 길어도 잘리지 않고 옆 칸을 침범하지 않습니다.
 */
export function RoadmapPath({
  nodes,
  childrenByParent,
  notesByNode,
  pendingId,
  creatingNoteForId,
  onChangeStatus,
  onEdit,
  onOpenNote,
  onCreateNote,
  onAddNode,
  onAddChildNode,
}: Props) {
  const shared = {
    childrenByParent,
    notesByNode,
    pendingId,
    creatingNoteForId,
    onChangeStatus,
    onEdit,
    onAddChild: onAddChildNode,
    onOpenNote,
    onCreateNote,
  };

  return (
    <div className="flex items-start gap-4 pb-4">
      {nodes.map((node, index) => (
        <Fragment key={node.id}>
          {index > 0 && <StepConnector />}

          <div
            className="flex animate-rise flex-col gap-2"
            style={{ animationDelay: `${index * STAGGER_MS}ms` }}
          >
            <div className="group/row relative flex w-fit items-center">
              <NodeActions
                node={node}
                pending={pendingId === node.id}
                creatingNote={creatingNoteForId === node.id}
                onChangeStatus={onChangeStatus}
                onEdit={onEdit}
                onAddChild={onAddChildNode}
                onCreateNote={onCreateNote}
              />

              <span
                // status를 key로 두면 상태가 바뀔 때 요소가 다시 마운트되어
                // pop 애니메이션이 매번 재생됩니다.
                key={node.status}
                style={{
                  height: BAR_HEIGHT,
                  clipPath: `polygon(0 0, calc(100% - ${NOTCH}px) 0, 100% 50%, calc(100% - ${NOTCH}px) 100%, 0 100%)`,
                }}
                className={`inline-flex animate-pop items-center gap-2 pr-7 pl-3.5 font-medium whitespace-nowrap ${STATUS_BAR[node.status]}`}
              >
                <StatusIcon status={node.status} className="h-4 w-4 shrink-0" />
                <span className="text-sm">{node.title}</span>
              </span>
            </div>

            <NodeTree parent={node} {...shared} />
          </div>
        </Fragment>
      ))}

      <StepConnector />

      <button
        type="button"
        title="새 최상위 단계를 추가합니다"
        onClick={onAddNode}
        style={{ height: BAR_HEIGHT, animationDelay: `${nodes.length * STAGGER_MS}ms` }}
        className="flex shrink-0 animate-rise cursor-pointer items-center gap-2 rounded border-2 border-dashed border-line px-3.5 text-faint transition hover:border-ink hover:text-ink active:scale-95"
      >
        <PlusIcon className="h-4 w-4 shrink-0" />
        <span className="text-sm whitespace-nowrap">단계 추가</span>
      </button>
    </div>
  );
}

/** 최상위 노드 사이를 잇는 짧은 가로 점선. 바의 세로 가운데에 맞춥니다. */
function StepConnector() {
  return (
    <span
      aria-hidden="true"
      className="w-6 shrink-0 border-t-2 border-dotted border-line"
      style={{ marginTop: BAR_HEIGHT / 2 }}
    />
  );
}
