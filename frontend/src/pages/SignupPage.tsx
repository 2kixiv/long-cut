import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup, login as loginRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signup(email, password);
      // 회원가입 성공 후 바로 로그인 처리해서 토큰을 받아온다
      const { access_token } = await loginRequest(email, password);
      login(access_token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold text-center">회원가입</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="비밀번호 (8자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-purple-600 px-3 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        이미 계정이 있으신가요? <Link to="/login" className="text-purple-600">로그인</Link>
      </p>
    </div>
  );
}
