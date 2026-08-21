import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { logout } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">내 로드맵</h1>
        <button
          onClick={logout}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        >
          로그아웃
        </button>
      </div>

      <p className="text-gray-500">
        로그인 성공! 로드맵 목록/생성 기능은 백엔드 Step 3(로드맵 CRUD API)이
        준비되면 여기에 붙일 예정입니다.
      </p>
    </div>
  );
}
