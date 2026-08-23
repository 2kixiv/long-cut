import { Fragment } from "react";
import type { Note, RoadmapNode } from "../lib/api";
import { STATUS_ROW } from "../lib/status";
import { NodeActions } from "./NodeActions";
import { FileTextIcon, StatusIcon } from "./ui/icons";

/** 들여쓰기 한 단계의 폭. 가이드선이 이 칸 가운데를 지납니다. */
const GUIDE_WIDTH = 20;

interface SharedProps {
  childrenByParent: Record<number, RoadmapNode[]>;
  notesByNode: Record<number, Note[] | null>;
  pendingId: number | null;
  creatingNoteForId: number | null;
  onChangeStatus: (node: RoadmapNode) => void;
  onEdit: (node: RoadmapNode) => void;
  onAddChild: (node: RoadmapNode) => void;
  onOpenNote: (node: RoadmapNode, note: Note) => void;
  onCreateNote: (node: RoadmapNode) => void;
}

interface Props extends SharedProps {
  /** 이 노드의 기록과 하위 노드를 그립니다 */
  parent: RoadmapNode;
  /**
   * 조상 각 단계에 아직 뒤따르는 형제가 있는지.
   * true면 그 단계 자리에 세로 가이드선(│)을 계속 그립니다.
   */
  guides?: boolean[];
}

/**
 * 파일 탐색기처럼 노드의 속을 트리로 그립니다.
 * 기록(파일)이 먼저 오고 하위 노드(폴더)가 뒤따릅니다 — 탐색기에서
 * 폴더/파일을 구분해 정렬하는 것과 같은 원리입니다.
 */
export function NodeTree({ parent, guides = [], ...shared }: Props) {
  const children = shared.childrenByParent[parent.id] ?? [];
  const notes = shared.notesByNode[parent.id] ?? [];
  const total = notes.length + children.length;

  return (
    <>
      {notes.map((note, index) => (
        <NoteRow
          key={`note-${note.id}`}
          note={note}
          guides={guides}
          isLast={index === total - 1}
          onClick={() => shared.onOpenNote(parent, note)}
        />
      ))}

      {children.map((child, index) => {
        // 기록이 앞에 오므로 전체 목록 기준으로 마지막인지 따져야
        // 가이드선이 알맞은 자리에서 끊깁니다.
        const isLast = notes.length + index === total - 1;

        return (
          <Fragment key={child.id}>
            <NodeRow node={child} guides={guides} isLast={isLast} {...shared} />
            <NodeTree parent={child} guides={[...guides, !isLast]} {...shared} />
          </Fragment>
        );
      })}
    </>
  );
}

interface GuideProps {
  guides: boolean[];
  isLast: boolean;
}

/** 조상 단계의 세로선과 이 행의 ├ / └ 꺾쇠 */
function Guides({ guides, isLast }: GuideProps) {
  return (
    <>
      {guides.map((show, index) => (
        <span
          key={index}
          className="relative shrink-0"
          style={{ width: GUIDE_WIDTH }}
        >
          {show && <span className="absolute top-0 left-1/2 h-full w-px bg-line" />}
        </span>
      ))}

      <span className="relative shrink-0" style={{ width: GUIDE_WIDTH }}>
        <span
          className={`absolute top-0 left-1/2 w-px bg-line ${isLast ? "h-1/2" : "h-full"}`}
        />
        <span className="absolute top-1/2 left-1/2 h-px w-1/2 bg-line" />
      </span>
    </>
  );
}

interface NodeRowProps extends SharedProps, GuideProps {
  node: RoadmapNode;
}

function NodeRow({
  node,
  guides,
  isLast,
  pendingId,
  creatingNoteForId,
  onChangeStatus,
  onEdit,
  onAddChild,
  onCreateNote,
}: NodeRowProps) {
  return (
    <div className="flex animate-rise items-stretch">
      <Guides guides={guides} isLast={isLast} />

      <div className="group/row relative flex items-center py-1">
        <NodeActions
          node={node}
          pending={pendingId === node.id}
          creatingNote={creatingNoteForId === node.id}
          onChangeStatus={onChangeStatus}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onCreateNote={onCreateNote}
        />

        <span
          // status를 key로 두면 상태가 바뀔 때 요소가 다시 마운트되어
          // pop 애니메이션이 매번 재생됩니다.
          key={node.status}
          className={`inline-flex animate-pop items-center gap-1.5 rounded border px-2 py-1 whitespace-nowrap ${STATUS_ROW[node.status]}`}
        >
          <StatusIcon status={node.status} className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs font-medium">{node.title}</span>
        </span>
      </div>
    </div>
  );
}

interface NoteRowProps extends GuideProps {
  note: Note;
  onClick: () => void;
}

/** 기록은 테두리 없이 문서 아이콘 + 제목만 — 노드(폴더)와 구분됩니다 */
function NoteRow({ note, guides, isLast, onClick }: NoteRowProps) {
  return (
    <div className="flex animate-rise items-stretch">
      <Guides guides={guides} isLast={isLast} />

      <div className="flex items-center py-1">
        <button
          type="button"
          title={note.title}
          onClick={onClick}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 whitespace-nowrap text-muted transition hover:bg-raised hover:text-ink"
        >
          <FileTextIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs">{note.title}</span>
        </button>
      </div>
    </div>
  );
}
