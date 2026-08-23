import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  createNode,
  createNote,
  getNodes,
  getNotes,
  updateNode,
  updateRoadmap,
  type Note,
  type Roadmap,
  type RoadmapNode,
} from "../lib/api";
import { groupChildren, pathNodes } from "../lib/nodes";
import { nextStatus } from "../lib/status";
import { RoadmapPath } from "../components/RoadmapPath";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Modal } from "../components/ui/Modal";
import { TitleDescriptionForm } from "../components/TitleDescriptionForm";
import { Button } from "../components/ui/Button";
import { PencilIcon } from "../components/ui/icons";
import { CenteredMessage, ErrorText } from "../components/ui/Message";
import type { RoadmapsContext } from "../components/AppLayout";

export function RoadmapPage() {
  const { roadmapId } = useParams();
  const id = Number(roadmapId);

  // 로드맵 정보는 사이드바가 이미 받아왔으므로 다시 요청하지 않습니다
  const { roadmaps, loading, onRoadmapUpdated } =
    useOutletContext<RoadmapsContext>();

  if (!Number.isInteger(id) || id <= 0) {
    return <CenteredMessage>잘못된 로드맵 주소입니다</CenteredMessage>;
  }

  const roadmap = roadmaps.find((item) => item.id === id) ?? null;

  if (loading) {
    return <CenteredMessage>불러오는 중...</CenteredMessage>;
  }

  if (roadmap === null) {
    return <CenteredMessage>로드맵을 찾을 수 없습니다.</CenteredMessage>;
  }

  // key를 주면 다른 로드맵으로 옮길 때 아래 상태들이 자동으로 초기화됩니다
  return (
    <RoadmapView key={id} roadmap={roadmap} onUpdated={onRoadmapUpdated} />
  );
}

interface ViewProps {
  roadmap: Roadmap;
  onUpdated: (roadmap: Roadmap) => void;
}

function RoadmapView({ roadmap, onUpdated }: ViewProps) {
  const id = roadmap.id;
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [addingRoot, setAddingRoot] = useState(false);
  // "하위 단계 추가"로 지정된 부모 노드. null이면 닫힌 상태입니다.
  const [addingChildFor, setAddingChildFor] = useState<RoadmapNode | null>(null);
  const [creating, setCreating] = useState(false);

  // 도구에서 띄우는 수정 폼. 대상 노드를 담고 있으며 null이면 닫힌 상태입니다.
  const [editingNode, setEditingNode] = useState<RoadmapNode | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingNodeId, setSavingNodeId] = useState<number | null>(null);

  // 노드별 기록. 트리에 상시 노출되므로 노드를 불러올 때 함께 받아옵니다.
  const [notesByNode, setNotesByNode] = useState<Record<number, Note[] | null>>(
    {}
  );
  // 기록을 새로 만드는 중인 노드 id (완료되면 상세 페이지로 이동합니다)
  const [creatingNoteForId, setCreatingNoteForId] = useState<number | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getNodes(id);
        if (cancelled) return;

        setNodes(data);

        // 기록이 트리에 상시 노출되므로 노드마다 미리 받아둡니다.
        // 노드 수만큼 요청이 나가므로, 로드맵이 커지면 백엔드에
        // "로드맵의 모든 기록" 엔드포인트를 두는 편이 낫습니다.
        const entries = await Promise.all(
          data.map(
            async (node) => [node.id, await getNotes(id, node.id)] as const
          )
        );

        if (!cancelled) setNotesByNode(Object.fromEntries(entries));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "단계를 불러오지 못했습니다"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const visible = useMemo(() => pathNodes(nodes), [nodes]);
  const childrenByParent = useMemo(() => groupChildren(nodes), [nodes]);

  const doneCount = visible.filter((node) => node.status === "done").length;
  const inProgressCount = visible.filter(
    (node) => node.status === "in_progress"
  ).length;
  const progress =
    visible.length === 0 ? 0 : Math.round((doneCount / visible.length) * 100);
  const inProgressPercent =
    visible.length === 0 ? 0 : Math.round((inProgressCount / visible.length) * 100);

  // "새 기록"을 누르면 빈 기록을 바로 만들고 상세 페이지로 보냅니다.
  // 제목은 상세 페이지에서 바로 고칠 수 있습니다.
  async function handleQuickCreateNote(node: RoadmapNode) {
    setActionError(null);
    setCreatingNoteForId(node.id);

    try {
      const created = await createNote(id, node.id, {
        title: "새 기록",
        content: "",
      });

      navigate(`/roadmaps/${id}/nodes/${node.id}/notes/${created.id}`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "기록을 만들지 못했습니다"
      );
    } finally {
      setCreatingNoteForId(null);
    }
  }

  async function handleChangeStatus(node: RoadmapNode) {
    setActionError(null);
    setPendingId(node.id);

    try {
      const updated = await updateNode(id, node.id, {
        status: nextStatus(node.status),
      });

      setNodes((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "상태를 변경하지 못했습니다"
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleEditNode(
    node: RoadmapNode,
    title: string,
    description: string | null
  ): Promise<boolean> {
    setActionError(null);
    setSavingNodeId(node.id);

    try {
      const updated = await updateNode(id, node.id, { title, description });

      setNodes((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      return true;
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "단계를 수정하지 못했습니다"
      );
      return false;
    } finally {
      setSavingNodeId(null);
    }
  }

  async function handleCreateNode(
    parentId: number | null,
    title: string,
    description: string | null
  ): Promise<boolean> {
    setActionError(null);
    setCreating(true);

    try {
      const created = await createNode(id, {
        title,
        description,
        parent_node_id: parentId,
      });

      // pathNodes/groupChildren이 order_index로 다시 정렬하므로 뒤에 붙여도 됩니다
      setNodes((prev) => [...prev, created]);
      // 새 노드는 기록이 없습니다. 빈 배열을 넣어두지 않으면 트리가
      // "아직 안 불러온 상태"로 오해합니다.
      setNotesByNode((prev) => ({ ...prev, [created.id]: [] }));
      return true;
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "단계를 추가하지 못했습니다"
      );
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(
    title: string,
    description: string | null
  ): Promise<boolean> {
    setActionError(null);
    setSaving(true);

    try {
      const updated = await updateRoadmap(roadmap.id, { title, description });
      onUpdated(updated);
      return true;
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "로드맵을 수정하지 못했습니다"
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-8">
      {/* 제목·설명·진행률 요약은 읽기 편하도록 좁은 칼럼에 고정합니다 */}
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="flex animate-rise items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {roadmap.title}
            </h1>
            {roadmap.description && (
              <span
                title={roadmap.description}
                className="inline-block max-w-xs truncate rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted"
              >
                {roadmap.description}
              </span>
            )}
          </div>

          <Button
            title="로드맵 제목·설명을 수정합니다"
            size="sm"
            onClick={() => {
              setActionError(null);
              setEditing(true);
            }}
            className="shrink-0"
          >
            <PencilIcon className="h-3.5 w-3.5" />
            수정
          </Button>
        </div>

        {visible.length > 0 && (
          <div className="animate-rise mt-6 flex items-center gap-3">
            <ProgressBar
              value={progress}
              secondaryValue={inProgressPercent}
              className="max-w-xs"
            />
            <span className="shrink-0 text-xs text-muted tabular-nums">
              {doneCount}/{visible.length} · {progress}%
            </span>
          </div>
        )}

        {error && <p className="mt-6 text-sm text-danger">{error}</p>}
        {loading && <p className="mt-6 text-muted">불러오는 중...</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="animate-rise mt-6 text-center text-sm text-muted">
            아직 단계가 없습니다. 아래 + 를 눌러 첫 단계를 만들어 보세요.
          </p>
        )}
      </div>

      {/*
        경로는 사이드바를 뺀 화면 전체 폭을 씁니다. 최상위 노드가 가로로
        나열되고 각자의 하위 트리는 자기 노드 아래로만 내려가므로, 노드가
        많아져도 세로 스크롤이 끝없이 길어지지 않습니다 — 필요하면 이 영역만
        가로로 스크롤합니다.
      */}
      {!loading && !error && visible.length > 0 && (
        // pt-12: 도구 메뉴가 노드 위로 뜨므로, 맨 윗줄 메뉴가 스크롤
        // 컨테이너에 잘리지 않도록 위쪽 여유를 둡니다.
        <div className="overflow-x-auto px-4 pt-12">
          <RoadmapPath
            nodes={visible}
            childrenByParent={childrenByParent}
            notesByNode={notesByNode}
            pendingId={pendingId}
            creatingNoteForId={creatingNoteForId}
            onChangeStatus={handleChangeStatus}
            onEdit={(node) => {
              setActionError(null);
              setEditingNode(node);
            }}
            onOpenNote={(node, note) =>
              navigate(`/roadmaps/${id}/nodes/${node.id}/notes/${note.id}`)
            }
            onCreateNote={handleQuickCreateNote}
            onAddNode={() => {
              setActionError(null);
              setAddingRoot(true);
            }}
            onAddChildNode={(parent) => {
              setActionError(null);
              setAddingChildFor(parent);
            }}
          />
        </div>
      )}

      {editingNode && (
        <Modal onClose={() => setEditingNode(null)}>
          {(close) => (
            <>
              <h2 className="text-lg font-semibold tracking-tight">단계 수정</h2>

              <TitleDescriptionForm
                initialTitle={editingNode.title}
                initialDescription={editingNode.description}
                titleLabel="단계 제목"
                submitLabel="저장"
                submittingLabel="저장 중..."
                submitting={savingNodeId === editingNode.id}
                onSubmit={async (title, description) => {
                  const saved = await handleEditNode(
                    editingNode,
                    title,
                    description
                  );
                  if (saved) close();
                  return saved;
                }}
                onCancel={close}
              />

              {actionError && <ErrorText>{actionError}</ErrorText>}
            </>
          )}
        </Modal>
      )}

      {editing && (
        <Modal onClose={() => setEditing(false)}>
          {(close) => (
            <>
              <h2 className="text-lg font-semibold tracking-tight">
                로드맵 수정
              </h2>

              <TitleDescriptionForm
                initialTitle={roadmap.title}
                initialDescription={roadmap.description}
                titleLabel="로드맵 제목"
                submitLabel="저장"
                submittingLabel="저장 중..."
                submitting={saving}
                onSubmit={async (title, description) => {
                  const saved = await handleEdit(title, description);
                  if (saved) close();
                  return saved;
                }}
                onCancel={close}
              />

              {actionError && <ErrorText>{actionError}</ErrorText>}
            </>
          )}
        </Modal>
      )}

      {addingRoot && (
        <Modal onClose={() => setAddingRoot(false)}>
          {(close) => (
            <>
              <h2 className="text-lg font-semibold tracking-tight">
                새 단계 추가
              </h2>

              <TitleDescriptionForm
                titleLabel="단계 제목"
                submitLabel="추가"
                submittingLabel="추가 중..."
                submitting={creating}
                onSubmit={async (title, description) => {
                  const created = await handleCreateNode(null, title, description);
                  if (created) close();
                  return created;
                }}
                onCancel={close}
              />

              {actionError && <ErrorText>{actionError}</ErrorText>}
            </>
          )}
        </Modal>
      )}

      {addingChildFor && (
        <Modal onClose={() => setAddingChildFor(null)}>
          {(close) => (
            <>
              <h2 className="text-lg font-semibold tracking-tight">
                하위 단계 추가
              </h2>
              <p className="-mt-2 text-sm text-muted">{addingChildFor.title} 아래에</p>

              <TitleDescriptionForm
                titleLabel="단계 제목"
                submitLabel="추가"
                submittingLabel="추가 중..."
                submitting={creating}
                onSubmit={async (title, description) => {
                  const created = await handleCreateNode(
                    addingChildFor.id,
                    title,
                    description
                  );
                  if (created) close();
                  return created;
                }}
                onCancel={close}
              />

              {actionError && <ErrorText>{actionError}</ErrorText>}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
