import { useEffect, useRef, useState } from "react";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image, { type ImageOptions } from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown, type MarkdownNodeSpec, type MarkdownStorage } from "tiptap-markdown";
import type { Attachment, Note } from "../lib/api";
import { AttachmentImageView } from "./AttachmentImageView";

// tiptap-markdown은 editor.storage.markdown 타입을 앰비언트로 선언해주지 않습니다.
declare module "@tiptap/core" {
  interface Storage {
    markdown: MarkdownStorage;
  }
}
import { TextInput } from "./ui/TextInput";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { TrashIcon } from "./ui/icons";

interface Props {
  note?: Note;
  saving: boolean;
  deleting?: boolean;
  onSubmit: (title: string, content: string) => Promise<boolean>;
  /** note가 있을 때만 표시됩니다 */
  onDelete?: () => void;
  onCancel: () => void;
  /** 넘기면 본문에 파일을 드래그해서 끌어다 놓을 수 있게 됩니다 */
  attachments?: Attachment[];
  onUploadFile?: (file: File) => Promise<Attachment | null>;
  onOpenAttachment?: (attachment: Attachment) => void;
  /** attachment: 스킴 이미지의 실제 blob URL을 받아옵니다 (인증 헤더 필요) */
  onResolveImage?: (attachmentId: number) => Promise<string>;
}

const ATTACHMENT_SCHEME = "attachment:";

type ResolveImage = (attachmentId: number) => Promise<string>;

interface AttachmentImageOptions extends ImageOptions {
  resolveImage?: ResolveImage;
}

// 리사이즈한 폭은 마크다운 표준 이미지 문법에 자리가 없어서, title 자리를
// "w320" 형태로 빌려 씁니다. width가 없으면 평소와 똑같이 `![alt](src)`로
// 저장되어 기존 노트와 호환됩니다.
const WIDTH_TITLE_PATTERN = /^w(\d+)$/;

const AttachmentImage = Image.extend<AttachmentImageOptions>({
  addOptions() {
    return {
      ...this.parent!(),
      resolveImage: undefined,
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(AttachmentImageView);
  },
  // src에는 절대 "attachment:11" 같은 값을 넣지 않습니다. 그 값이 어떤 경로로든
  // 실제 DOM <img src>로 새어나가면(마크다운 파싱 중간 HTML, 기본 toDOM 폴백 등)
  // 브라우저가 존재하지 않는 프로토콜로 네트워크 요청을 시도해 콘솔에
  // ERR_UNKNOWN_URL_SCHEME이 찍힙니다. 첨부 ID는 별도의 attachmentId 속성에만
  // 두고, src는 항상 비워 둬서 이 문제가 원천적으로 발생하지 않게 합니다.
  addAttributes() {
    return {
      ...this.parent!(),
      attachmentId: {
        default: null,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "img[data-attachment-id]",
        getAttrs: (element) => {
          const id = element.getAttribute("data-attachment-id");
          const title = element.getAttribute("title");
          const widthMatch = title?.match(WIDTH_TITLE_PATTERN);
          return {
            src: null,
            attachmentId: id ? Number(id) : null,
            alt: element.getAttribute("alt"),
            title: widthMatch ? null : title,
            width: widthMatch ? Number(widthMatch[1]) : null,
          };
        },
      },
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          const { attachmentId, alt, width } = node.attrs;
          const titlePart = width ? ` "w${width}"` : "";
          state.write(
            `![${state.esc(alt || "")}](${ATTACHMENT_SCHEME}${attachmentId}${titlePart})`
          );
        },
        parse: {
          setup(md) {
            md.renderer.rules.image = (tokens, idx, options, env, self) => {
              const token = tokens[idx];
              const altIndex = token.attrIndex("alt");
              if (altIndex >= 0 && token.attrs) {
                token.attrs[altIndex][1] = self.renderInlineAsText(
                  token.children ?? [],
                  options,
                  env
                );
              }
              const srcIndex = token.attrIndex("src");
              if (srcIndex >= 0 && token.attrs) {
                const rawSrc = token.attrs[srcIndex][1];
                const idMatch = rawSrc.match(/^attachment:(\d+)$/);
                token.attrs[srcIndex][0] = "data-attachment-id";
                token.attrs[srcIndex][1] = idMatch ? idMatch[1] : "";
              }
              return self.renderToken(tokens, idx, options);
            };
          },
        },
      } satisfies MarkdownNodeSpec,
    };
  },
});

export function NoteEditor({
  note,
  saving,
  deleting = false,
  onSubmit,
  onDelete,
  onCancel,
  attachments,
  onUploadFile,
  onOpenAttachment,
  onResolveImage,
}: Props) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");

  // editorProps/extension 옵션 콜백은 생성 시점에 고정되므로, 매 렌더마다 바뀌는
  // 최신 prop을 참조하려면 ref에 담아둬야 합니다(그렇지 않으면 초기 렌더의 값에 갇힙니다).
  const onUploadFileRef = useRef(onUploadFile);
  const onOpenAttachmentRef = useRef(onOpenAttachment);
  const attachmentsRef = useRef(attachments);
  const onResolveImageRef = useRef(onResolveImage);

  useEffect(() => {
    onUploadFileRef.current = onUploadFile;
    onOpenAttachmentRef.current = onOpenAttachment;
    attachmentsRef.current = attachments;
    onResolveImageRef.current = onResolveImage;
  });

  const resolveImage = (id: number) =>
    onResolveImageRef.current?.(id) ?? Promise.reject(new Error("no resolver"));

  const dirty = title !== (note?.title ?? "") || content !== (note?.content ?? "");

  const editor = useEditor({
    content: note?.content ?? "",
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          protocols: ["attachment"],
        },
      }),
      // .configure()는 값을 저장만 할 뿐 즉시 호출하지 않습니다. resolveImage 안의
      // ref 읽기는 항상 AttachmentImageView의 useEffect 안에서만 실행되어 안전합니다.
      // eslint-disable-next-line react-hooks/refs
      AttachmentImage.configure({
        inline: true,
        resolveImage,
      }),
      Markdown,
      Placeholder.configure({ placeholder: "마크다운 문법을 지원합니다. 파일을 끌어다 놓으면 여기에 첨부됩니다." }),
    ],
    onUpdate({ editor }) {
      // 이미지 노드뷰가 마운트되는 동안 onUpdate가 같은 호출 스택에서 동기적으로
      // 발동하는 경우가 있어, setState를 렌더링 스택 밖(마이크로태스크)으로 늦춥니다.
      // 안 그러면 "Cannot update NoteEditor while rendering Image" 경고가 뜹니다.
      const markdown = editor.storage.markdown.getMarkdown();
      queueMicrotask(() => setContent(markdown));
    },
    editorProps: {
      attributes: {
        class: "prose-note min-h-64 flex-1 outline-none",
      },
      handleClick(_view, _pos, event) {
        const anchor = (event.target as HTMLElement).closest("a");
        const href = anchor?.getAttribute("href");
        if (!href?.startsWith(ATTACHMENT_SCHEME)) return false;

        // attachment: 스킴은 실제 프로토콜이 아니라서, 막지 않으면 브라우저가
        // 알 수 없는 프로토콜로 이동을 시도합니다(target="_blank"까지 붙어 있음).
        event.preventDefault();

        const id = Number(href.slice(ATTACHMENT_SCHEME.length));
        const attachment = attachmentsRef.current?.find((item) => item.id === id);
        if (!attachment || !onOpenAttachmentRef.current) return false;

        onOpenAttachmentRef.current(attachment);
        return true;
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (files.length === 0 || !onUploadFileRef.current) return false;
        event.preventDefault();

        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        const pos = coords?.pos ?? view.state.selection.from;

        (async () => {
          const uploaded: { attachment: Attachment; isImage: boolean }[] = [];
          for (const file of files) {
            const attachment = await onUploadFileRef.current?.(file);
            if (attachment) {
              uploaded.push({ attachment, isImage: file.type.startsWith("image/") });
            }
          }
          if (uploaded.length === 0) return;

          const { schema } = view.state;
          const linkMark = schema.marks.link;
          let tr = view.state.tr;
          let insertPos = pos;

          for (const { attachment, isImage } of uploaded) {
            if (isImage) {
              const imageNode = schema.nodes.image.create({
                attachmentId: attachment.id,
                alt: attachment.filename,
              });
              tr = tr.insert(insertPos, imageNode);
              insertPos += imageNode.nodeSize;
            } else {
              const textNode = schema.text(`📎 ${attachment.filename}`, [
                linkMark.create({ href: `${ATTACHMENT_SCHEME}${attachment.id}` }),
              ]);
              tr = tr.insert(insertPos, textNode);
              insertPos += textNode.nodeSize;
            }

            const spaceNode = schema.text(" ");
            tr = tr.insert(insertPos, spaceNode);
            insertPos += spaceNode.nodeSize;
          }

          view.dispatch(tr);
        })();

        return true;
      },
    },
  });

  async function handleSave() {
    await onSubmit(title.trim(), content);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-end gap-2">
        <div className="flex-1">
          <TextInput
            label="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus={!note}
          />
        </div>

        {note && onDelete && (
          <IconButton
            variant="danger"
            label="이 기록 삭제"
            icon={<TrashIcon className="h-3.5 w-3.5" />}
            disabled={deleting}
            onClick={onDelete}
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded border border-line bg-canvas px-4 py-3">
        <EditorContent editor={editor} />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2">
        <Button title="변경 사항을 버리고 나갑니다" onClick={onCancel}>
          취소
        </Button>
        <Button
          title="이 기록을 저장합니다"
          variant="primary"
          disabled={saving || title.trim() === "" || !dirty}
          onClick={handleSave}
        >
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
