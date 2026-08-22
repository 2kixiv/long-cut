import type { RoadmapNode } from "../lib/api";
import type { TreeNode } from "../lib/tree";
import { countDone } from "../lib/tree";
import { STATUS_CIRCLES, STATUS_LABELS, nextStatus } from "../lib/status";
import {
  WIDTH,
  buildBranchData,
  buildLayout,
  buildPathData,
  lastDoneIndex,
} from "../lib/layout";
import { NodeToolbar, type Tool } from "./NodeToolbar";
import { PencilIcon, PlusIcon, StatusIcon } from "./ui/icons";

const STAGGER_MS = 70;

interface Props {
  nodes: TreeNode[];
  selectedId: number | null;
  pendingId: number | null;
  onSelect: (id: number | null) => void;
  onChangeStatus: (node: RoadmapNode) => void;
  onEdit: (node: RoadmapNode) => void;
  onAddChild: (node: RoadmapNode) => void;
  onAddRoot: () => void;
}

export function RoadmapPath({
  nodes,
  selectedId,
  pendingId,
  onSelect,
  onChangeStatus,
  onEdit,
  onAddChild,
  onAddRoot,
}: Props) {
  // 하위 단계를 고른 상태에서도 부모는 펼쳐진 채로 둡니다
  const expandedId =
    nodes.find(
      (node) =>
        node.id === selectedId ||
        node.children.some((child) => child.id === selectedId)
    )?.id ?? null;

  const layout = buildLayout(nodes, expandedId);
  const doneIndex = lastDoneIndex(nodes);

  const mainPoints = [...layout.nodes, layout.addPoint];
  const progressPoints = layout.nodes.slice(0, doneIndex + 1);

  function toolsFor(node: RoadmapNode, canAddChild: boolean): Tool[] {
    const tools: Tool[] = [
      {
        key: "status",
        label: `${STATUS_LABELS[nextStatus(node.status)]}로 바꾸기`,
        icon: <StatusIcon status={node.status} className="h-4 w-4" />,
        disabled: pendingId === node.id,
        onClick: () => onChangeStatus(node),
      },
      {
        key: "edit",
        label: "수정",
        icon: <PencilIcon className="h-4 w-4" />,
        onClick: () => onEdit(node),
      },
    ];

    if (canAddChild) {
      tools.push({
        key: "add",
        label: "하위 단계 추가",
        icon: <PlusIcon className="h-4 w-4" />,
        onClick: () => onAddChild(node),
      });
    }

    return tools;
  }

  return (
    <div
      className="relative mx-auto"
      style={{ width: WIDTH, height: layout.height }}
      // 빈 곳을 누르면 선택이 풀립니다
      onClick={() => onSelect(null)}
    >
      <svg
        className="absolute inset-0"
        width={WIDTH}
        height={layout.height}
        aria-hidden="true"
      >
        <path
          d={buildPathData(mainPoints)}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray="2 16"
        />

        {progressPoints.length > 1 && (
          // 완료 지점이 늘어날 때마다 선이 다시 그려지도록 key를 바꿉니다
          <path
            key={`${doneIndex}-${expandedId}`}
            d={buildPathData(progressPoints)}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth={4}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            className="animate-draw"
          />
        )}

        {layout.nodes.map((placed) =>
          placed.children.length > 0 ? (
            <path
              key={`branch-${placed.node.id}`}
              d={buildBranchData(placed, placed.children)}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="2 10"
              pathLength={1}
              className="animate-draw"
            />
          ) : null
        )}
      </svg>

      {layout.nodes.map((placed) => {
        const { node, index } = placed;
        const selected = selectedId === node.id;
        const done = countDone(node.children);

        return (
          <div
            key={node.id}
            style={{ left: placed.x, top: placed.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            {selected && (
              <NodeToolbar size="md" radius={64} tools={toolsFor(node, true)} />
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(selected ? null : node.id);
              }}
              style={{ animationDelay: `${index * STAGGER_MS}ms` }}
              className="group flex animate-rise cursor-pointer flex-col items-center gap-1.5 outline-none"
            >
              <span
                key={node.status}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-lg font-semibold transition-[background-color,border-color,color,transform] duration-200 group-hover:scale-105 group-active:scale-95 ${
                  STATUS_CIRCLES[node.status]
                } ${node.status === "done" ? "animate-pop" : ""} ${
                  selected ? "ring-4 ring-raised" : ""
                }`}
              >
                {node.status === "done" ? "✓" : index + 1}
              </span>

              <span
                className={`truncate text-center text-sm font-medium transition-all duration-200 group-hover:text-ink ${
                  selected ? "w-20" : "w-28"
                }`}
              >
                {node.title}
              </span>

              {node.children.length > 0 && (
                <span className="text-xs text-faint tabular-nums">
                  {done}/{node.children.length}
                </span>
              )}
            </button>
          </div>
        );
      })}

      {layout.nodes.flatMap((placed) =>
        placed.children.map((child, childIndex) => {
          const selected = selectedId === child.node.id;

          return (
            <div
              key={child.node.id}
              style={{ left: child.x, top: child.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              {selected && (
                <NodeToolbar
                  size="sm"
                  radius={40}
                  tools={toolsFor(child.node, false)}
                />
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(selected ? null : child.node.id);
                }}
                style={{ animationDelay: `${childIndex * 45}ms` }}
                className="group flex animate-rise cursor-pointer flex-col items-center gap-1 outline-none"
              >
                <span
                  key={child.node.status}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-semibold transition-[background-color,border-color,color,transform] duration-200 group-hover:scale-110 group-active:scale-95 ${
                    STATUS_CIRCLES[child.node.status]
                  } ${child.node.status === "done" ? "animate-pop" : ""} ${
                    selected ? "ring-4 ring-raised" : ""
                  }`}
                >
                  {child.node.status === "done" ? "✓" : childIndex + 1}
                </span>

                <span
                  className={`truncate text-center text-xs transition-all duration-200 ${
                    selected ? "w-16" : "w-24"
                  } ${
                    child.node.status === "done"
                      ? "text-muted line-through"
                      : "text-ink"
                  }`}
                >
                  {child.node.title}
                </span>
              </button>
            </div>
          );
        })
      )}

      <div
        style={{ left: layout.addPoint.x, top: layout.addPoint.y }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddRoot();
          }}
          style={{ animationDelay: `${nodes.length * STAGGER_MS}ms` }}
          className="group flex animate-rise cursor-pointer flex-col items-center gap-1.5 outline-none"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-line text-faint transition-[border-color,color,transform] duration-200 group-hover:scale-110 group-hover:border-ink group-hover:text-ink group-active:scale-95">
            <PlusIcon className="h-6 w-6" />
          </span>
          <span className="w-28 text-center text-sm text-faint transition-colors group-hover:text-ink">
            단계 추가
          </span>
        </button>
      </div>
    </div>
  );
}
