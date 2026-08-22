import type { ReactNode } from "react";

export interface Tool {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface Props {
  tools: Tool[];
  /** 노드 중심에서 버튼 오른쪽 끝까지의 거리 */
  radius: number;
  size: "sm" | "md";
}

const SIZES = {
  sm: "h-8 min-w-8 px-2 text-xs",
  md: "h-9 min-w-9 px-2.5 text-xs",
};

/**
 * 노드 왼쪽에 도구를 세로로 펼칩니다 (극좌표 135°·180°·225°).
 * 도구가 2개면 150°·210°에 놓입니다.
 */
function anglesFor(count: number): number[] {
  if (count <= 1) return [180];
  if (count === 2) return [150, 210];

  const span = 90;
  const start = 180 - span / 2;
  const step = span / (count - 1);

  return Array.from({ length: count }, (_, i) => start + step * i);
}

export function NodeToolbar({ tools, radius, size }: Props) {
  const angles = anglesFor(tools.length);

  return (
    <>
      {tools.map((tool, index) => {
        const radian = (angles[index] * Math.PI) / 180;
        const x = Math.cos(radian) * radius;
        const y = -Math.sin(radian) * radius;

        return (
          <div
            key={tool.key}
            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
            // 오른쪽 끝을 기준점에 맞춥니다. hover로 넓어질 때 왼쪽으로 늘어나
            // 노드와 라벨을 덮지 않습니다.
            className="absolute z-10 -translate-x-full -translate-y-1/2"
          >
            <button
              type="button"
              onClick={(e) => {
                // 노드 클릭(선택 해제)으로 전파되지 않게 막습니다
                e.stopPropagation();
                tool.onClick();
              }}
              disabled={tool.disabled}
              aria-label={tool.label}
              style={{ animationDelay: `${index * 45}ms` }}
              className={`group/tool flex animate-tool-in cursor-pointer items-center justify-end rounded-full border border-ink bg-canvas text-ink shadow-md transition-[background-color,color,transform] duration-200 hover:bg-ink hover:text-canvas active:scale-90 disabled:cursor-default disabled:opacity-40 ${SIZES[size]}`}
            >
              <span
                className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/tool:mr-1.5 group-hover/tool:max-w-48 group-hover/tool:opacity-100"
              >
                {tool.label}
              </span>

              {tool.icon}
            </button>
          </div>
        );
      })}
    </>
  );
}
