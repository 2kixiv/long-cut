import { useEffect, useState } from "react";
import {
  downloadAttachment,
  getAttachmentImageUrl,
  getAttachments,
  uploadAttachment,
  type Attachment,
} from "../lib/api";

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

/**
 * 노트 하나의 첨부파일 상태를 관리합니다. NoteEditor가 본문 중간에 드래그로
 * 삽입하거나 첨부 링크를 클릭해 다운로드할 때 이 목록을 참조합니다.
 */
export function useAttachments(roadmapId: number, nodeId: number, noteId: number) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getAttachments(roadmapId, nodeId, noteId)
      .then((data) => {
        if (!cancelled) setAttachments(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "첨부파일을 불러오지 못했습니다");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roadmapId, nodeId, noteId]);

  async function upload(file: File): Promise<Attachment | null> {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      setError("파일이 너무 큽니다 (최대 10MB)");
      return null;
    }

    setError(null);

    try {
      const attachment = await uploadAttachment(roadmapId, nodeId, noteId, file);
      setAttachments((prev) => [attachment, ...prev]);
      return attachment;
    } catch (err) {
      setError(err instanceof Error ? err.message : "파일을 올리지 못했습니다");
      return null;
    }
  }

  async function download(attachment: Attachment) {
    setError(null);

    try {
      await downloadAttachment(roadmapId, nodeId, noteId, attachment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "파일을 내려받지 못했습니다");
    }
  }

  function getImageUrl(attachmentId: number): Promise<string> {
    return getAttachmentImageUrl(roadmapId, nodeId, noteId, attachmentId);
  }

  return { attachments, loading, error, setError, upload, download, getImageUrl };
}
