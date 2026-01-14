"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Script from "next/script"
import { QrCode, Mail, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
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
  const [googleScriptLoaded, setGoogleScriptLoaded] = React.useState(false)
  const [appleScriptLoaded, setAppleScriptLoaded] = React.useState(false)

  // Google Client ID
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  // Apple Client ID (Service ID)
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID

  // 이미 로그인된 경우 대시보드로 리다이렉트
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [authLoading, isAuthenticated, router])

  // Google 로그인 콜백
  const handleGoogleCallback = React.useCallback(async (response: { credential: string }) => {
    setError("")
    setIsGoogleLoading(true)

    try {
      await loginWithGoogle(response.credential)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.googleLoginFailed"))
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
    // @ts-ignore - Google API 타입 정의 문제
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
      setError(err instanceof Error ? err.message : t("auth.appleLoginFailed"))
    } finally {
      setIsAppleLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
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
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t("auth.login")}</CardTitle>
          <CardDescription>
            {t("auth.loginDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={t("auth.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder={t("auth.password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.loggingIn")}
                </>
              ) : (
                t("auth.login")
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("auth.or")}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            {/* Google Sign-In Button - 커스텀 버튼 */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || !googleScriptLoaded || !googleClientId}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
              )}
              {t("auth.loginWithGoogle")}
            </Button>

            {/* Apple Sign-In Button */}
            {appleClientId ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAppleLogin}
                disabled={isAppleLoading || !appleScriptLoaded}
              >
                {isAppleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                  </svg>
                )}
                {t("auth.loginWithApple")}
              </Button>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                </svg>
                {t("auth.loginWithApple")}
              </Button>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground text-center">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-primary hover:underline">
              {t("auth.signUp")}
            </Link>
          </p>
          <Link href="/" className="text-sm text-muted-foreground hover:underline text-center">
            {t("auth.backToHome")}
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
