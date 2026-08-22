import type { TreeNode } from "./tree";

export const WIDTH = 360;
export const STEP_HEIGHT = 132;
export const CHILD_HEIGHT = 96;
export const AMPLITUDE = 84;
export const BRANCH_DX = 68;

/** 인덱스에 따라 좌우로 흔들리는 오프셋 (주기 8) */
function offsetFor(index: number): number {
    return Math.round(AMPLITUDE * Math.sin((index * Math.PI) / 4));
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export interface Point {
    x: number;
    y: number;
}

export interface PlacedChild extends Point {
    node: TreeNode;
}

export interface PlacedNode extends Point {
    node: TreeNode;
    index: number;
    children: PlacedChild[];
}

export interface Layout {
    nodes: PlacedNode[];
    addPoint: Point;
    height: number;
}

/**
 * 펼쳐진 노드가 있으면 그 아래로 하위 단계 자리를 만들고
 * 뒤따르는 노드들을 그만큼 밀어냅니다.
 */
export function buildLayout(
    nodes: TreeNode[],
    expandedId: number | null
): Layout {
    let cursor = 0;

    const placed = nodes.map((node, index) => {
        const x = WIDTH / 2 + offsetFor(index);
        const y = cursor + STEP_HEIGHT / 2;

        cursor += STEP_HEIGHT;

        const expanded = node.id === expandedId && node.children.length > 0;

        // 경로가 화면 오른쪽에 치우쳐 있으면 곁가지를 왼쪽으로 냅니다
        const direction = x > WIDTH / 2 ? -1 : 1;
        const childX = clamp(x + direction * BRANCH_DX, 56, WIDTH - 56);

        const children: PlacedChild[] = expanded
            ? node.children.map((child, childIndex) => ({
                  node: child,
                  x: childX,
                  y: cursor + CHILD_HEIGHT / 2 + childIndex * CHILD_HEIGHT,
              }))
            : [];

        cursor += children.length * CHILD_HEIGHT;

        return { node, index, x, y, children };
    });

    const addPoint = {
        x: WIDTH / 2 + offsetFor(nodes.length),
        y: cursor + STEP_HEIGHT / 2,
    };

    return { nodes: placed, addPoint, height: cursor + STEP_HEIGHT };
}

/** 점들을 잇는 S자 곡선. 각 구간을 세로 중간지점 제어점으로 부드럽게 연결합니다. */
export function buildPathData(points: Point[]): string {
    if (points.length < 2) return "";

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const cur = points[i];
        const half = (cur.y - prev.y) / 2;

        d += ` C ${prev.x} ${prev.y + half}, ${cur.x} ${cur.y - half}, ${cur.x} ${cur.y}`;
    }

    return d;
}

/** 부모에서 갈라져 하위 단계들을 세로로 훑는 곁가지 */
export function buildBranchData(parent: Point, children: Point[]): string {
    if (children.length === 0) return "";

    const first = children[0];
    const last = children[children.length - 1];
    const half = (first.y - parent.y) / 2;

    let d = `M ${parent.x} ${parent.y}`;
    d += ` C ${parent.x} ${parent.y + half}, ${first.x} ${first.y - half}, ${first.x} ${first.y}`;

    if (children.length > 1) {
        d += ` L ${last.x} ${last.y}`;
    }

    return d;
}

/** 완료 표시가 이어진 마지막 지점. 여기까지 진한 선이 그려집니다. */
export function lastDoneIndex(nodes: TreeNode[]): number {
    let last = -1;

    nodes.forEach((node, index) => {
        if (node.status === "done") last = index;
    });

    return last;
}
