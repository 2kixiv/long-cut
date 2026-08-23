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
  /** 삭제 중인 노드 id */
  deletingId: number | null;
  onChangeStatus: (node: RoadmapNode) => void;
  onEdit: (node: RoadmapNode) => void;
  onOpenNote: (node: RoadmapNode, note: Note) => void;
  onCreateNote: (node: RoadmapNode) => void;
  onAddNode: () => void;
  onAddChildNode: (parent: RoadmapNode) => void;
  onDeleteNode: (node: RoadmapNode) => void;
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
  deletingId,
  onChangeStatus,
  onEdit,
  onOpenNote,
  onCreateNote,
  onAddNode,
  onAddChildNode,
  onDeleteNode,
}: Props) {
  const shared = {
    childrenByParent,
    notesByNode,
    pendingId,
    creatingNoteForId,
    deletingId,
    onChangeStatus,
    onEdit,
    onAddChild: onAddChildNode,
    onOpenNote,
    onCreateNote,
    onDelete: onDeleteNode,
  };

  return (
    // inline-flex가 핵심입니다. block 레벨 flex(그냥 "flex")는 width:auto가
    // "부모 폭에 맞추기"로 계산돼서, 안의 노드들이 그보다 훨씬 넓어도 로우
    // 자체 폭은 부모(overflow-x-auto 컨테이너)에 맞춰진 채로 고정되고,
    // 그 상태에서 넘치는 자식들만 시각적으로 삐져나오는 방식이 됩니다.
    // 이러면 scrollWidth 계산이 뒤틀려서 padding이나 스페이서를 아무리
    // 추가해도 오른쪽 끝에 여백이 안 생겼습니다. inline-flex는 콘텐츠
    // 실제 크기만큼 폭이 정해지므로 스크롤 계산이 정확해집니다.
    <div className="inline-flex items-start gap-4 pb-4">
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
                deleting={deletingId === node.id}
                onChangeStatus={onChangeStatus}
                onEdit={onEdit}
                onAddChild={onAddChildNode}
                onCreateNote={onCreateNote}
                onDelete={onDeleteNode}
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

      {/*
        overflow-x-auto 컨테이너는 padding만으로는 스크롤 끝쪽 여백을 보장 못
        하는 경우가 있어서, 실제로 폭을 차지하는 빈 요소를 마지막에 둡니다.
      */}
      <div aria-hidden="true" className="w-4 shrink-0" />
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
