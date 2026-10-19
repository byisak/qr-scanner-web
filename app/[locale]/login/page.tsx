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
import { useTranslations } from "next-intl"
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

  // Google 로그인 핸들러 (커스텀 버튼용)
  const handleGoogleLogin = () => {
    if (!window.google) {
      setError(t("auth.googleLoginFailed"))
      return
    }
    setError("")
    setIsGoogleLoading(true)
    // Google One Tap 프롬프트 표시
    // @ts-expect-error - Google API 타입 정의에 prompt 콜백 인자가 없음
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setIsGoogleLoading(false)
        setError(t("auth.googleLoginFailed"))
      }
    })
  }

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
            {/* Google Sign-In Button - 커스텀 버튼 */}
            <Button
              variant="outline"
              size="xl"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || !googleScriptLoaded || !googleClientId}
              aria-busy={isGoogleLoading || undefined}
            >
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              {t("auth.loginWithGoogle")}
            </Button>

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
