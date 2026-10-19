"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Script from "next/script"
import { QrCode, CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Field, focusFirstInvalid } from "@/components/form/field"
import { Card, CardContent, CardDescription, CardHeader, CardFooter } from "@/components/ui/card"
import { useAuth, type AuthError } from "@/contexts/auth-context"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { LanguageSwitcher } from "@/components/language-switcher"

// Google Identity Services 타입 정의
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              type?: 'standard' | 'icon';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              width?: number;
              logo_alignment?: 'left' | 'center';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: {
            id_token: string;
            code: string;
          };
          user?: {
            email?: string;
            name?: {
              firstName?: string;
              lastName?: string;
            };
          };
        }>;
      };
    };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 폼 전체에 걸친 오류 (예: 이메일·비밀번호 조합이 틀림) */
function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-field bg-destructive-soft px-3.5 py-3 text-13 font-semibold text-destructive">
      <CircleAlert className="mt-[2px] size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithGoogle, loginWithApple, isAuthenticated, isLoading: authLoading } = useAuth()
  const t = useTranslations()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)
  const [isAppleLoading, setIsAppleLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [fieldErrors, setFieldErrors] = React.useState({ email: "", password: "" })
  const formRef = React.useRef<HTMLFormElement>(null)
  const [googleScriptLoaded, setGoogleScriptLoaded] = React.useState(false)
  const [appleScriptLoaded, setAppleScriptLoaded] = React.useState(false)

  // Google Client ID
  // 환경 변수가 없으면 앱과 같은 웹용 OAuth 클라이언트 ID(공개 값, lib/social-verify.ts 의 기본값과 같음)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "585698187056-3tqjnjbcdidddn9ddvp2opp0mgj7tgd4.apps.googleusercontent.com"
  // Apple Client ID (Service ID)
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID

  // 이미 로그인된 경우 대시보드로 리다이렉트
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [authLoading, isAuthenticated, router])

  // 이미 로드된 스크립트 확인 (클라이언트 사이드 라우팅 대응)
  React.useEffect(() => {
    if (window.google && googleClientId) {
      setGoogleScriptLoaded(true)
    }
    if (window.AppleID && appleClientId) {
      setAppleScriptLoaded(true)
    }
  }, [googleClientId, appleClientId])

  // Google 로그인 콜백
  const handleGoogleCallback = React.useCallback(async (response: { credential: string }) => {
    setError("")
    setIsGoogleLoading(true)

    try {
      await loginWithGoogle(response.credential)
      router.push("/dashboard")
    } catch {
      setError(t("auth.googleLoginFailed"))
    } finally {
      setIsGoogleLoading(false)
    }
  }, [loginWithGoogle, router, t])

  // Google Sign-In 초기화
  React.useEffect(() => {
    if (googleScriptLoaded && window.google && googleClientId) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
      })
    }
  }, [googleScriptLoaded, googleClientId, handleGoogleCallback])

  // Google 공식 버튼: 누르면 로그인 팝업이 뜬다 (원탭 프롬프트는 브라우저에 구글 계정이 로그인돼 있을 때만 떠서 쓰지 않는다)
  const locale = useLocale()
  const { resolvedTheme } = useTheme()
  const googleBtnRef = React.useRef<HTMLDivElement>(null)
  const [googleRendered, setGoogleRendered] = React.useState(false)
  React.useEffect(() => {
    const el = googleBtnRef.current
    if (!googleScriptLoaded || !window.google || !googleClientId || !el) return
    el.innerHTML = ""
    window.google.accounts.id.renderButton(el, {
      theme: resolvedTheme === "dark" ? "filled_black" : "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
      logo_alignment: "center",
      width: Math.min(400, Math.max(200, Math.round(el.offsetWidth))),
      locale,
    })
    // 실제로 버튼이 그려졌을 때만 자리표시를 걷는다 (허용되지 않은 도메인이면 크기 0 인 틀만 남는다)
    let tries = 0
    const timer = window.setInterval(() => {
      const frame = el.querySelector("iframe")
      if (frame && frame.offsetHeight > 0) { setGoogleRendered(true); window.clearInterval(timer) }
      else if (++tries > 40) window.clearInterval(timer)
    }, 150)
    return () => window.clearInterval(timer)
  }, [googleScriptLoaded, googleClientId, resolvedTheme, locale])

  // Apple Sign-In 초기화
  React.useEffect(() => {
    if (appleScriptLoaded && window.AppleID && appleClientId) {
      window.AppleID.auth.init({
        clientId: appleClientId,
        scope: 'name email',
        redirectURI: `${window.location.origin}/api/auth/social/apple/callback`,
        usePopup: true,
      })
    }
  }, [appleScriptLoaded, appleClientId])

  // Apple 로그인 핸들러
  const handleAppleLogin = async () => {
    if (!window.AppleID) {
      setError(t("auth.appleNotAvailable"))
      return
    }

    setError("")
    setIsAppleLoading(true)

    try {
      const response = await window.AppleID.auth.signIn()
      // Apple user 객체를 loginWithApple 형식으로 변환
      const appleUser = response.user ? {
        email: response.user.email,
        name: response.user.name
          ? `${response.user.name.firstName || ''} ${response.user.name.lastName || ''}`.trim()
          : undefined
      } : undefined
      await loginWithApple(response.authorization.id_token, appleUser)
      router.push("/dashboard")
    } catch (err) {
      // 사용자가 취소한 경우는 에러 표시하지 않음
      if (err instanceof Error && err.message.includes('popup_closed')) {
        setIsAppleLoading(false)
        return
      }
      setError(t("auth.appleLoginFailed"))
    } finally {
      setIsAppleLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // 입력 확인: 입력 아래 빨간 글자 + 첫 오류 칸으로 포커스
    const nextErrors = {
      email: EMAIL_RE.test(email.trim()) ? "" : t("auth.invalidEmail"),
      password: password ? "" : t("profile.passwordRequired"),
    }
    setFieldErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current))
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err) {
      // 서버 문구 대신 상황별 해요체 문구
      const code = (err as AuthError)?.code
      setError(code === "AUTH_INVALID_CREDENTIALS" ? t("auth.invalidCredentials") : t("auth.loginFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-background px-4 py-16" aria-busy="true">
        <span className="sr-only" role="status">{t("common.loading")}</span>
        <Skeleton className="h-[520px] w-full max-w-md rounded-card" />
      </main>
    )
  }

  return (
    <main id="main" className="relative grid min-h-dvh place-items-center bg-background px-4 pb-12 pt-20">
      {/* Google Identity Services Script */}
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          onLoad={() => setGoogleScriptLoaded(true)}
          strategy="lazyOnload"
        />
      )}

      {/* Apple Sign In Script */}
      {appleClientId && (
        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          onLoad={() => setAppleScriptLoaded(true)}
          strategy="lazyOnload"
        />
      )}

      {/* Language Switcher */}
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <Card className="enter w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-secondary text-foreground">
            <QrCode className="size-7" aria-hidden="true" />
          </div>
          <h1 className="type-h2">{t("auth.login")}</h1>
          <CardDescription>{t("auth.loginDescription")}</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5">
          <form ref={formRef} onSubmit={handleEmailLogin} className="grid gap-4" noValidate>
            <Field label={t("auth.email")} error={fieldErrors.email}>
              <Input
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </Field>

            <Field label={t("auth.password")} error={fieldErrors.password}>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </Field>

            {error && <FormError>{error}</FormError>}

            <Button type="submit" size="xl" className="w-full" disabled={isLoading}>
              {isLoading ? t("auth.loggingIn") : t("auth.login")}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-13 text-muted-foreground" role="separator">
            <span className="h-px flex-1 bg-border" />
            {t("auth.or")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-2">
            {/* Google Sign-In: 구글 공식 버튼 (스크립트가 그리기 전까지는 같은 크기의 꺼진 자리표시) */}
            <div className="relative flex min-h-11 w-full justify-center" aria-busy={isGoogleLoading || undefined}>
              <div ref={googleBtnRef} className="flex w-full justify-center [color-scheme:normal]" />
              {!googleRendered ? (
                <Button variant="outline" size="xl" className="absolute inset-0 w-full" disabled>
                  {t("auth.loginWithGoogle")}
                </Button>
              ) : null}
            </div>

            {/* Apple Sign-In Button */}
            <Button
              variant="outline"
              size="xl"
              className="w-full"
              onClick={appleClientId ? handleAppleLogin : undefined}
              disabled={appleClientId ? isAppleLoading || !appleScriptLoaded : true}
              aria-busy={isAppleLoading || undefined}
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                  </svg>
              {t("auth.loginWithApple")}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2 text-center">
          <p className="text-15 text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="font-semibold text-foreground underline underline-offset-4">
              {t("auth.signUp")}
            </Link>
          </p>
          <Link href="/" className="text-13 text-muted-foreground underline-offset-4 hover:underline">
            {t("auth.backToHome")}
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
