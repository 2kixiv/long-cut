import { useEffect, useRef, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_black" | "filled_blue";
      size?: "small" | "medium" | "large";
      width?: number;
      locale?: string;
    }
  ): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google 로그인 스크립트를 불러오지 못했습니다"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

interface Props {
  onError: (message: string) => void;
  /** 이 요소와 폭을 맞춥니다(보통 같은 폼의 제출 버튼) — GIS 버튼은 %가 아닌 고정 픽셀 폭만 받습니다. */
  matchWidthRef: RefObject<HTMLElement | null>;
  /**
   * 구글이 실제로 그려낸 버튼의 폭(px)을 알려줍니다. outline 테마는 위젯
   * 내부 여백 때문에 요청한 폭을 정확히 채우지 않아서, 요청 폭이 아니라
   * 실제 렌더링된 폭을 다시 재서 폼 쪽을 여기 맞추는 데 씁니다.
   */
  onWidthMeasured?: (width: number) => void;
}

/** Google Identity Services의 공식 버튼 위젯을 그대로 렌더링합니다(브랜딩 가이드라인상 커스텀 스타일 불가). */
export function GoogleLoginButton({ onError, matchWidthRef, onWidthMeasured }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError("Google 로그인이 설정되지 않았습니다 (VITE_GOOGLE_CLIENT_ID 누락)");
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const { access_token } = await loginWithGoogle(response.credential);
              login(access_token);
              navigate("/");
            } catch (err) {
              onError(err instanceof Error ? err.message : "Google 로그인에 실패했습니다");
            }
          },
        });

        // GIS 버튼은 %가 아니라 픽셀 고정 너비만 받습니다. 우리 컨테이너의 폭을
        // 재는 대신, 맞추려는 실제 버튼(matchWidthRef)을 직접 재야 div와 button의
        // stretch 계산 차이 같은 걸로 어긋날 여지가 없습니다.
        // (구글 위젯이 허용하는 범위는 대략 200~400px입니다.)
        const measuredWidth =
          matchWidthRef.current?.getBoundingClientRect().width ??
          containerRef.current.getBoundingClientRect().width;
        const width = Math.min(400, Math.max(200, Math.round(measuredWidth)));

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width,
          locale: "ko",
        });

        // 구글이 요청한 폭을 그대로 채우지 않을 수 있어서(위젯 내부 여백),
        // 실제로 삽입된 요소가 레이아웃을 마친 다음 프레임에 다시 잽니다.
        requestAnimationFrame(() => {
          const rendered = containerRef.current?.firstElementChild;
          const actualWidth = rendered?.getBoundingClientRect().width;
          if (!cancelled && actualWidth) {
            onWidthMeasured?.(Math.round(actualWidth));
          }
        });
      })
      .catch((err) => {
        if (!cancelled) {
          onError(err instanceof Error ? err.message : "Google 로그인을 불러오지 못했습니다");
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} />;
}
