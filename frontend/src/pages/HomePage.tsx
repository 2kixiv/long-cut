import { useOutletContext } from "react-router-dom";
import type { RoadmapsContext } from "../components/AppLayout";

export function HomePage() {
  const { roadmaps, loading } = useOutletContext<RoadmapsContext>();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex max-w-sm animate-rise flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-semibold">
          {loading
            ? "불러오는 중..."
            : roadmaps.length === 0
              ? "첫 로드맵을 만들어 보세요"
              : "로드맵을 선택하세요"}
        </h1>

        {!loading && (
          <p className="text-sm text-muted">
            {roadmaps.length === 0
              ? "왼쪽 사이드바의 '+ 새 로드맵'으로 시작할 수 있습니다."
              : "왼쪽 목록에서 로드맵을 고르면 학습 경로가 여기에 표시됩니다."}
          </p>
        )}
      </div>
    </div>
  );
}
