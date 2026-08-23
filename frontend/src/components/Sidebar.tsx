import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Roadmap } from "../lib/api";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { LogoutIcon, PlusIcon, TrashIcon } from "./ui/icons";
import { ErrorText } from "./ui/Message";
import { TitleDescriptionForm } from "./TitleDescriptionForm";

const STAGGER_MS = 40;

interface Props {
  roadmaps: Roadmap[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  deletingId: number | null;
  onCreate: (title: string, description: string | null) => Promise<boolean>;
  onDelete: (roadmap: Roadmap) => void;
  onNavigate: () => void;
}

export function Sidebar({
  roadmaps,
  loading,
  error,
  creating,
  deletingId,
  onCreate,
  onDelete,
  onNavigate,
}: Props) {
  const { logout } = useAuth();
  const [adding, setAdding] = useState(false);

  async function handleCreate(title: string, description: string | null) {
    const created = await onCreate(title, description);
    if (created) setAdding(false);
    return created;
  }

  return (
    <div className="flex h-full flex-col gap-4 border-r border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold tracking-tight">LongCut</span>
        <Button title="로그아웃합니다" variant="subtle" size="sm" onClick={logout}>
          <LogoutIcon className="h-3.5 w-3.5" />
          로그아웃
        </Button>
      </div>

      {adding ? (
        <TitleDescriptionForm
          size="sm"
          titleLabel="로드맵 제목"
          submitLabel="만들기"
          submittingLabel="만드는 중..."
          submitting={creating}
          onSubmit={handleCreate}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button
          title="새 로드맵을 만듭니다"
          variant="dashed"
          className="animate-rise"
          onClick={() => setAdding(true)}
        >
          <PlusIcon className="h-4 w-4" />
          새 로드맵
        </Button>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      <nav className="-mx-1 flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-1 text-sm text-muted">불러오는 중...</p>
        ) : roadmaps.length === 0 ? (
          <p className="px-1 text-sm text-muted">아직 로드맵이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {roadmaps.map((roadmap, index) => (
              <li
                key={roadmap.id}
                style={{ animationDelay: `${index * STAGGER_MS}ms` }}
                className="group flex animate-rise items-center gap-1"
              >
                <NavLink
                  to={`/roadmaps/${roadmap.id}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `min-w-0 flex-1 truncate rounded border px-2 py-1.5 text-sm transition-[background-color,border-color,color,padding] duration-200 ${
                      isActive
                        ? "border-ink bg-ink font-medium text-canvas"
                        : "border-line bg-canvas text-ink hover:border-ink hover:pl-3"
                    }`
                  }
                >
                  {roadmap.title}
                </NavLink>

                <IconButton
                  size="sm"
                  variant="danger"
                  label={`${roadmap.title} 삭제`}
                  icon={<TrashIcon className="h-3.5 w-3.5" />}
                  disabled={deletingId === roadmap.id}
                  onClick={() => onDelete(roadmap)}
                />
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
}
