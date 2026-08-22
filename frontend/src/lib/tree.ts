import type { RoadmapNode } from "./api";

export interface TreeNode extends RoadmapNode {
    children: TreeNode[];
}

/**
 * 백엔드는 로드맵의 모든 노드를 평면 배열로 내려줍니다.
 * parent_node_id를 기준으로 메모리에서 트리로 조립합니다.
 */
export function buildTree(nodes: RoadmapNode[]): TreeNode[] {
    const byId = new Map<number, TreeNode>();

    for (const node of nodes) {
        byId.set(node.id, { ...node, children: [] });
    }

    const roots: TreeNode[] = [];

    for (const node of byId.values()) {
        if (node.parent_node_id === null) {
            roots.push(node);
            continue;
        }

        const parent = byId.get(node.parent_node_id);

        // 부모가 응답에 없으면 고아 노드가 사라지므로 최상위로 올려 보여줍니다
        if (parent) {
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    }

    sortRecursively(roots);

    return roots;
}

function sortRecursively(list: TreeNode[]) {
    list.sort((a, b) => a.order_index - b.order_index || a.id - b.id);

    for (const node of list) {
        sortRecursively(node.children);
    }
}

export function countDone(nodes: TreeNode[]): number {
    return nodes.filter((node) => node.status === "done").length;
}
