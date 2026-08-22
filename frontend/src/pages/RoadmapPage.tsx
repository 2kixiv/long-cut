import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import {
  createNode,
  getNodes,
  updateNode,
  updateRoadmap,
  type Roadmap,
  type RoadmapNode,
} from "../lib/api";
import { buildTree } from "../lib/tree";
import { nextStatus } from "../lib/status";
import { RoadmapPath } from "../components/RoadmapPath";
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

  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [addingRoot, setAddingRoot] = useState(false);
  const [creating, setCreating] = useState(false);

  // 방사형 도구에서 띄우는 폼. 대상 노드를 담고 있으며 null이면 닫힌 상태입니다.
  const [editingNode, setEditingNode] = useState<RoadmapNode | null>(null);
  const [parentNode, setParentNode] = useState<RoadmapNode | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingNodeId, setSavingNodeId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getNodes(id);
        if (!cancelled) setNodes(data);
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

  const tree = useMemo(() => buildTree(nodes), [nodes]);

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
    parentNodeId: number | null,
    title: string,
    description: string | null
  ): Promise<boolean> {
    setActionError(null);
    setCreating(true);

    try {
      const created = await createNode(id, {
        title,
        description,
        parent_node_id: parentNodeId,
      });

      // buildTree가 order_index로 다시 정렬하므로 뒤에 붙여도 됩니다
      setNodes((prev) => [...prev, created]);
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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex animate-rise items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {roadmap.title}
          </h1>
          {roadmap.description && (
            <p className="text-sm text-muted">{roadmap.description}</p>
          )}
        </div>

        <Button
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

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-muted">불러오는 중...</p>
      ) : error ? null : (
        <>
          {tree.length === 0 && (
            <p className="animate-rise text-center text-sm text-muted">
              아직 단계가 없습니다. 아래 + 를 눌러 첫 단계를 만들어 보세요.
            </p>
          )}

          <RoadmapPath
            nodes={tree}
            selectedId={selectedId}
            pendingId={pendingId}
            onSelect={setSelectedId}
            onChangeStatus={handleChangeStatus}
            onEdit={(node) => {
              setActionError(null);
              setEditingNode(node);
            }}
            onAddChild={(node) => {
              setActionError(null);
              setParentNode(node);
            }}
            onAddRoot={() => {
              setActionError(null);
              setAddingRoot(true);
            }}
          />
        </>
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

      {parentNode && (
        <Modal onClose={() => setParentNode(null)}>
          {(close) => (
            <>
              <h2 className="text-lg font-semibold tracking-tight">
                하위 단계 추가
              </h2>
              <p className="-mt-2 text-sm text-muted">
                {parentNode.title} 아래에 새 단계를 만듭니다.
              </p>

              <TitleDescriptionForm
                titleLabel="단계 제목"
                submitLabel="추가"
                submittingLabel="추가 중..."
                submitting={creating}
                onSubmit={async (title, description) => {
                  const created = await handleCreateNode(
                    parentNode.id,
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
    </div>
  );
}
