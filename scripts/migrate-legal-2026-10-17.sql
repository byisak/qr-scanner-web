-- 약관 문서 갱신 (2026-10-17)
--  1) 이용약관(terms) ko 신규 발행
--  2) 개인정보 처리방침: 서버 호스팅 사업자를 실제 위탁 업체(Vercel·Supabase·Resend·Cloudflare)로 구체화
--  3) 설정 메뉴 경로 변경 반영 (앱 1.3.0 설정 화면 정리: 정보 / 업무 기능 → 실시간 PC 전송)
-- 여러 번 실행해도 안전하다 (replace 대상이 없으면 바뀌지 않음, terms 는 ON CONFLICT DO NOTHING)

BEGIN;

-- 3) 메뉴 경로
UPDATE legal_documents SET content = replace(content, '설정 → 앱 정보 및 지원 → 사용 분석 동의', '설정 → 정보 → 사용 분석 동의'), updated_at = now()
 WHERE content LIKE '%설정 → 앱 정보 및 지원 → 사용 분석 동의%';
UPDATE legal_documents SET content = replace(content, '설정 → 실시간 서버 전송', '설정 → 업무 기능 → 실시간 PC 전송'), updated_at = now()
 WHERE content LIKE '%설정 → 실시간 서버 전송%';
UPDATE legal_documents SET content = replace(content, 'Settings → App Info &amp; Support → Usage Analytics', 'Settings → About → Usage Analytics'), updated_at = now()
 WHERE content LIKE '%Settings → App Info &amp; Support → Usage Analytics%';
UPDATE legal_documents SET content = replace(content, 'Settings → Realtime Server Sync', 'Settings → Work tools → Live PC sync'), updated_at = now()
 WHERE content LIKE '%Settings → Realtime Server Sync%';

-- 2) 위탁 업체 (ko)
UPDATE legal_documents SET content = replace(content,
  '<li><p><strong>서버 호스팅 사업자:</strong> scanview.app 서버와 데이터베이스 운영(회원 정보, 실시간 서버 전송 데이터 보관) / 위탁 계약 종료 또는 회원 탈퇴 시까지</p>
</li>',
  '<li><p><strong>Vercel Inc. (미국, 서버는 서울 리전에서 실행)</strong>: scanview.app 웹 서비스와 API 서버 운영 / 회원 정보와 실시간 전송 데이터의 처리(저장은 아래 Supabase) / 위탁 계약 종료 시까지</p>
</li>
<li><p><strong>Supabase Inc. (미국, 데이터베이스는 서울 리전에 저장)</strong>: 회원 정보, 실시간 전송 데이터(세션·스캔 값) 보관과 실시간 알림 전달 / 회원 탈퇴 후 30일 이내 삭제 또는 위탁 계약 종료 시까지</p>
</li>
<li><p><strong>Resend Inc. (미국)</strong>: 비밀번호 재설정 메일 발송(받는 사람 이메일 주소, 이름, 재설정 링크) / 발송 기록은 Resend 정책에 따른 기간 동안 보관</p>
</li>
<li><p><strong>Cloudflare, Inc. (미국)</strong>: scanview.app 도메인 이름 관리와 문의 메일(support@scanview.app) 전달 / 전달 후 보관하지 않음</p>
</li>'), updated_at = now()
 WHERE type = 'privacy' AND locale = 'ko' AND content LIKE '%<strong>서버 호스팅 사업자:</strong>%';

-- 2) 위탁 업체 (en)
UPDATE legal_documents SET content = replace(content,
  '<li><p><strong>Server hosting provider:</strong> operating the scanview.app server and database (account information and Realtime Server Sync data) / until the service contract ends or you delete your account</p>
</li>',
  '<li><p><strong>Vercel Inc. (USA; servers run in the Seoul region)</strong>: runs the scanview.app website and API server / processes account information and live sync data (stored at Supabase below) / until the service contract ends</p>
</li>
<li><p><strong>Supabase Inc. (USA; database stored in the Seoul region)</strong>: stores account information and live sync data (sessions and scan values) and delivers real-time updates / deleted within 30 days after you delete your account, or when the service contract ends</p>
</li>
<li><p><strong>Resend Inc. (USA)</strong>: sends password reset emails (recipient email address, name, reset link) / delivery logs kept for the period set by Resend</p>
</li>
<li><p><strong>Cloudflare, Inc. (USA)</strong>: manages the scanview.app domain and forwards support emails (support@scanview.app) / not stored after forwarding</p>
</li>'), updated_at = now()
 WHERE type = 'privacy' AND locale = 'en' AND content LIKE '%<strong>Server hosting provider:</strong>%';

-- 1) 이용약관 (ko)
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'terms', 'ko',
  $title$QR 스캐너 서비스 이용약관$title$,
  $body$<p>이 약관은 큐비온(이하 "회사")이 제공하는 QR 스캐너 앱(Android·iOS, 이하 "앱")과 실시간 스캔 확인 웹 서비스 scanview.app(이하 앱과 함께 "서비스")의 이용 조건과 절차, 회사와 이용자의 권리·의무를 정합니다. 이 약관은 2026년 10월 17일부터 시행합니다.</p>
<h2>제1조 (정의)</h2>
<ul>
<li><p><strong>이용자:</strong> 이 약관에 따라 서비스를 이용하는 사람을 말합니다. 회원가입 없이 앱을 쓰는 사람도 포함합니다.</p>
</li>
<li><p><strong>회원:</strong> 이메일, Google 또는 Apple 계정으로 가입해 로그인한 이용자를 말합니다.</p>
</li>
<li><p><strong>세션:</strong> 회원이 실시간 PC 전송을 위해 만든 스캔 모음 단위를 말합니다. 세션마다 고유 주소(링크)가 있습니다.</p>
</li>
<li><p><strong>스캔 데이터:</strong> 회원이 세션으로 전송한 코드 값과 스캔 시각 등을 말합니다.</p>
</li>
</ul>
<h2>제2조 (약관의 효력과 변경)</h2>
<ul>
<li><p>이 약관은 서비스 화면 또는 scanview.app에 게시해 효력이 생깁니다.</p>
</li>
<li><p>회사는 관련 법령을 어기지 않는 범위에서 약관을 바꿀 수 있습니다. 바꿀 때는 시행일과 바뀌는 내용을 시행일 7일 전부터(이용자에게 불리한 변경은 30일 전부터) scanview.app 또는 앱에 알립니다.</p>
</li>
<li><p>바뀐 약관에 동의하지 않으면 서비스 이용을 멈추고 탈퇴할 수 있습니다. 시행일 이후에도 계속 이용하면 바뀐 약관에 동의한 것으로 봅니다.</p>
</li>
</ul>
<h2>제3조 (서비스 내용)</h2>
<ul>
<li><p>QR 코드·바코드 스캔과 기록, 코드 생성, 재고 실사 등 앱 기능. 이 기능의 데이터는 이용자 기기에만 저장됩니다.</p>
</li>
<li><p>회원에게 제공하는 실시간 PC 전송: 앱에서 스캔한 값을 scanview.app 세션으로 보내 웹 화면에서 바로 확인하는 기능</p>
</li>
<li><p>서비스는 현재 무료로 제공합니다. 유료 기능을 새로 제공하게 되면 가격과 조건을 미리 알리고, 이용자가 동의한 경우에만 요금을 받습니다.</p>
</li>
</ul>
<h2>제4조 (회원가입과 계정 관리)</h2>
<ul>
<li><p>회원가입은 선택 사항입니다. 실시간 PC 전송을 쓰려면 회원가입과 로그인이 필요합니다.</p>
</li>
<li><p>회원은 정확한 정보로 가입해야 하며, 다른 사람의 이메일이나 계정을 쓰면 안 됩니다.</p>
</li>
<li><p>비밀번호와 로그인 상태의 기기는 회원이 직접 관리해야 합니다. 계정이 도용된 것을 알게 되면 바로 비밀번호를 바꾸고 회사에 알려 주세요.</p>
</li>
<li><p>만 14세 미만은 회원으로 가입할 수 없습니다.</p>
</li>
</ul>
<h2>제5조 (세션과 스캔 데이터)</h2>
<ul>
<li><p>세션과 스캔 데이터의 권리와 책임은 그것을 만든 회원에게 있습니다. 회사는 서비스를 제공하는 데 필요한 범위에서만 이를 저장·처리합니다.</p>
</li>
<li><p>새 세션은 기본으로 <strong>공개</strong>이며, 공개 세션은 주소를 아는 사람 누구나 볼 수 있습니다. 개인정보나 영업 비밀이 담긴 코드를 보낼 때는 세션을 비공개로 바꾸거나 비밀번호를 설정해야 합니다. 공개 설정으로 생긴 노출은 회사의 고의나 중대한 과실이 없는 한 회사가 책임지지 않습니다.</p>
</li>
<li><p>회원이 삭제한 세션은 휴지통에 30일 동안 보관된 뒤 영구 삭제됩니다.</p>
</li>
<li><p>회사는 장애나 오류에 대비해 데이터를 보호하려고 노력하지만, 중요한 스캔 데이터는 회원이 직접 내보내기(CSV·엑셀)로 따로 보관하기를 권합니다.</p>
</li>
</ul>
<h2>제6조 (금지 행위)</h2>
<p>이용자는 다음 행위를 해서는 안 됩니다.</p>
<ul>
<li><p>다른 사람의 계정이나 세션에 허락 없이 접근하거나, 세션 비밀번호를 무작위로 알아내려는 행위</p>
</li>
<li><p>서비스 서버에 과도한 요청을 보내거나 자동화 도구로 비정상적으로 이용해 서비스 운영을 방해하는 행위</p>
</li>
<li><p>불법 정보, 다른 사람의 개인정보, 악성 코드로 연결되는 주소를 세션으로 퍼뜨리는 행위</p>
</li>
<li><p>서비스를 역설계하거나 회사의 허락 없이 복제·판매하는 행위</p>
</li>
<li><p>그 밖에 관련 법령을 어기는 행위</p>
</li>
</ul>
<p>회사는 이런 행위가 확인되면 해당 세션을 비공개로 바꾸거나 삭제하고, 계정 이용을 제한할 수 있습니다. 제한할 때는 이유를 회원에게 알리며, 회원은 support@scanview.app으로 이의를 신청할 수 있습니다.</p>
<h2>제7조 (서비스 변경과 중단)</h2>
<ul>
<li><p>회사는 운영상·기술상 필요에 따라 서비스의 일부를 바꾸거나 중단할 수 있습니다. 회원에게 영향이 큰 변경이나 중단은 30일 전에 알립니다.</p>
</li>
<li><p>설비 점검, 장애, 천재지변 등 부득이한 경우에는 미리 알리지 못하고 서비스가 잠시 멈출 수 있습니다.</p>
</li>
<li><p>서비스 전체를 종료할 때는 최소 30일 전에 알리고, 그 기간 동안 회원이 스캔 데이터를 내보낼 수 있게 합니다.</p>
</li>
</ul>
<h2>제8조 (회원 탈퇴)</h2>
<ul>
<li><p>회원은 언제든 앱의 설정 → 프로필(계정 설정) → 회원탈퇴에서 탈퇴하거나, <a href="https://scanview.app/legal/account-deletion" target="_blank" rel="noopener noreferrer">계정 및 데이터 삭제 안내</a>에 따라 이메일로 삭제를 요청할 수 있습니다.</p>
</li>
<li><p>탈퇴하면 바로 로그인이 막히고, 서버에 남은 계정 정보와 세션·스캔 데이터는 30일 이내에 영구 삭제됩니다.</p>
</li>
</ul>
<h2>제9조 (책임의 한계)</h2>
<ul>
<li><p>회사는 무료로 제공하는 서비스와 관련해 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다. 다만 회사의 고의나 중대한 과실로 생긴 손해는 예외로 합니다.</p>
</li>
<li><p>스캔 결과의 정확성은 코드 상태, 조명, 기기 카메라에 따라 달라질 수 있습니다. 재고 수량이나 결제처럼 중요한 판단에 쓸 때는 이용자가 결과를 한 번 더 확인해야 합니다.</p>
</li>
<li><p>스캔한 주소(URL)로 연결되는 외부 사이트의 내용과 그 사이트에서 생긴 손해는 회사가 책임지지 않습니다.</p>
</li>
<li><p>이용자가 이 약관이나 관련 법령을 어겨 생긴 손해는 그 이용자가 책임집니다.</p>
</li>
</ul>
<h2>제10조 (개인정보 보호)</h2>
<p>회사는 이용자의 개인정보를 <a href="https://scanview.app/legal/privacy" target="_blank" rel="noopener noreferrer">개인정보 처리방침</a>에 따라 처리합니다.</p>
<h2>제11조 (분쟁 해결과 관할)</h2>
<ul>
<li><p>서비스 이용과 관련해 궁금한 점이나 불만이 있으면 support@scanview.app으로 연락해 주세요. 회사는 받은 날부터 영업일 기준 7일 안에 답변합니다.</p>
</li>
<li><p>이 약관은 대한민국 법률을 따르며, 분쟁이 생기면 민사소송법에 따른 관할 법원에서 해결합니다.</p>
</li>
</ul>
<h2>부칙</h2>
<p>이 약관은 2026년 10월 17일부터 시행합니다.</p>
<p>문의: support@scanview.app · 운영: 큐비온$body$,
  '1.0', true, now()
)
ON CONFLICT (type, locale) DO NOTHING;

COMMIT;

SELECT type, locale, is_published,
       (content LIKE '%Supabase Inc.%') AS has_processors,
       (content LIKE '%앱 정보 및 지원%' OR content LIKE '%App Info &amp; Support%') AS old_path_left
  FROM legal_documents ORDER BY type, locale;
