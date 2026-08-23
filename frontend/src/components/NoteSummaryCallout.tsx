import { IconButton } from "./ui/IconButton";
import { ErrorText } from "./ui/Message";
import { SparklesIcon } from "./ui/icons";

interface Props {
  summary: string | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
}

/** "- 문장" 형태로 줄바꿈된 요약을 리스트 항목 배열로 바꿉니다. 줄머리 기호(-, •, *)를 뗍니다. */
function toSummaryItems(summary: string): string[] {
  return summary
    .split("\n")
    .map((line) => line.replace(/^[\s]*[-•*]\s*/, "").trim())
    .filter((line) => line !== "");
}

/** 노트 상단에 뜨는 AI 요약 콜아웃. 요약이 없으면 생성 버튼만, 있으면 내용+다시 생성 버튼을 보여줍니다. */
export function NoteSummaryCallout({ summary, loading, error, onGenerate }: Props) {
  const hasSummary = summary != null && summary.trim() !== "";

  if (!hasSummary && !loading) {
    return (
      <div className="flex shrink-0 flex-col gap-2">
        <button
          type="button"
          title="AI가 이 노트 내용을 요약합니다"
          onClick={onGenerate}
          className="flex w-fit cursor-pointer items-center gap-1.5 rounded border border-ai bg-ai/5 px-2.5 py-1.5 text-xs font-medium text-ai transition hover:bg-ai/10"
        >
          <SparklesIcon className="h-3.5 w-3.5" />
          AI 요약 생성
        </button>

        {error && <ErrorText>{error}</ErrorText>}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 animate-rise flex-col gap-2 rounded border border-ai bg-ai/5 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ai">
          <SparklesIcon className={`h-3.5 w-3.5 ${loading ? "animate-ai-pulse" : ""}`} />
          {loading ? "요약 생성 중..." : "AI 요약"}
        </span>

        <IconButton
          size="sm"
          label="다시 요약"
          icon={<SparklesIcon className="h-3.5 w-3.5" />}
          disabled={loading}
          onClick={onGenerate}
          className="hover:border-ai hover:text-ai"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-1.5" aria-hidden="true">
          <div className="ai-shimmer h-3 w-full animate-shimmer rounded" />
          <div className="ai-shimmer h-3 w-4/5 animate-shimmer rounded" />
          <div className="ai-shimmer h-3 w-2/3 animate-shimmer rounded" />
        </div>
      ) : (
        <ul className="list-disc space-y-1 pl-4 text-sm text-ink marker:text-ai">
          {toSummaryItems(summary ?? "").map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}

      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
