"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  profileImage: string | null
  provider: "email" | "google" | "apple" | "kakao"
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  loginWithApple: (identityToken: string, user?: { email?: string; name?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

const ACCESS_TOKEN_KEY = "qr_access_token"
const REFRESH_TOKEN_KEY = "qr_refresh_token"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [accessToken, setAccessToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // 토큰 저장
  const saveTokens = (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    setAccessToken(access)
  }

  // 토큰 삭제
  const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    setAccessToken(null)
  }

  // 사용자 정보 가져오기
  const fetchUser = async (token: string): Promise<User | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.user
    } catch {
      return null
    }
  }

  // 토큰 갱신
  const refreshTokens = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) return null

    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) return null

      const data = await res.json()
      saveTokens(data.accessToken, data.refreshToken)
      return data.accessToken
    } catch {
      return null
    }
  }

  // 초기화
  React.useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      console.log('🔐 Auth 초기화 - 저장된 토큰:', storedToken ? `${storedToken.substring(0, 20)}...` : 'null')

      if (storedToken) {
        let currentToken = storedToken
        let userData = await fetchUser(storedToken)

        if (!userData) {
          // 토큰 만료 시 갱신 시도
          console.log('🔐 토큰 만료 - 갱신 시도')
          const newToken = await refreshTokens()
          if (newToken) {
            currentToken = newToken
            userData = await fetchUser(newToken)
          }
        }

        if (userData) {
          console.log('🔐 사용자 인증 성공:', userData.email, '토큰 설정 중...')
          setUser(userData)
          setAccessToken(currentToken)
        } else {
          console.log('🔐 사용자 인증 실패 - 토큰 삭제')
          clearTokens()
        }
      }

      setIsLoading(false)
    }

    initAuth()
  }, [])

  // 이메일 로그인
  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error?.message || "로그인에 실패했습니다.")
    }

    saveTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
  }

  // 회원가입
  const register = async (email: string, password: string, name: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error?.message || "회원가입에 실패했습니다.")
    }

    saveTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
  }

  // Google 로그인
  const loginWithGoogle = async (idToken: string) => {
    const res = await fetch("/api/auth/social/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error?.message || "Google 로그인에 실패했습니다.")
    }

    saveTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
  }

  // Apple 로그인
  const loginWithApple = async (identityToken: string, appleUser?: { email?: string; name?: string }) => {
    const res = await fetch("/api/auth/social/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identityToken, user: appleUser }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error?.message || "Apple 로그인에 실패했습니다.")
    }

    saveTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
  }

  // 로그아웃
  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    if (refreshToken && accessToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        })
      } catch {
        // 로그아웃 API 실패해도 로컬 토큰은 삭제
      }
    }

    clearTokens()
    setUser(null)
    router.push("/")
  }

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    if (accessToken) {
      const userData = await fetchUser(accessToken)
      if (userData) {
        setUser(userData)
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        accessToken,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
