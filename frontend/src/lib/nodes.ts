import type { RoadmapNode } from "./api";

/** 경로에 그릴 최상위 노드들 (하위 노드는 제외) */
export function pathNodes(nodes: RoadmapNode[]): RoadmapNode[] {
    return nodes
        .filter((node) => node.parent_node_id === null)
        .sort((a, b) => a.order_index - b.order_index || a.id - b.id);
}

/** 부모 id별로 하위 노드를 묶습니다. 순서대로 정렬되어 있습니다. */
export function groupChildren(nodes: RoadmapNode[]): Record<number, RoadmapNode[]> {
    const groups: Record<number, RoadmapNode[]> = {};

    for (const node of nodes) {
        if (node.parent_node_id === null) continue;

        (groups[node.parent_node_id] ??= []).push(node);
    }

    for (const list of Object.values(groups)) {
        list.sort((a, b) => a.order_index - b.order_index || a.id - b.id);
    }

    return groups;
}
