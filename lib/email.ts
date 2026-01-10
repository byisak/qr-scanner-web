// lib/email.ts - 이메일 발송 유틸리티
import nodemailer from 'nodemailer';

// 환경 변수에서 SMTP 설정 가져오기
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'QR Scanner <noreply@scanview.app>';

// SMTP 설정 여부 확인
const isEmailConfigured = SMTP_USER && SMTP_PASS;

// 트랜스포터 생성 (지연 초기화)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!isEmailConfigured) {
    console.log('⚠️ SMTP not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

// 이메일 발송 결과 타입
interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 이메일 발송
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<SendEmailResult> {
  const transport = getTransporter();

  if (!transport) {
    console.log(`📧 [DEV] Email would be sent to: ${to}`);
    console.log(`📧 [DEV] Subject: ${subject}`);
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    const result = await transport.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    console.log(`✅ Email sent to ${to}: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
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
  resetUrl: string
): Promise<SendEmailResult> {
  const subject = '[QR Scanner] 비밀번호 재설정';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>비밀번호 재설정</title>
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
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">비밀번호 재설정</p>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 20px;">안녕하세요, ${name}님</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                비밀번호 재설정을 요청하셨습니다.<br>
                아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.
              </p>

              <!-- CTA 버튼 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      비밀번호 재설정하기
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                이 링크는 <strong>1시간</strong> 후에 만료됩니다.<br>
                본인이 요청하지 않았다면 이 이메일을 무시해주세요.
              </p>

              <!-- 링크 복사 영역 -->
              <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; word-break: break-all;">
                <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">버튼이 작동하지 않으면 아래 링크를 복사하세요:</p>
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
                이 이메일은 발신 전용입니다.
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

  const text = `
안녕하세요, ${name}님

비밀번호 재설정을 요청하셨습니다.
아래 링크를 클릭하여 새 비밀번호를 설정해주세요.

${resetUrl}

이 링크는 1시간 후에 만료됩니다.
본인이 요청하지 않았다면 이 이메일을 무시해주세요.

© ${new Date().getFullYear()} QR Scanner
`;

  return sendEmail(email, subject, html, text);
}

/**
 * SMTP 연결 테스트
 */
export async function testEmailConnection(): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    return false;
  }

  try {
    await transport.verify();
    console.log('✅ SMTP connection verified');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
}
