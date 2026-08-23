import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { deleteNote, getNote, summarizeNote, updateNote, type Note } from "../lib/api";
import { useConfirm } from "../hooks/useConfirm";
import { useAttachments } from "../hooks/useAttachments";
import type { RoadmapsContext } from "../components/AppLayout";
import { NoteEditor } from "../components/NoteEditor";
import { NoteSummaryCallout } from "../components/NoteSummaryCallout";
import { CenteredMessage, ErrorText } from "../components/ui/Message";

export function NoteDetailPage() {
  const { roadmapId, nodeId, noteId } = useParams();
  const id = Number(roadmapId);
  const nId = Number(nodeId);
  const noId = Number(noteId);

  const { roadmaps } = useOutletContext<RoadmapsContext>();

  if (
    !Number.isInteger(id) ||
    !Number.isInteger(nId) ||
    !Number.isInteger(noId)
  ) {
    return <CenteredMessage>잘못된 주소입니다</CenteredMessage>;
  }

  const roadmap = roadmaps.find((item) => item.id === id) ?? null;

  return (
    <NoteDetailView
      key={noId}
      roadmapId={id}
      nodeId={nId}
      noteId={noId}
      roadmapTitle={roadmap?.title}
    />
  );
}

interface ViewProps {
  roadmapId: number;
  nodeId: number;
  noteId: number;
  roadmapTitle?: string;
}

function NoteDetailView({
  roadmapId,
  nodeId,
  noteId,
  roadmapTitle,
}: ViewProps) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const attachmentsState = useAttachments(roadmapId, nodeId, noteId);

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getNote(roadmapId, nodeId, noteId);
        if (!cancelled) setNote(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "기록을 불러오지 못했습니다"
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
  }, [roadmapId, nodeId, noteId]);

  async function handleSave(title: string, content: string): Promise<boolean> {
    setError(null);
    setSaving(true);

    try {
      const updated = await updateNote(roadmapId, nodeId, noteId, {
        title,
        content,
      });
      setNote(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "기록을 저장하지 못했습니다");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSummarize() {
    setSummarizeError(null);
    setSummarizing(true);

    try {
      const updated = await summarizeNote(roadmapId, nodeId, noteId);
      setNote(updated);
    } catch (err) {
      setSummarizeError(
        err instanceof Error ? err.message : "요약을 생성하지 못했습니다"
      );
    } finally {
      setSummarizing(false);
    }
  }

  async function handleDelete() {
    if (!note) return;

    const ok = await confirm({
      title: `"${note.title}" 기록을 삭제할까요?`,
      description: "되돌릴 수 없습니다.",
      confirmLabel: "삭제",
      tone: "danger",
    });

    if (!ok) return;

    setError(null);
    setDeleting(true);

    try {
      await deleteNote(roadmapId, nodeId, noteId);
      navigate(`/roadmaps/${roadmapId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "기록을 삭제하지 못했습니다");
    } finally {
      setDeleting(false);
    }
  }

  const backLink = `/roadmaps/${roadmapId}`;

  return (
    // 글쓰기 화면이므로 좁은 칼럼(max-w-2xl)에 가두지 않고 화면 폭을 다 씁니다.
    // min-h-0 은 자식(에디터)이 flex 안에서 세로로 늘어날 수 있게 해줍니다.
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 px-6 py-6">
      <Link
        to={backLink}
        className="animate-rise shrink-0 text-sm text-muted underline underline-offset-4 hover:text-ink"
      >
        ← {roadmapTitle ?? "로드맵"}으로 돌아가기
      </Link>

      {loading ? (
        <CenteredMessage>불러오는 중...</CenteredMessage>
      ) : error && !note ? (
        <ErrorText>{error}</ErrorText>
      ) : note ? (
        <div className="flex min-h-0 flex-1 animate-rise flex-col gap-3">
          {(note.content?.trim() || note.summary) && (
            <NoteSummaryCallout
              summary={note.summary}
              loading={summarizing}
              error={summarizeError}
              onGenerate={handleSummarize}
            />
          )}

          <NoteEditor
            note={note}
            saving={saving}
            deleting={deleting}
            onSubmit={handleSave}
            onDelete={handleDelete}
            onCancel={() => navigate(backLink)}
            attachments={attachmentsState.attachments}
            onUploadFile={attachmentsState.upload}
            onOpenAttachment={attachmentsState.download}
            onResolveImage={attachmentsState.getImageUrl}
          />

          {error && <ErrorText>{error}</ErrorText>}
          {attachmentsState.error && <ErrorText>{attachmentsState.error}</ErrorText>}

          <p className="shrink-0 text-xs text-faint">
            최근 수정:{" "}
            {new Date(note.updated_at ?? note.created_at).toLocaleString(
              "ko-KR"
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
