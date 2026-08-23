import { useState, type FormEvent } from "react";
import { TextInput } from "./ui/TextInput";
import { Button } from "./ui/Button";

interface Props {
  /** 값을 넘기면 수정 모드가 됩니다. 성공해도 입력을 비우지 않습니다. */
  initialTitle?: string;
  initialDescription?: string | null;
  titleLabel: string;
  descriptionLabel?: string;
  submitLabel: string;
  submittingLabel: string;
  submitting: boolean;
  size?: "sm" | "md";
  onSubmit: (title: string, description: string | null) => Promise<boolean>;
  onCancel?: () => void;
}

/**
 * 로드맵 생성과 노드 추가가 같은 모양이라 하나로 씁니다.
 * onSubmit이 성공 여부를 돌려주고, 성공했을 때만 입력을 비웁니다.
 */
export function TitleDescriptionForm({
  initialTitle,
  initialDescription,
  titleLabel,
  descriptionLabel = "설명 (선택)",
  submitLabel,
  submittingLabel,
  submitting,
  size = "md",
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");

  const editing = initialTitle !== undefined;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const created = await onSubmit(title.trim(), description.trim() || null);

    // 실패했을 때 입력을 날리면 다시 타이핑해야 하므로 성공했을 때만 비웁니다.
    // 수정 모드는 폼이 그대로 닫히므로 비우지 않습니다.
    if (created && !editing) {
      setTitle("");
      setDescription("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex animate-rise flex-col gap-2">
      <TextInput
        required
        autoFocus
        size={size}
        label={titleLabel}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextInput
        size={size}
        label={descriptionLabel}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex gap-2">
        <Button
          title={submitLabel}
          type="submit"
          variant="primary"
          size={size}
          disabled={submitting || title.trim() === ""}
        >
          {submitting ? submittingLabel : submitLabel}
        </Button>

        {onCancel && (
          <Button title="취소하고 닫습니다" size={size} onClick={onCancel}>
            취소
          </Button>
        )}
      </div>
    </form>
  );
}
