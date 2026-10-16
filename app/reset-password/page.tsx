'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, EyeOff, Lock, Check, Circle, CircleCheck, CircleX, QrCode } from 'lucide-react';

// 다국어 번역 (이 화면은 next-intl 제공자 밖이라 자체 번역표를 쓴다)
type Strings = {
  pageTitle: string;
  subtitle: string;
  formTitle: string;
  formSubtitle: string;
  newPassword: string;
  confirmPassword: string;
  requirements: string;
  req8chars: string;
  reqLetter: string;
  reqNumber: string;
  reqMatch: string;
  submitButton: string;
  processing: string;
  successTitle: string;
  successMessage: string;
  errorTitle: string;
  errorMessage: string;
  invalidLink: string;
  goHome: string;
  footer: string;
  showPassword: string;
  hidePassword: string;
};

const translations: Record<string, Strings> = {
  ko: {
    pageTitle: 'QR Scanner',
    subtitle: '새 비밀번호 설정',
    formTitle: '새 비밀번호 입력',
    formSubtitle: '안전한 비밀번호로 정해 주세요',
    newPassword: '새 비밀번호',
    confirmPassword: '비밀번호 확인',
    requirements: '비밀번호 조건',
    req8chars: '8자 이상',
    reqLetter: '영문 포함',
    reqNumber: '숫자 포함',
    reqMatch: '확인 칸과 같음',
    submitButton: '비밀번호 변경',
    processing: '바꾸는 중',
    successTitle: '비밀번호를 바꿨어요',
    successMessage: '새 비밀번호로 로그인해 주세요',
    errorTitle: '이 링크는 쓸 수 없어요',
    errorMessage: '비밀번호 재설정 링크가 만료됐거나 이미 사용됐어요. 비밀번호 찾기를 다시 해주세요',
    invalidLink: '올바르지 않은 링크예요',
    goHome: '홈으로',
    footer: 'All rights reserved.',
    showPassword: '비밀번호 보기',
    hidePassword: '비밀번호 숨기기',
  },
  en: {
    pageTitle: 'QR Scanner',
    subtitle: 'Set New Password',
    formTitle: 'Enter New Password',
    formSubtitle: 'Please set a secure password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    requirements: 'Password Requirements',
    req8chars: 'At least 8 characters',
    reqLetter: 'Contains letters',
    reqNumber: 'Contains numbers',
    reqMatch: 'Passwords match',
    submitButton: 'Change Password',
    processing: 'Processing',
    successTitle: 'Password Changed',
    successMessage: 'Please log in with your new password.',
    errorTitle: 'Link Expired',
    errorMessage: 'The password reset link has expired or has already been used.',
    invalidLink: 'Invalid link.',
    goHome: 'Go to Home',
    footer: 'All rights reserved.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  ja: {
    pageTitle: 'QR Scanner',
    subtitle: '新しいパスワードの設定',
    formTitle: '新しいパスワードを入力',
    formSubtitle: '安全なパスワードを設定してください',
    newPassword: '新しいパスワード',
    confirmPassword: 'パスワード確認',
    requirements: 'パスワード要件',
    req8chars: '8文字以上',
    reqLetter: '英字を含む',
    reqNumber: '数字を含む',
    reqMatch: 'パスワードが一致',
    submitButton: 'パスワードを変更',
    processing: '処理中',
    successTitle: 'パスワード変更完了',
    successMessage: '新しいパスワードでログインしてください。',
    errorTitle: 'リンクが期限切れです',
    errorMessage: 'パスワードリセットリンクは期限切れか、既に使用されています。',
    invalidLink: '無効なリンクです。',
    goHome: 'ホームへ移動',
    footer: 'All rights reserved.',
    showPassword: 'パスワードを表示',
    hidePassword: 'パスワードを隠す',
  },
  zh: {
    pageTitle: 'QR Scanner',
    subtitle: '设置新密码',
    formTitle: '输入新密码',
    formSubtitle: '请设置一个安全的密码',
    newPassword: '新密码',
    confirmPassword: '确认密码',
    requirements: '密码要求',
    req8chars: '至少8个字符',
    reqLetter: '包含字母',
    reqNumber: '包含数字',
    reqMatch: '密码匹配',
    submitButton: '更改密码',
    processing: '处理中',
    successTitle: '密码已更改',
    successMessage: '请使用新密码登录。',
    errorTitle: '链接已过期',
    errorMessage: '密码重置链接已过期或已被使用。',
    invalidLink: '无效的链接。',
    goHome: '返回首页',
    footer: 'All rights reserved.',
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
  },
  es: {
    pageTitle: 'QR Scanner',
    subtitle: 'Establecer nueva contraseña',
    formTitle: 'Ingrese nueva contraseña',
    formSubtitle: 'Por favor establezca una contraseña segura',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar contraseña',
    requirements: 'Requisitos de contraseña',
    req8chars: 'Al menos 8 caracteres',
    reqLetter: 'Contiene letras',
    reqNumber: 'Contiene números',
    reqMatch: 'Las contraseñas coinciden',
    submitButton: 'Cambiar contraseña',
    processing: 'Procesando',
    successTitle: 'Contraseña cambiada',
    successMessage: 'Por favor inicie sesión con su nueva contraseña.',
    errorTitle: 'Enlace expirado',
    errorMessage: 'El enlace para restablecer la contraseña ha expirado o ya se ha utilizado.',
    invalidLink: 'Enlace no válido.',
    goHome: 'Ir al inicio',
    footer: 'All rights reserved.',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
  },
};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const lang = searchParams.get('lang') || 'ko';

  // 번역 가져오기 (지원하지 않는 언어는 영어로 fallback)
  const t = translations[lang] || translations['en'];

  // 이 레이아웃은 lang="en" 고정이라, 실제 표시 언어로 맞춘다
  useEffect(() => {
    document.documentElement.lang = translations[lang] ? lang : 'en';
  }, [lang]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  // 비밀번호 유효성 검사
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isValid = hasMinLength && hasLetter && hasNumber && passwordsMatch;

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage(t.invalidLink);
    }
  }, [token, t.invalidLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        // 서버 문구 대신 이 화면의 언어별 문구
        setErrorMessage(t.errorMessage);
      }
    } catch {
      setStatus('error');
      setErrorMessage(t.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 성공·오류 화면 공통 틀
  const StatusCard = ({ ok, title, message }: { ok: boolean; title: string; message: string }) => (
    <Shell t={t}>
      <div className="flex flex-col items-center text-center">
        <div
          className={
            ok
              ? 'mb-4 flex size-14 items-center justify-center rounded-full bg-secondary text-foreground'
              : 'mb-4 flex size-14 items-center justify-center rounded-full bg-destructive-soft text-destructive'
          }
        >
          {ok ? <CircleCheck className="size-7" aria-hidden="true" /> : <CircleX className="size-7" aria-hidden="true" />}
        </div>
        <h2 className="type-h2" role={ok ? 'status' : 'alert'}>{title}</h2>
        <p className="mt-2 text-15 text-muted-foreground">{message}</p>
        <Button size="xl" onClick={() => router.push('/')} className="mt-6 w-full">
          {t.goHome}
        </Button>
      </div>
    </Shell>
  );

  // 성공 화면
  if (status === 'success') {
    return <StatusCard ok title={t.successTitle} message={t.successMessage} />;
  }

  // 에러 화면
  if (status === 'error') {
    return <StatusCard ok={false} title={t.errorTitle} message={errorMessage || t.errorMessage} />;
  }

  // 폼 화면
  return (
    <Shell t={t} subtitle={t.subtitle}>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-secondary text-foreground">
          <Lock className="size-6" aria-hidden="true" />
        </div>
        <h2 className="type-h3">{t.formTitle}</h2>
        <p className="mt-1 text-15 text-muted-foreground">{t.formSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <PasswordField
          id="password"
          label={t.newPassword}
          value={password}
          onChange={setPassword}
          shown={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          t={t}
          describedBy="password-reqs"
        />
        <PasswordField
          id="confirmPassword"
          label={t.confirmPassword}
          value={confirmPassword}
          onChange={setConfirmPassword}
          shown={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          t={t}
          describedBy="password-reqs"
        />

        {/* 비밀번호 조건: 모양(체크/빈 원)과 글자로 충족 여부를 함께 */}
        <div id="password-reqs" className="rounded-field border bg-secondary/60 p-4">
          <p className="mb-3 text-13 font-bold">{t.requirements}</p>
          <ul className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
            <RequirementItem met={hasMinLength} text={t.req8chars} />
            <RequirementItem met={hasLetter} text={t.reqLetter} />
            <RequirementItem met={hasNumber} text={t.reqNumber} />
            <RequirementItem met={passwordsMatch} text={t.reqMatch} />
          </ul>
        </div>

        <Button type="submit" size="xl" disabled={!isValid || isLoading} className="w-full">
          {isLoading ? t.processing : t.submitButton}
        </Button>
      </form>
    </Shell>
  );
}

/** 화면 틀: 가운데 카드 + 위 로고 + 아래 저작권 */
function Shell({ t, subtitle, children }: { t: Strings; subtitle?: string; children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <div className="enter w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-code bg-primary text-primary-foreground">
            <QrCode className="size-6" aria-hidden="true" />
          </div>
          <h1 className="type-h2">{t.pageTitle}</h1>
          {subtitle ? <p className="mt-1 text-15 text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="rounded-card border bg-card p-6 shadow-soft sm:p-8">{children}</div>
        <p className="mt-6 text-center text-13 text-muted-foreground">
          © {new Date().getFullYear()} QR Scanner. {t.footer}
        </p>
      </div>
    </main>
  );
}

/** 라벨 + 비밀번호 입력 + 보기/숨기기 (next-intl 밖이라 Field 대신 같은 모양의 직접 마크업) */
function PasswordField({
  id,
  label,
  value,
  onChange,
  shown,
  onToggle,
  t,
  describedBy,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  shown: boolean;
  onToggle: () => void;
  t: Strings;
  describedBy?: string;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={id} className="text-15 font-bold">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={shown ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={describedBy}
          className="pr-12"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label={shown ? t.hidePassword : t.showPassword}
          aria-pressed={shown}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <li className={`flex items-center gap-2 text-13 font-semibold ${met ? 'text-foreground' : 'text-muted-foreground'}`}>
      {met ? (
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" strokeWidth={3} aria-hidden="true" />
        </span>
      ) : (
        <Circle className="size-5 text-faint" aria-hidden="true" />
      )}
      <span>{text}</span>
    </li>
  );
}

function LoadingFallback() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-12" aria-busy="true">
      <div className="w-full max-w-md">
        <Skeleton className="mx-auto mb-3 size-12 rounded-code" />
        <Skeleton className="mx-auto mb-6 h-6 w-32 rounded-full" />
        <Skeleton className="h-[420px] w-full rounded-card" />
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
