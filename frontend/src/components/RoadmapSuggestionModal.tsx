import { useEffect, useState } from "react";
import { suggestNodes, type SuggestedNode } from "../lib/api";
import { Button } from "./ui/Button";
import { ErrorText } from "./ui/Message";
import { SparklesIcon } from "./ui/icons";

interface Props {
  roadmapId: number;
  onClose: () => void;
  /** 선택된 항목마다 호출됩니다. RoadmapPage의 기존 단계 생성 로직을 그대로 재사용합니다. */
  onCreate: (title: string, description: string | null) => Promise<boolean>;
}

/** "AI 제안" 모달. 제안 목록을 체크박스로 보여주고, 선택한 것만 실제 단계로 만듭니다. */
export function RoadmapSuggestionModal({ roadmapId, onClose, onCreate }: Props) {
  const [suggestions, setSuggestions] = useState<SuggestedNode[] | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    suggestNodes(roadmapId)
      .then((data) => {
        if (cancelled) return;
        setSuggestions(data);
        setChecked(data.map(() => true));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "제안을 불러오지 못했습니다");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roadmapId]);

  function toggle(index: number) {
    setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)));
  }

  async function handleAdd() {
    if (!suggestions) return;

    setError(null);
    setAdding(true);

    try {
      for (let i = 0; i < suggestions.length; i++) {
        if (!checked[i]) continue;

        const ok = await onCreate(suggestions[i].title, suggestions[i].description);
        if (!ok) throw new Error("일부 단계를 추가하지 못했습니다");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "단계를 추가하지 못했습니다");
    } finally {
      setAdding(false);
    }
  }

  const checkedCount = checked.filter(Boolean).length;

  return (
    <>
      <h2 className="flex items-center gap-1.5 text-lg font-semibold tracking-tight text-ai">
        <SparklesIcon className={`h-4 w-4 ${loading ? "animate-ai-pulse" : ""}`} />
        AI 단계 제안
      </h2>

      {loading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          <div className="ai-shimmer h-12 w-full animate-shimmer rounded" />
          <div className="ai-shimmer h-12 w-full animate-shimmer rounded" />
          <div className="ai-shimmer h-12 w-full animate-shimmer rounded" />
        </div>
      ) : suggestions && suggestions.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {suggestions.map((suggestion, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-2 rounded border border-line px-3 py-2 transition hover:border-ai">
                <input
                  type="checkbox"
                  checked={checked[i] ?? false}
                  onChange={() => toggle(i)}
                  className="mt-0.5 accent-ai"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-ink">{suggestion.title}</span>
                  <span className="text-xs text-muted">{suggestion.description}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        !error && <p className="text-sm text-muted">제안할 단계가 없습니다</p>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      <div className="flex justify-end gap-2">
        <Button title="닫습니다" onClick={onClose} disabled={adding}>
          닫기
        </Button>

        {suggestions && suggestions.length > 0 && (
          <Button
            title="선택한 단계들을 로드맵에 추가합니다"
            variant="primary"
            disabled={adding || checkedCount === 0}
            onClick={handleAdd}
          >
            {adding ? "추가 중..." : `선택한 ${checkedCount}개 추가`}
          </Button>
        )}
      </div>
    </>
  );
}
