import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup, login as loginRequest } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { TextInput } from "../components/ui/TextInput";
import { Button } from "../components/ui/Button";
import { ErrorText } from "../components/ui/Message";
import { GoogleLoginButton } from "../components/GoogleLoginButton";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [groupWidth, setGroupWidth] = useState<number | null>(null);

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
    <div className="mx-auto flex min-h-screen max-w-sm animate-rise flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold text-center">회원가입</h1>

      <div
        className="flex w-full flex-col gap-4 self-center"
        style={groupWidth ? { width: groupWidth } : undefined}
      >
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
            minLength={8}
            label="비밀번호 (8자 이상)"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <ErrorText>{error}</ErrorText>}

          <Button ref={submitButtonRef} type="submit" variant="primary" disabled={submitting}>
            {submitting ? "가입 중..." : "회원가입"}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs text-faint">또는</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <GoogleLoginButton
          onError={setError}
          matchWidthRef={submitButtonRef}
          onWidthMeasured={setGroupWidth}
        />
      </div>

      <p className="text-center text-sm text-muted">
        이미 계정이 있으신가요? <Link to="/login" className="font-medium text-ink underline underline-offset-4 hover:opacity-70">로그인</Link>
      </p>
    </div>
  );
}
