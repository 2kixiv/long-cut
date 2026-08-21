const BASE_URL = "http://localhost:8001";

export async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Request failed: ${res.status}`);
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