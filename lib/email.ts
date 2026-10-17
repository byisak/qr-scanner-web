// lib/email.ts - 이메일 발송 유틸리티 (Resend 사용)
import { Resend } from 'resend';

// Resend API 키 (RESEND_API_KEY 또는 기존 SMTP_PASS 사용)
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.SMTP_PASS || '';

// 발신자 설정 (EMAIL_FROM 또는 기존 SMTP_FROM 사용)
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'QR Scanner <onboarding@resend.dev>';

// Resend 클라이언트 (지연 초기화)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!RESEND_API_KEY) {
    // console.log('⚠️ RESEND_API_KEY not configured.');
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }

  return resendClient;
}

// 이메일 발송 결과 타입
interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// 다국어 이메일 텍스트
const emailTranslations: Record<string, {
  subject: string;
  headerTitle: string;
  greeting: (name: string) => string;
  body: string;
  buttonText: string;
  expiry: string;
  copyLink: string;
  footer: string;
  textBody: (name: string, resetUrl: string) => string;
}> = {
  ko: {
    subject: '[ScanView] 비밀번호 재설정',
    headerTitle: '비밀번호 재설정',
    greeting: (name) => `${name}님, 비밀번호를 새로 정해 주세요`,
    body: '비밀번호 재설정 요청을 받았어요.<br>아래 버튼을 눌러 새 비밀번호를 정하면 돼요.',
    buttonText: '새 비밀번호 정하기',
    expiry: '이 링크는 <strong>1시간</strong> 동안만 쓸 수 있어요.<br>직접 요청하지 않았다면 이 메일은 무시해도 괜찮아요.',
    copyLink: '버튼이 열리지 않으면 아래 주소를 브라우저에 붙여 넣어 주세요',
    footer: '발신 전용 메일이에요. 궁금한 점은 support@scanview.app으로 보내 주세요.',
    textBody: (name, resetUrl) => `${name}님, 비밀번호를 새로 정해 주세요\n\n비밀번호 재설정 요청을 받았어요.\n아래 주소를 열어 새 비밀번호를 정하면 돼요.\n\n${resetUrl}\n\n이 링크는 1시간 동안만 쓸 수 있어요.\n직접 요청하지 않았다면 이 메일은 무시해도 괜찮아요.`,
  },
  en: {
    subject: '[ScanView] Password Reset',
    headerTitle: 'Password Reset',
    greeting: (name) => `Hello, ${name}`,
    body: 'You have requested a password reset.<br>Click the button below to set a new password.',
    buttonText: 'Reset Password',
    expiry: 'This link will expire in <strong>1 hour</strong>.<br>If you did not request this, please ignore this email.',
    copyLink: 'If the button doesn\'t work, copy the link below:',
    footer: 'This is a no-reply email. Questions? Write to support@scanview.app.',
    textBody: (name, resetUrl) => `Hello, ${name}\n\nYou have requested a password reset.\nClick the link below to set a new password.\n\n${resetUrl}\n\nThis link will expire in 1 hour.\nIf you did not request this, please ignore this email.`,
  },
  ja: {
    subject: '[ScanView] パスワードリセット',
    headerTitle: 'パスワードリセット',
    greeting: (name) => `${name}様、こんにちは`,
    body: 'パスワードリセットのリクエストを受け付けました。<br>下のボタンをクリックして新しいパスワードを設定してください。',
    buttonText: 'パスワードをリセット',
    expiry: 'このリンクは<strong>1時間</strong>後に期限切れになります。<br>リクエストしていない場合は、このメールを無視してください。',
    copyLink: 'ボタンが機能しない場合は、以下のリンクをコピーしてください：',
    footer: 'このメールは送信専用です。',
    textBody: (name, resetUrl) => `${name}様、こんにちは\n\nパスワードリセットのリクエストを受け付けました。\n下のリンクをクリックして新しいパスワードを設定してください。\n\n${resetUrl}\n\nこのリンクは1時間後に期限切れになります。\nリクエストしていない場合は、このメールを無視してください。`,
  },
  zh: {
    subject: '[ScanView] 密码重置',
    headerTitle: '密码重置',
    greeting: (name) => `您好，${name}`,
    body: '您已请求重置密码。<br>请点击下面的按钮设置新密码。',
    buttonText: '重置密码',
    expiry: '此链接将在<strong>1小时</strong>后过期。<br>如果您没有请求此操作，请忽略此邮件。',
    copyLink: '如果按钮不起作用，请复制以下链接：',
    footer: '这是一封自动发送的邮件。',
    textBody: (name, resetUrl) => `您好，${name}\n\n您已请求重置密码。\n请点击下面的链接设置新密码。\n\n${resetUrl}\n\n此链接将在1小时后过期。\n如果您没有请求此操作，请忽略此邮件。`,
  },
  es: {
    subject: '[ScanView] Restablecer contraseña',
    headerTitle: 'Restablecer contraseña',
    greeting: (name) => `Hola, ${name}`,
    body: 'Ha solicitado restablecer su contraseña.<br>Haga clic en el botón de abajo para establecer una nueva contraseña.',
    buttonText: 'Restablecer contraseña',
    expiry: 'Este enlace expirará en <strong>1 hora</strong>.<br>Si no solicitó esto, ignore este correo electrónico.',
    copyLink: 'Si el botón no funciona, copie el siguiente enlace:',
    footer: 'Este es un correo electrónico automático.',
    textBody: (name, resetUrl) => `Hola, ${name}\n\nHa solicitado restablecer su contraseña.\nHaga clic en el siguiente enlace para establecer una nueva contraseña.\n\n${resetUrl}\n\nEste enlace expirará en 1 hora.\nSi no solicitó esto, ignore este correo electrónico.`,
  },
};

/**
 * 이메일 발송
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<SendEmailResult> {
  const client = getResendClient();

  if (!client) {
    // console.log(`📧 [DEV] Email would be sent to: ${to}`);
    // console.log(`📧 [DEV] Subject: ${subject}`);
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    const result = await client.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    if (result.error) {
      // console.error('❌ Email send error:', result.error);
      return {
        success: false,
        error: result.error.message,
      };
    }

    // console.log(`✅ Email sent to ${to}: ${result.data?.id}`);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    // console.error('❌ Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
  locale: string = 'ko'
): Promise<SendEmailResult> {
  // 지원하지 않는 언어는 영어로 fallback
  const t = emailTranslations[locale] || emailTranslations['en'];

  // 이름은 사용자가 입력한 값이라 HTML에 넣기 전에 이스케이프한다
  const fallbackName: Record<string, string> = { ko: '회원', en: 'there', ja: 'お客', zh: '用户', es: 'usuario' };
  const safeName = escapeHtml(name || fallbackName[locale] || fallbackName.en);
  const safeUrl = escapeHtml(resetUrl);
  const year = new Date().getFullYear();

  // scanview.app 그래파이트 디자인: 무채색 바탕 + 먹색 버튼 하나, 큰 둥근 카드, 그라데이션 없음
  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${t.headerTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Noto Sans KR','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#18181b;word-break:keep-all;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr>
      <td style="padding:40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;margin:0 auto;">
          <!-- 로고 -->
          <tr>
            <td style="padding:0 4px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="width:28px;height:28px;background-color:#27272a;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="display:inline-block;width:8px;height:8px;background-color:#f2b230;border-radius:2px;"></span>
                  </td>
                  <td style="padding-left:10px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#18181b;">ScanView</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 카드 -->
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e4e4e7;border-radius:22px;padding:36px 32px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#52525b;">${t.headerTitle}</p>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.35;font-weight:800;letter-spacing:-0.02em;color:#18181b;">${t.greeting(safeName)}</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;letter-spacing:-0.01em;color:#52525b;">${t.body}</p>

              <!-- 주요 버튼: 먹색 pill, 높이 50 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#27272a;border-radius:9999px;">
                    <a href="${safeUrl}" style="display:inline-block;padding:15px 28px;font-size:15px;line-height:20px;font-weight:700;color:#fafafa;text-decoration:none;border-radius:9999px;">${t.buttonText}</a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#52525b;">${t.expiry}</p>

              <!-- 주소 직접 복사 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;">
                <tr>
                  <td style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:14px;padding:14px 16px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#52525b;">${t.copyLink}</p>
                    <a href="${safeUrl}" style="font-size:13px;line-height:1.5;color:#18181b;text-decoration:underline;word-break:break-all;">${safeUrl}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding:20px 4px 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
              ${t.footer}<br>
              © ${year} ScanView · <a href="https://scanview.app" style="color:#a1a1aa;text-decoration:underline;">scanview.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = t.textBody(name || '', resetUrl) + `\n\n© ${year} ScanView · https://scanview.app`;

  return sendEmail(email, t.subject, html, text);
}

/**
 * 이메일 설정 테스트
 */
export async function testEmailConnection(): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    return false;
  }

  try {
    // API 키 유효성 확인을 위해 도메인 목록 조회
    const domains = await client.domains.list();
    // console.log('✅ Resend API connection verified');
    // console.log(`📧 Available domains: ${domains.data?.data?.map(d => d.name).join(', ') || 'none'}`);
    return true;
  } catch (error) {
    // console.error('❌ Resend API connection failed:', error);
    return false;
  }
}
