import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  createRoadmap,
  deleteRoadmap,
  getRoadmaps,
  type Roadmap,
} from "../lib/api";
import { Sidebar } from "./Sidebar";
import { IconButton } from "./ui/IconButton";
import { MenuIcon } from "./ui/icons";
import { useConfirm } from "../hooks/useConfirm";

/** 사이드바가 들고 있는 목록을 자식 페이지에서도 쓰기 위한 통로 */
export interface RoadmapsContext {
  roadmaps: Roadmap[];
  loading: boolean;
  /** 상세 화면에서 로드맵을 고치면 사이드바 목록도 같이 갱신합니다 */
  onRoadmapUpdated: (roadmap: Roadmap) => void;
}

export function AppLayout() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getRoadmaps();
        if (!cancelled) setRoadmaps(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "로드맵을 불러오지 못했습니다"
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
  }, []);

  async function handleCreate(
    title: string,
    description: string | null
  ): Promise<boolean> {
    setError(null);
    setCreating(true);

    try {
      const created = await createRoadmap({ title, description });

      setRoadmaps((prev) => [created, ...prev]);
      navigate(`/roadmaps/${created.id}`);
      setOpen(false);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "로드맵을 만들지 못했습니다");
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(roadmap: Roadmap) {
    const ok = await confirm({
      title: `"${roadmap.title}" 로드맵을 삭제할까요?`,
      description: "하위 단계도 함께 사라지며 되돌릴 수 없습니다.",
      confirmLabel: "삭제",
      tone: "danger",
    });

    if (!ok) return;

    setError(null);
    setDeletingId(roadmap.id);

    try {
      await deleteRoadmap(roadmap.id);
      setRoadmaps((prev) => prev.filter((item) => item.id !== roadmap.id));

      // 보고 있던 로드맵이 사라졌으면 빈 화면으로 되돌립니다
      if (location.pathname === `/roadmaps/${roadmap.id}`) {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "로드맵을 삭제하지 못했습니다");
    } finally {
      setDeletingId(null);
    }
  }

  function handleRoadmapUpdated(updated: Roadmap) {
    setRoadmaps((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  }

  const context: RoadmapsContext = {
    roadmaps,
    loading,
    onRoadmapUpdated: handleRoadmapUpdated,
  };

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 animate-fade-in bg-ink/30 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 ease-soft md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          roadmaps={roadmaps}
          loading={loading}
          error={error}
          creating={creating}
          deletingId={deletingId}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onNavigate={() => setOpen(false)}
        />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3 md:hidden">
          <IconButton
            size="sm"
            label="메뉴 열기"
            icon={<MenuIcon className="h-4 w-4" />}
            onClick={() => setOpen(true)}
          />
          <span className="font-semibold tracking-tight">LongCut</span>
        </header>

        <Outlet context={context} />
      </main>
    </div>
  );
}
