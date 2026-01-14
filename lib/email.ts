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
    subject: '[QR Scanner] 비밀번호 재설정',
    headerTitle: '비밀번호 재설정',
    greeting: (name) => `안녕하세요, ${name}님`,
    body: '비밀번호 재설정을 요청하셨습니다.<br>아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.',
    buttonText: '비밀번호 재설정하기',
    expiry: '이 링크는 <strong>1시간</strong> 후에 만료됩니다.<br>본인이 요청하지 않았다면 이 이메일을 무시해주세요.',
    copyLink: '버튼이 작동하지 않으면 아래 링크를 복사하세요:',
    footer: '이 이메일은 발신 전용입니다.',
    textBody: (name, resetUrl) => `안녕하세요, ${name}님\n\n비밀번호 재설정을 요청하셨습니다.\n아래 링크를 클릭하여 새 비밀번호를 설정해주세요.\n\n${resetUrl}\n\n이 링크는 1시간 후에 만료됩니다.\n본인이 요청하지 않았다면 이 이메일을 무시해주세요.`,
  },
  en: {
    subject: '[QR Scanner] Password Reset',
    headerTitle: 'Password Reset',
    greeting: (name) => `Hello, ${name}`,
    body: 'You have requested a password reset.<br>Click the button below to set a new password.',
    buttonText: 'Reset Password',
    expiry: 'This link will expire in <strong>1 hour</strong>.<br>If you did not request this, please ignore this email.',
    copyLink: 'If the button doesn\'t work, copy the link below:',
    footer: 'This is an automated email.',
    textBody: (name, resetUrl) => `Hello, ${name}\n\nYou have requested a password reset.\nClick the link below to set a new password.\n\n${resetUrl}\n\nThis link will expire in 1 hour.\nIf you did not request this, please ignore this email.`,
  },
  ja: {
    subject: '[QR Scanner] パスワードリセット',
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
    subject: '[QR Scanner] 密码重置',
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
    subject: '[QR Scanner] Restablecer contraseña',
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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.headerTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">QR Scanner</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${t.headerTitle}</p>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 20px;">${t.greeting(name)}</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                ${t.body}
              </p>

              <!-- CTA 버튼 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      ${t.buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                ${t.expiry}
              </p>

              <!-- 링크 복사 영역 -->
              <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; word-break: break-all;">
                <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">${t.copyLink}</p>
                <a href="${resetUrl}" style="color: #667eea; font-size: 12px; text-decoration: none;">${resetUrl}</a>
              </div>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} QR Scanner. All rights reserved.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                ${t.footer}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = t.textBody(name, resetUrl) + `\n\n© ${new Date().getFullYear()} QR Scanner`;

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
