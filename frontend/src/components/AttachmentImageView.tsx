import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { ResizeHandleIcon } from "./ui/icons";

const MIN_WIDTH = 80;
const MAX_WIDTH = 1200;

type ResolveImage = (attachmentId: number) => Promise<string>;

/**
 * 첨부 이미지 노드의 실제 렌더링을 맡습니다. src 속성은 항상 비어있고(순수
 * DOM에 진짜 attachment: 값이 새어나가 브라우저가 존재하지 않는 프로토콜로
 * fetch를 시도하는 걸 막기 위함), 첨부 ID는 attachmentId 속성에 따로 있습니다.
 * 마운트 시 인증 헤더를 실어 blob으로 받아온 뒤 object URL로 렌더링합니다.
 * 우측 하단 모서리를 드래그하면 폭을 조절할 수 있습니다(hover 시에만 손잡이 노출).
 */
export function AttachmentImageView({
  node,
  extension,
  updateAttributes,
}: ReactNodeViewProps<HTMLElement>) {
  const attachmentId: number | null = node.attrs.attachmentId ?? null;
  const alt: string = node.attrs.alt ?? "";
  const savedWidth: number | null = node.attrs.width ?? null;
  const resolveImage = extension.options.resolveImage as ResolveImage | undefined;

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [resizing, setResizing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (attachmentId == null || !resolveImage) return;

    let cancelled = false;
    let createdUrl: string | null = null;

    resolveImage(attachmentId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        createdUrl = url;
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [attachmentId, resolveImage]);

  function handleResizeStart(e: ReactPointerEvent<HTMLSpanElement>) {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = imgRef.current?.getBoundingClientRect().width ?? savedWidth ?? 200;

    function clamp(w: number) {
      return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(w)));
    }

    setResizing(true);

    function handlePointerMove(moveEvent: PointerEvent) {
      setDragWidth(clamp(startWidth + (moveEvent.clientX - startX)));
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      setResizing(false);
      setDragWidth((current) => {
        if (current != null) updateAttributes({ width: current });
        return null;
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  const displayWidth = dragWidth ?? savedWidth ?? undefined;

  return (
    <NodeViewWrapper as="span" className="group/img relative inline-block max-w-full align-bottom">
      {blobUrl ? (
        <>
          <img
            ref={imgRef}
            src={blobUrl}
            alt={alt}
            draggable={false}
            style={displayWidth ? { width: `${displayWidth}px` } : undefined}
            className={`block max-w-full rounded border align-bottom transition-colors ${
              resizing ? "border-ink" : "border-line"
            }`}
          />

          <span
            onPointerDown={handleResizeStart}
            className={`absolute bottom-1 right-1 flex h-5 w-5 cursor-nwse-resize items-center justify-center rounded border bg-canvas text-ink shadow-sm transition-opacity ${
              resizing
                ? "border-ink opacity-100"
                : "border-line opacity-0 hover:border-ink group-hover/img:opacity-100"
            }`}
          >
            <ResizeHandleIcon className="h-3 w-3" />
          </span>

          {resizing && (
            <span className="absolute bottom-1 left-1 rounded border border-line bg-canvas px-1.5 py-0.5 text-xs text-muted shadow-sm">
              {displayWidth}px
            </span>
          )}
        </>
      ) : failed ? (
        <span className="inline-block rounded border border-dashed border-line px-3 py-2 text-xs text-danger">
          이미지를 불러오지 못했습니다
        </span>
      ) : (
        <span className="inline-block rounded border border-dashed border-line px-3 py-2 text-xs text-faint">
          이미지 불러오는 중...
        </span>
      )}
    </NodeViewWrapper>
  );
}
