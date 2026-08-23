const BASE_URL = "http://localhost:8001";

export async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");

    // FormData는 Content-Type을 브라우저가 boundary와 함께 직접 설정해야 합니다.
    const isFormData = options.body instanceof FormData;

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = body?.detail;

        if (typeof detail === "string") {
            throw new Error(detail);
        }
        // FastAPI의 422 검증 에러는 detail이 객체 배열로 옵니다
        if (Array.isArray(detail)) {
            throw new Error(detail.map((d) => d.msg).join(", "));
        }
        throw new Error(`Request failed: ${res.status}`);
    }

    // 204 No Content는 본문이 없어서 res.json()이 실패합니다
    if (res.status === 204) {
        return null;
    }

    return res.json();
}

export interface UserResponse {
    id: number;
    email: string;
}

export interface Token {
    access_token: string;
    token_type: string;
}

export function signup(email: string, password: string): Promise<UserResponse> {
    return apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export function login(email: string, password: string): Promise<Token> {
    return apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export interface Roadmap {
    id: number;
    title: string;
    description: string | null;
    created_at: string;
}

export interface RoadmapCreate {
    title: string;
    description?: string | null;
}

export interface RoadmapUpdate {
    title?: string;
    description?: string | null;
}

export function getRoadmaps(): Promise<Roadmap[]> {
    return apiFetch("/roadmaps");
}

export function getRoadmap(id: number): Promise<Roadmap> {
    return apiFetch(`/roadmaps/${id}`);
}

export function createRoadmap(req: RoadmapCreate): Promise<Roadmap> {
    return apiFetch("/roadmaps", {
        method: "POST",
        body: JSON.stringify(req),
    });
}

export function updateRoadmap(id: number, req: RoadmapUpdate): Promise<Roadmap> {
    return apiFetch(`/roadmaps/${id}`, {
        method: "PATCH",
        body: JSON.stringify(req),
    });
}

export async function deleteRoadmap(id: number): Promise<void> {
    await apiFetch(`/roadmaps/${id}`, { method: "DELETE" });
}

export type NodeStatus = "not_started" | "in_progress" | "done";

export interface RoadmapNode {
    id: number;
    roadmap_id: number;
    parent_node_id: number | null;
    title: string;
    description: string | null;
    order_index: number;
    status: NodeStatus;
    created_at: string;
}

export interface NodeUpdate {
    title?: string;
    description?: string | null;
    status?: NodeStatus;
    order_index?: number;
    parent_node_id?: number | null;
}

export function getNodes(roadmapId: number): Promise<RoadmapNode[]> {
    return apiFetch(`/roadmaps/${roadmapId}/nodes`);
}

export function updateNode(
    roadmapId: number,
    nodeId: number,
    req: NodeUpdate
): Promise<RoadmapNode> {
    return apiFetch(`/roadmaps/${roadmapId}/nodes/${nodeId}`, {
        method: "PATCH",
        body: JSON.stringify(req),
    });
}

export interface NodeCreate {
    title: string;
    description?: string | null;
    parent_node_id?: number | null;
}

export function createNode(
    roadmapId: number,
    req: NodeCreate
): Promise<RoadmapNode> {
    return apiFetch(`/roadmaps/${roadmapId}/nodes`, {
        method: "POST",
        body: JSON.stringify(req),
    });
}
export interface Note {
    id: number;
    node_id: number;
    title: string;
    content: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface NoteCreate {
    title: string;
    content?: string | null;
}

export interface NoteUpdate {
    title?: string;
    content?: string | null;
}

export function getNotes(roadmapId: number, nodeId: number): Promise<Note[]> {
    return apiFetch(`/roadmaps/${roadmapId}/nodes/${nodeId}/notes`);
}

export function getNote(
    roadmapId: number,
    nodeId: number,
    noteId: number
): Promise<Note> {
    return apiFetch(`/roadmaps/${roadmapId}/nodes/${nodeId}/notes/${noteId}`);
}

export function createNote(
    roadmapId: number,
    nodeId: number,
    req: NoteCreate
): Promise<Note> {
    return apiFetch(`/roadmaps/${roadmapId}/nodes/${nodeId}/notes`, {
        method: "POST",
        body: JSON.stringify(req),
    });
}

export function updateNote(
    roadmapId: number,
    nodeId: number,
    noteId: number,
    req: NoteUpdate
): Promise<Note> {
    return apiFetch(`/roadmaps/${roadmapId}/nodes/${nodeId}/notes/${noteId}`, {
        method: "PATCH",
        body: JSON.stringify(req),
    });
}

export async function deleteNote(
    roadmapId: number,
    nodeId: number,
    noteId: number
): Promise<void> {
    await apiFetch(`/roadmaps/${roadmapId}/nodes/${nodeId}/notes/${noteId}`, {
        method: "DELETE",
    });
}

export interface Attachment {
    id: number;
    note_id: number;
    filename: string;
    content_type: string;
    size: number;
    created_at: string;
}

export function getAttachments(
    roadmapId: number,
    nodeId: number,
    noteId: number
): Promise<Attachment[]> {
    return apiFetch(`/roadmaps/${roadmapId}/nodes/${nodeId}/notes/${noteId}/attachments`);
}

export function uploadAttachment(
    roadmapId: number,
    nodeId: number,
    noteId: number,
    file: File
): Promise<Attachment> {
    const formData = new FormData();
    formData.append("file", file);

    return apiFetch(`/roadmaps/${roadmapId}/nodes/${nodeId}/notes/${noteId}/attachments`, {
        method: "POST",
        body: formData,
    });
}

export async function deleteAttachment(
    roadmapId: number,
    nodeId: number,
    noteId: number,
    attachmentId: number
): Promise<void> {
    await apiFetch(
        `/roadmaps/${roadmapId}/nodes/${nodeId}/notes/${noteId}/attachments/${attachmentId}`,
        { method: "DELETE" }
    );
}

/** 인증 헤더가 필요해 <img src>/<a href>로 바로 열 수 없어서, blob으로 받아옵니다. */
async function fetchAttachmentBlob(
    roadmapId: number,
    nodeId: number,
    noteId: number,
    attachmentId: number
): Promise<Blob> {
    const token = localStorage.getItem("token");

    const res = await fetch(
        `${BASE_URL}/roadmaps/${roadmapId}/nodes/${nodeId}/notes/${noteId}/attachments/${attachmentId}`,
        {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
    );

    if (!res.ok) {
        throw new Error("파일을 불러오지 못했습니다");
    }

    return res.blob();
}

export async function downloadAttachment(
    roadmapId: number,
    nodeId: number,
    noteId: number,
    attachment: Attachment
): Promise<void> {
    const blob = await fetchAttachmentBlob(roadmapId, nodeId, noteId, attachment.id);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = attachment.filename;
    a.click();

    URL.revokeObjectURL(url);
}

/**
 * 이미지 미리보기용 object URL을 만듭니다. 호출한 쪽에서 다 쓰고 나면
 * (예: React 클린업에서) URL.revokeObjectURL로 직접 해제해야 합니다.
 */
export async function getAttachmentImageUrl(
    roadmapId: number,
    nodeId: number,
    noteId: number,
    attachmentId: number
): Promise<string> {
    const blob = await fetchAttachmentBlob(roadmapId, nodeId, noteId, attachmentId);
    return URL.createObjectURL(blob);
}
