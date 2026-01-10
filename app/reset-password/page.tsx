'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2, QrCode } from 'lucide-react';

// 다국어 번역
const translations: Record<string, {
  pageTitle: string;
  subtitle: string;
  formTitle: string;
  formSubtitle: string;
  newPassword: string;
  newPasswordPlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
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
}> = {
  ko: {
    pageTitle: 'QR Scanner',
    subtitle: '새 비밀번호 설정',
    formTitle: '새 비밀번호 입력',
    formSubtitle: '안전한 비밀번호를 설정해주세요',
    newPassword: '새 비밀번호',
    newPasswordPlaceholder: '새 비밀번호 입력',
    confirmPassword: '비밀번호 확인',
    confirmPasswordPlaceholder: '비밀번호 다시 입력',
    requirements: '비밀번호 요구사항',
    req8chars: '8자 이상',
    reqLetter: '영문 포함',
    reqNumber: '숫자 포함',
    reqMatch: '비밀번호 일치',
    submitButton: '비밀번호 변경',
    processing: '처리 중...',
    successTitle: '비밀번호 변경 완료',
    successMessage: '새로운 비밀번호로 로그인해주세요.',
    errorTitle: '링크가 만료되었습니다',
    errorMessage: '비밀번호 재설정 링크가 만료되었거나 이미 사용되었습니다.',
    invalidLink: '유효하지 않은 링크입니다.',
    goHome: '홈으로 이동',
    footer: 'All rights reserved.',
  },
  en: {
    pageTitle: 'QR Scanner',
    subtitle: 'Set New Password',
    formTitle: 'Enter New Password',
    formSubtitle: 'Please set a secure password',
    newPassword: 'New Password',
    newPasswordPlaceholder: 'Enter new password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter password',
    requirements: 'Password Requirements',
    req8chars: 'At least 8 characters',
    reqLetter: 'Contains letters',
    reqNumber: 'Contains numbers',
    reqMatch: 'Passwords match',
    submitButton: 'Change Password',
    processing: 'Processing...',
    successTitle: 'Password Changed',
    successMessage: 'Please log in with your new password.',
    errorTitle: 'Link Expired',
    errorMessage: 'The password reset link has expired or has already been used.',
    invalidLink: 'Invalid link.',
    goHome: 'Go to Home',
    footer: 'All rights reserved.',
  },
  ja: {
    pageTitle: 'QR Scanner',
    subtitle: '新しいパスワードの設定',
    formTitle: '新しいパスワードを入力',
    formSubtitle: '安全なパスワードを設定してください',
    newPassword: '新しいパスワード',
    newPasswordPlaceholder: '新しいパスワードを入力',
    confirmPassword: 'パスワード確認',
    confirmPasswordPlaceholder: 'パスワードを再入力',
    requirements: 'パスワード要件',
    req8chars: '8文字以上',
    reqLetter: '英字を含む',
    reqNumber: '数字を含む',
    reqMatch: 'パスワードが一致',
    submitButton: 'パスワードを変更',
    processing: '処理中...',
    successTitle: 'パスワード変更完了',
    successMessage: '新しいパスワードでログインしてください。',
    errorTitle: 'リンクが期限切れです',
    errorMessage: 'パスワードリセットリンクは期限切れか、既に使用されています。',
    invalidLink: '無効なリンクです。',
    goHome: 'ホームへ移動',
    footer: 'All rights reserved.',
  },
  zh: {
    pageTitle: 'QR Scanner',
    subtitle: '设置新密码',
    formTitle: '输入新密码',
    formSubtitle: '请设置一个安全的密码',
    newPassword: '新密码',
    newPasswordPlaceholder: '输入新密码',
    confirmPassword: '确认密码',
    confirmPasswordPlaceholder: '再次输入密码',
    requirements: '密码要求',
    req8chars: '至少8个字符',
    reqLetter: '包含字母',
    reqNumber: '包含数字',
    reqMatch: '密码匹配',
    submitButton: '更改密码',
    processing: '处理中...',
    successTitle: '密码已更改',
    successMessage: '请使用新密码登录。',
    errorTitle: '链接已过期',
    errorMessage: '密码重置链接已过期或已被使用。',
    invalidLink: '无效的链接。',
    goHome: '返回首页',
    footer: 'All rights reserved.',
  },
  vi: {
    pageTitle: 'QR Scanner',
    subtitle: 'Đặt mật khẩu mới',
    formTitle: 'Nhập mật khẩu mới',
    formSubtitle: 'Vui lòng đặt mật khẩu an toàn',
    newPassword: 'Mật khẩu mới',
    newPasswordPlaceholder: 'Nhập mật khẩu mới',
    confirmPassword: 'Xác nhận mật khẩu',
    confirmPasswordPlaceholder: 'Nhập lại mật khẩu',
    requirements: 'Yêu cầu mật khẩu',
    req8chars: 'Ít nhất 8 ký tự',
    reqLetter: 'Chứa chữ cái',
    reqNumber: 'Chứa số',
    reqMatch: 'Mật khẩu khớp',
    submitButton: 'Đổi mật khẩu',
    processing: 'Đang xử lý...',
    successTitle: 'Đã đổi mật khẩu',
    successMessage: 'Vui lòng đăng nhập bằng mật khẩu mới.',
    errorTitle: 'Liên kết đã hết hạn',
    errorMessage: 'Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng.',
    invalidLink: 'Liên kết không hợp lệ.',
    goHome: 'Về trang chủ',
    footer: 'All rights reserved.',
  },
};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const lang = searchParams.get('lang') || 'ko';

  // 번역 가져오기 (지원하지 않는 언어는 영어로 fallback)
  const t = translations[lang] || translations['en'];

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
        setErrorMessage(data.error?.message || t.errorMessage);
      }
    } catch {
      setStatus('error');
      setErrorMessage(t.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 배경 컴포넌트
  const Background = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] overflow-hidden">
      {/* 장식 원들 */}
      <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-80 h-80 bg-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* 그리드 패턴 */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>
    </div>
  );

  // 성공 화면
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <Background />
        <div className="w-full max-w-md relative z-10">
          {/* 로고 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl mb-4 shadow-2xl border border-white/30">
              <QrCode className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">{t.pageTitle}</h1>
          </div>

          {/* 카드 */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {t.successTitle}
              </h2>
              <p className="text-gray-600 mb-8">
                {t.successMessage}
              </p>
              <Button
                onClick={() => router.push('/')}
                className="w-full h-12 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
              >
                {t.goHome}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 화면
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <Background />
        <div className="w-full max-w-md relative z-10">
          {/* 로고 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl mb-4 shadow-2xl border border-white/30">
              <QrCode className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">{t.pageTitle}</h1>
          </div>

          {/* 카드 */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {t.errorTitle}
              </h2>
              <p className="text-gray-600 mb-8">
                {errorMessage || t.errorMessage}
              </p>
              <Button
                onClick={() => router.push('/')}
                className="w-full h-12 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
              >
                {t.goHome}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 폼 화면
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Background />
      <div className="w-full max-w-md relative z-10">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl mb-4 shadow-2xl border border-white/30">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">{t.pageTitle}</h1>
          <p className="text-white/80 mt-2">{t.subtitle}</p>
        </div>

        {/* 카드 */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t.formTitle}</h2>
            <p className="text-gray-500 text-sm mt-1">{t.formSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 새 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">{t.newPassword}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.newPasswordPlaceholder}
                  className="h-12 pr-12 rounded-xl border-gray-200 focus:border-[#667eea] focus:ring-[#667eea]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">{t.confirmPassword}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  className="h-12 pr-12 rounded-xl border-gray-200 focus:border-[#667eea] focus:ring-[#667eea]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 비밀번호 요구사항 */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">{t.requirements}</p>
              <div className="grid grid-cols-2 gap-2">
                <RequirementItem met={hasMinLength} text={t.req8chars} />
                <RequirementItem met={hasLetter} text={t.reqLetter} />
                <RequirementItem met={hasNumber} text={t.reqNumber} />
                <RequirementItem met={passwordsMatch} text={t.reqMatch} />
              </div>
            </div>

            {/* 제출 버튼 */}
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t.processing}
                </>
              ) : (
                t.submitButton
              )}
            </Button>
          </form>
        </div>

        {/* 푸터 */}
        <p className="text-center text-white/60 text-sm mt-6">
          © {new Date().getFullYear()} QR Scanner. {t.footer}
        </p>
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm transition-colors ${met ? 'text-emerald-600' : 'text-gray-400'}`}>
      {met ? (
        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />
      )}
      <span className="font-medium">{text}</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
