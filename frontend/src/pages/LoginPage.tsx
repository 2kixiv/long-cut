import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginRequest } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { TextInput } from "../components/ui/TextInput";
import { Button } from "../components/ui/Button";
import { ErrorText } from "../components/ui/Message";

export function LoginPage() {
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
      const { access_token } = await loginRequest(email, password);
      login(access_token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm animate-rise flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold text-center">로그인</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <TextInput
          type="email"
          required
          label="이메일"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextInput
          type="password"
          required
          label="비밀번호"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <ErrorText>{error}</ErrorText>}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        계정이 없으신가요? <Link to="/signup" className="font-medium text-ink underline underline-offset-4 hover:opacity-70">회원가입</Link>
      </p>
    </div>
  );
}
