-- 개인정보 처리방침(type = 'privacy') 갱신 — 앱 1.3.0 기준, 시행일 2026-10-16
-- 공개 주소: https://scanview.app/legal/privacy (?lang=ko|en)
-- 바뀐 점: AdMob·광고 ID 삭제(1.3.0에서 광고 제거), 실시간 서버 전송·공개 세션, Google/Apple 로그인,
--          위치·Google Maps Platform, Google 드라이브/iCloud 백업, 기기 권한, 보유 기간, 삭제 방법(account-deletion 링크),
--          만 14세 미만, 처리 위탁·국외 이전, 문의처(qrscanner.app.help@gmail.com) 추가.
-- 원문 마크다운: qr-scanner 저장소 store/privacy-policy-ko.md, store/privacy-policy-en.md
--
-- 적용 방법: 운영 DB에서 한 번 실행 (기존 ko/en 행을 덮어씀. 실행 전에 백업 권장)
--   psql "$DATABASE_URL" -c "\copy (SELECT * FROM legal_documents WHERE type='privacy') TO 'privacy-backup.csv' CSV HEADER"
--   psql "$DATABASE_URL" -f scripts/migrate-legal-privacy-2026-10-16.sql
--
-- 참고: ja/zh/es 개인정보 처리방침이 발행돼 있다면 옛 내용(AdMob 등)이 그대로 남는다.
--       번역본을 만들기 전까지 한국어로 대신 보이게 하려면 아래 문장의 주석을 풀어 함께 실행한다
--       (발행 해제된 언어는 공개 API가 ko 문서로 대체한다).
-- UPDATE legal_documents SET is_published = false, updated_at = NOW()
--   WHERE type = 'privacy' AND locale IN ('ja', 'zh', 'es');

BEGIN;

-- privacy / ko
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'privacy', 'ko',
  $title$QR 스캐너 개인정보 처리방침$title$,
  $body$<p>큐비온(이하 "회사")은 QR 스캐너 앱(Android·iOS, 이하 "앱")과 실시간 스캔 확인 웹 서비스 scanview.app(이하 앱과 함께 "서비스")을 이용하는 분의 개인정보를 「개인정보 보호법」 등 관련 법령에 따라 처리하고 보호합니다. 이 방침은 앱 1.3.0 버전 기준이며 2026년 10월 16일부터 시행합니다.</p>
<h2>1. 한눈에 보기</h2>
<ul>
<li><p>회원가입 없이 스캔, 코드 생성, 기록 관리 등 대부분의 기능을 쓸 수 있습니다. 이때 스캔 기록, 만든 코드, 스캔 사진, 설정은 <strong>기기 안에만</strong> 저장되고 회사 서버로 전송되지 않습니다.</p>
</li>
<li><p>앱에는 <strong>광고가 없으며 광고 ID를 수집하지 않습니다.</strong></p>
</li>
<li><p>회사 서버(scanview.app)로 정보가 가는 경우는 ① 회원가입·로그인을 할 때, ② 로그인한 상태에서 <strong>실시간 서버 전송</strong>을 직접 켰을 때뿐입니다.</p>
</li>
<li><p>사용 분석(Firebase Analytics)은 Android에서 기본으로 켜져 있고 iOS에서는 기본으로 꺼져 있습니다. <strong>설정 → 앱 정보 및 지원 → 사용 분석 동의</strong>에서 언제든 끄거나 켤 수 있습니다.</p>
</li>
<li><p>계정과 서버 데이터는 앱에서 바로 탈퇴하거나 <a href="https://scanview.app/legal/account-deletion" target="_blank" rel="noopener noreferrer">계정 및 데이터 삭제 안내</a> 페이지의 방법으로 삭제를 요청할 수 있습니다.</p>
</li>
</ul>
<h2>2. 처리하는 개인정보 항목과 수집 방법</h2>
<h3>2-1. 회원가입·로그인 (선택)</h3>
<p>회원가입은 선택 사항이며, 실시간 서버 전송 기능을 쓰려면 로그인이 필요합니다.</p>
<ul>
<li><p><strong>이메일 가입:</strong> 이메일 주소, 비밀번호, 이름(닉네임). 비밀번호는 복원할 수 없는 방식(솔트를 더한 scrypt 해시)으로만 저장합니다.</p>
</li>
<li><p><strong>Google 로그인:</strong> Google 계정의 이메일 주소, 이름, 프로필 사진 주소, Google 계정 고유 식별자</p>
</li>
<li><p><strong>Apple로 로그인(iOS):</strong> Apple이 전달하는 이메일 주소(사용자가 선택한 경우 Apple의 비공개 중계 주소), 이름(제공한 경우), Apple 계정 고유 식별자</p>
</li>
<li><p><strong>자동 생성 정보:</strong> 회원 번호, 로그인 유지용 인증 토큰, 앱이 만든 무작위 기기 식별자(로그인 기기 구분용이며 광고 ID나 하드웨어 식별자가 아님), 가입일, 마지막 로그인·접속 일시, 기능 잠금 해제 상태 기록</p>
</li>
</ul>
<h3>2-2. 실시간 서버 전송 (선택, 로그인 필요)</h3>
<p>설정 → 실시간 서버 전송을 켠 경우에만, 스캔할 때마다 다음 정보가 scanview.app 서버로 전송·저장됩니다.</p>
<ul>
<li><p>스캔한 코드의 내용(값), 스캔 시각, 회원 번호</p>
</li>
<li><p>세션 정보: 세션 ID, 세션 이름, 공개 여부, 세션 비밀번호(설정한 경우, 해시로 저장), 생성·최근 활동 일시</p>
</li>
</ul>
<p><strong>주의:</strong> 새 세션은 기본으로 <strong>공개</strong>입니다. 공개 세션은 세션 주소(링크)를 아는 사람이면 누구나 웹에서 스캔 내용을 볼 수 있습니다. 개인정보나 민감한 내용이 담긴 코드를 전송할 때는 세션을 비공개로 바꾸거나 비밀번호를 설정해 주세요.</p>
<h3>2-3. 사용 분석 (Firebase Analytics)</h3>
<p>앱 개선을 위해 Google의 Firebase Analytics로 다음 정보를 수집합니다.</p>
<ul>
<li><p>앱 인스턴스 ID(앱 설치마다 Firebase가 만드는 식별자), 화면 조회, 기능 사용 이벤트(예: 스캔·생성한 코드의 <strong>종류</strong>와 형식, 저장·공유 방법, 설정 변경, 오류 유형)</p>
</li>
<li><p>Firebase가 자동으로 수집하는 기기 모델, 운영체제와 버전, 앱 버전, 언어, 대략적인 국가·지역(IP 주소 기반), 첫 실행·세션 정보</p>
</li>
</ul>
<p>스캔하거나 만든 코드의 <strong>내용</strong>, 이메일, 이름은 분석 정보로 보내지 않으며, 광고 ID는 수집하지 않습니다. Android에서는 기본으로 켜져 있고, iOS에서는 사용자가 켜기 전까지 수집하지 않습니다. 설정 → 앱 정보 및 지원 → 사용 분석 동의에서 끄면 그때부터 수집을 멈춥니다.</p>
<h3>2-4. 위치 (선택)</h3>
<ul>
<li><p><strong>위치 QR 코드 만들기:</strong> 지도 화면에서 '현재 위치'를 누를 때만 위치 권한을 요청하고, 앱이 화면을 보고 있는 동안에만 기기의 현재 위치를 확인합니다. 백그라운드 위치는 사용하지 않습니다. 이 위치는 지도와 사용자가 만드는 QR 코드에만 쓰이며 회사 서버로 보내지 않습니다.</p>
</li>
<li><p><strong>장소 검색:</strong> 지도에서 장소를 검색하면 검색어와 현재 지도 중심 좌표(현재 위치일 수 있음)가 Google Maps Platform(Places·Geocoding)으로 전송됩니다. 좌표를 주소로 바꾸는 기능은 기기의 기본 위치 서비스(Android는 Google, iOS는 Apple)를 이용합니다.</p>
</li>
<li><p><strong>Wi-Fi QR로 연결(Android):</strong> Android가 Wi-Fi 연결에 위치 권한을 요구하기 때문에 요청하며, 앱은 이때 위치 정보를 수집하지 않습니다.</p>
</li>
</ul>
<h3>2-5. 기기 권한과 기기 안에서만 처리하는 정보</h3>
<p>다음 권한은 해당 기능을 쓸 때만 요청하며, 거부해도 나머지 기능은 쓸 수 있습니다. 아래 정보는 회사 서버로 전송하지 않습니다(실시간 서버 전송을 켠 경우의 스캔 값은 2-2 참고).</p>
<ul>
<li><p><strong>카메라:</strong> QR·바코드 스캔. 카메라 영상은 기기에서 바로 분석합니다. '스캔 사진 저장' 설정이 켜져 있으면 스캔 순간의 사진을 앱 내부 저장 공간에만 보관하며, 설정에서 끌 수 있습니다.</p>
</li>
<li><p><strong>사진:</strong> 만든 QR 코드나 스캔 이미지를 갤러리에 <strong>저장</strong>할 때만 사용합니다. 이미지에서 코드를 읽을 때는 시스템 사진 선택기로 사용자가 고른 사진만 기기에서 분석하며, 사진 보관함 전체를 읽지 않습니다.</p>
</li>
<li><p><strong>연락처:</strong> 연락처(vCard) QR을 사용자가 선택해 연락처에 추가할 때만 사용합니다. 기존 연락처를 읽거나 외부로 보내지 않습니다.</p>
</li>
<li><p><strong>캘린더:</strong> 일정 QR을 사용자가 선택해 캘린더에 추가할 때, 추가할 수 있는 캘린더 목록을 확인하고 일정을 씁니다. 일정 내용을 외부로 보내지 않습니다.</p>
</li>
<li><p><strong>NFC:</strong> NFC 태그를 읽어 스캔 기록에 저장합니다.</p>
</li>
<li><p><strong>알림:</strong> 복권 추첨일 알림 등 기기에서 예약하는 알림에만 사용합니다.</p>
</li>
<li><p><strong>생체 인증(Face ID·지문):</strong> 앱 잠금 해제에 운영체제 기능을 이용하며, 앱은 생체 정보를 받지도 저장하지도 않습니다.</p>
</li>
<li><p><strong>Wi-Fi 상태 확인·변경:</strong> Wi-Fi QR로 네트워크에 연결할 때 사용합니다.</p>
</li>
</ul>
<h3>2-6. 백업 (선택)</h3>
<ul>
<li><p><strong>Google 드라이브 백업:</strong> 사용자가 백업·복원을 실행할 때 사용자 본인의 Google 드라이브에 설정과 스캔 기록 백업 파일(JSON)을 저장하고, 복원할 때 그 백업 파일을 찾아 읽습니다. 백업 파일은 회사 서버를 거치지 않으며 회사는 그 내용에 접근하지 않습니다.</p>
</li>
<li><p><strong>iCloud(iOS):</strong> iCloud를 사용 중이면 앱 데이터가 사용자 본인의 iCloud에 동기화·백업될 수 있습니다. 이 역시 회사 서버를 거치지 않습니다.</p>
</li>
</ul>
<h3>2-7. 사용자가 직접 설정한 외부 전송</h3>
<ul>
<li><p><strong>스캔 URL 연동·상품 검색:</strong> 사용자가 이 기능을 켜고 주소나 검색 사이트를 지정하면, 스캔한 코드 값이 그 웹사이트로 전달됩니다. 전달된 정보는 해당 웹사이트의 개인정보 처리방침을 따릅니다.</p>
</li>
<li><p><strong>복권 당첨 확인:</strong> 동행복권 웹사이트에 회차 번호만 조회하며 개인정보는 보내지 않습니다.</p>
</li>
</ul>
<h3>2-8. 서비스 이용 중 자동으로 생성되는 정보</h3>
<p>서버에 접속하는 과정에서 IP 주소, 접속 일시, 요청 기록 등 접속 기록이 서버 운영 환경에 남을 수 있습니다. 이 정보는 보안과 장애 대응에만 사용합니다.</p>
<h2>3. 개인정보의 처리 목적</h2>
<ul>
<li><p>회원 식별, 로그인 유지, 계정 관리와 본인 확인(비밀번호 재설정 메일 발송 포함)</p>
</li>
<li><p>실시간 서버 전송 세션 생성과 스캔 데이터 표시·관리</p>
</li>
<li><p>기능 잠금 해제 상태를 기기 간에 유지</p>
</li>
<li><p>앱 사용 통계 분석, 오류 파악과 서비스 개선(사용 분석에 동의한 경우)</p>
</li>
<li><p>위치 QR 코드 생성을 위한 장소 검색과 지도 표시</p>
</li>
<li><p>부정 이용 방지, 보안, 문의 응대</p>
</li>
</ul>
<h2>4. 보유 및 이용 기간</h2>
<ul>
<li><p><strong>회원 정보:</strong> 회원 탈퇴 시까지 보유합니다. 탈퇴하면 즉시 로그인이 차단되고 로그인 토큰이 삭제되며, 남은 계정 정보는 탈퇴일로부터 30일 이내에 영구 삭제합니다.</p>
</li>
<li><p><strong>실시간 서버 전송 데이터(세션·스캔 값):</strong> 사용자가 세션이나 스캔을 삭제할 때까지 보유합니다. 웹 대시보드에서 삭제한 세션은 휴지통에 30일간 보관되어 그 사이 복구할 수 있고, 이후 영구 삭제할 수 있습니다. 회원 탈퇴 시에는 탈퇴일로부터 30일 이내에 함께 영구 삭제합니다.</p>
</li>
<li><p><strong>기능 잠금 해제 기록:</strong> 회원 탈퇴 시까지 보유하며, 탈퇴일로부터 30일 이내에 삭제합니다.</p>
</li>
<li><p><strong>사용 분석 정보:</strong> Firebase(Google 애널리틱스)에 설정된 보존 기간이 지나면 자동으로 삭제됩니다.</p>
</li>
<li><p><strong>기기 안의 정보(스캔 기록·사진·설정):</strong> 사용자가 앱에서 삭제하거나 앱을 삭제할 때까지 기기에 남습니다. 회사는 이 정보에 접근할 수 없습니다.</p>
</li>
<li><p>관계 법령에 따라 보존해야 하는 정보가 있으면 그 법령이 정한 기간 동안만 분리해 보관합니다.</p>
</li>
</ul>
<h2>5. 개인정보의 파기 절차와 방법</h2>
<p>보유 기간이 끝나거나 처리 목적을 달성한 개인정보는 지체 없이 파기합니다. 서버 데이터베이스에 저장된 정보는 복구할 수 없도록 삭제하며, 종이 문서로 출력한 개인정보는 없습니다.</p>
<h2>6. 개인정보의 제3자 제공</h2>
<p>회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 이용자가 직접 공개로 설정한 실시간 세션은 링크를 아는 사람이 볼 수 있으며, 법령에 따라 수사기관 등이 적법한 절차로 요구하는 경우에는 예외로 합니다.</p>
<h2>7. 개인정보 처리 위탁과 국외 이전</h2>
<p>회사는 서비스 제공을 위해 다음 업체의 서비스를 이용합니다. 아래 업체로 정보가 전송될 때는 앱 이용 중 암호화된 네트워크(HTTPS)로 전송됩니다.</p>
<ul>
<li><p><strong>Google LLC (미국)</strong></p>
<ul>
<li><p>Firebase Analytics: 2-3의 사용 분석 정보 / 앱 사용 분석 / 보존 기간 설정에 따라 삭제</p>
</li>
<li><p>Google Maps Platform: 장소 검색어, 지도 중심 좌표 / 장소 검색과 지도 표시 / 요청 처리 후 Google 정책에 따름</p>
</li>
<li><p>Google 로그인: 2-1의 Google 계정 정보 / 로그인 인증 / 회원 탈퇴 시까지</p>
</li>
<li><p>문의처: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 개인정보처리방침</a></p>
</li>
</ul>
</li>
<li><p><strong>Apple Inc. (미국, iOS)</strong></p>
<ul>
<li><p>Apple로 로그인: 2-1의 Apple 계정 정보 / 로그인 인증 / 회원 탈퇴 시까지</p>
</li>
<li><p>문의처: <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">Apple 개인정보처리방침</a></p>
</li>
</ul>
</li>
<li><p><strong>서버 호스팅 사업자:</strong> scanview.app 서버와 데이터베이스 운영(회원 정보, 실시간 서버 전송 데이터 보관) / 위탁 계약 종료 또는 회원 탈퇴 시까지</p>
</li>
</ul>
<p>이용자는 사용 분석을 끄거나 해당 기능(로그인, 장소 검색)을 쓰지 않는 방법으로 국외 이전을 거부할 수 있습니다. 이 경우 해당 기능만 쓸 수 없고 나머지 기능은 그대로 쓸 수 있습니다.</p>
<h2>8. 이용자의 권리와 행사 방법</h2>
<p>이용자는 언제든지 자신의 개인정보를 열람·정정·삭제하거나 처리 정지를 요구할 수 있습니다.</p>
<ul>
<li><p><strong>열람·정정:</strong> 앱의 설정 → 프로필(계정 설정)에서 이름(닉네임)을 확인·수정하고 비밀번호를 바꿀 수 있습니다.</p>
</li>
<li><p><strong>삭제(회원 탈퇴):</strong> 설정 → 프로필(계정 설정) → 위험 영역 → 회원탈퇴. 앱을 쓸 수 없으면 <a href="https://scanview.app/legal/account-deletion" target="_blank" rel="noopener noreferrer">계정 및 데이터 삭제 안내</a>에 따라 이메일로 요청할 수 있습니다.</p>
</li>
<li><p><strong>사용 분석 거부:</strong> 설정 → 앱 정보 및 지원 → 사용 분석 동의를 끕니다.</p>
</li>
<li><p><strong>권한 철회:</strong> 기기 설정에서 카메라·위치·사진·연락처·캘린더·알림 권한을 언제든 끌 수 있습니다.</p>
</li>
<li><p>그 밖의 요청은 아래 이메일로 보내 주시면 본인 확인 후 지체 없이(늦어도 10일 이내) 조치 결과를 알려 드립니다. 법정대리인이나 위임을 받은 사람을 통해서도 요청할 수 있습니다.</p>
</li>
</ul>
<h2>9. 만 14세 미만 아동</h2>
<p>서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 만 14세 미만 아동의 개인정보를 알면서 수집하지 않습니다. 만 14세 미만 아동이 회원가입한 사실을 알게 되면 해당 계정과 정보를 지체 없이 삭제합니다.</p>
<h2>10. 개인정보의 안전성 확보 조치</h2>
<ul>
<li><p>앱과 서버 사이의 모든 통신을 HTTPS·WSS로 암호화</p>
</li>
<li><p>비밀번호와 세션 비밀번호는 복원할 수 없는 해시로만 저장</p>
</li>
<li><p>기기에 저장하는 로그인 정보는 운영체제의 보안 저장소(Keychain·Keystore)에 보관</p>
</li>
<li><p>관리자 기능은 권한이 있는 담당자만 쓸 수 있도록 제한하고, 관리자 작업 기록을 남김</p>
</li>
</ul>
<h2>11. 개인정보 자동 수집 장치</h2>
<p>앱은 쿠키를 사용하지 않습니다. scanview.app 웹사이트는 로그인 상태 유지와 화면 설정 저장을 위해 브라우저 저장소(localStorage)를, 언어 설정 유지를 위해 쿠키를 사용하며, 브라우저 설정에서 삭제할 수 있습니다. 광고·추적 목적의 쿠키는 사용하지 않습니다.</p>
<h2>12. 개인정보 보호책임자와 문의처</h2>
<ul>
<li><p>운영자: 큐비온</p>
</li>
<li><p>개인정보 보호책임자: 큐비온 대표</p>
</li>
<li><p>이메일: <a href="mailto:qrscanner.app.help@gmail.com" target="_blank" rel="noopener noreferrer">qrscanner.app.help@gmail.com</a></p>
</li>
</ul>
<p>개인정보 침해에 대한 신고나 상담이 필요하면 아래 기관에 문의할 수 있습니다.</p>
<ul>
<li><p>개인정보침해신고센터: (국번 없이) 118, privacy.kisa.or.kr</p>
</li>
<li><p>개인정보분쟁조정위원회: 1833-6972, www.kopico.go.kr</p>
</li>
<li><p>대검찰청 사이버수사과: (국번 없이) 1301, www.spo.go.kr</p>
</li>
<li><p>경찰청 사이버수사국: (국번 없이) 182, ecrm.police.go.kr</p>
</li>
</ul>
<h2>13. 방침의 변경</h2>
<p>이 방침의 내용이 바뀌면 시행 7일 전부터 이 페이지와 앱을 통해 알립니다. 이용자 권리에 중요한 변경이 있으면 시행 30일 전부터 알립니다.</p>
<ul>
<li><p>시행일: 2026년 10월 16일</p>
</li>
</ul>$body$,
  '2.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  version = EXCLUDED.version,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();

-- privacy / en
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'privacy', 'en',
  $title$QR Scanner Privacy Policy$title$,
  $body$<p>Cubion (큐비온, "we", "us") processes and protects the personal information of people who use the QR Scanner app for Android and iOS (the "App") and the scanview.app real-time scan viewer (together with the App, the "Service") in accordance with the Personal Information Protection Act of Korea and other applicable laws. This policy describes App version 1.3.0 and takes effect on October 16, 2026.</p>
<h2>1. Summary</h2>
<ul>
<li><p>Most features (scanning, creating codes, managing history) work without an account. In that case your scan history, created codes, scan photos and settings are stored <strong>only on your device</strong> and are never sent to our server.</p>
</li>
<li><p>The App <strong>contains no ads and does not collect the advertising ID.</strong></p>
</li>
<li><p>Information reaches our server (scanview.app) only when you (1) sign up or sign in, or (2) turn on <strong>Realtime Server Sync</strong> yourself while signed in.</p>
</li>
<li><p>Usage analytics (Firebase Analytics) is on by default on Android and off by default on iOS. You can turn it on or off at any time under <strong>Settings → App Info &amp; Support → Usage Analytics</strong>.</p>
</li>
<li><p>You can delete your account and server data from within the App, or request deletion as described on the <a href="https://scanview.app/legal/account-deletion?lang=en" target="_blank" rel="noopener noreferrer">Account &amp; Data Deletion</a> page.</p>
</li>
</ul>
<h2>2. Information we process and how we collect it</h2>
<h3>2-1. Sign-up and sign-in (optional)</h3>
<p>An account is optional. Realtime Server Sync requires signing in.</p>
<ul>
<li><p><strong>Email sign-up:</strong> email address, password and name (nickname). Passwords are stored only as a salted scrypt hash that cannot be reversed.</p>
</li>
<li><p><strong>Sign in with Google:</strong> your Google account's email address, name, profile photo URL and unique Google account ID</p>
</li>
<li><p><strong>Sign in with Apple (iOS):</strong> the email address Apple provides (or Apple's private relay address if you choose it), your name (if shared) and unique Apple account ID</p>
</li>
<li><p><strong>Generated automatically:</strong> member ID, authentication tokens that keep you signed in, a random device identifier created by the App (used only to tell your signed-in devices apart; it is not the advertising ID or a hardware ID), sign-up date, last sign-in/activity time, and feature-unlock status</p>
</li>
</ul>
<h3>2-2. Realtime Server Sync (optional, sign-in required)</h3>
<p>Only when you turn on Settings → Realtime Server Sync, the following is sent to and stored on the scanview.app server each time you scan:</p>
<ul>
<li><p>The content (value) of the scanned code, the scan time and your member ID</p>
</li>
<li><p>Session information: session ID, session name, public/private setting, session password (if set, stored as a hash), creation and last-activity times</p>
</li>
</ul>
<p><strong>Important:</strong> new sessions are <strong>public</strong> by default. Anyone who has the session link can view its scans on the web. If you send codes containing personal or sensitive information, make the session private or set a password.</p>
<h3>2-3. Usage analytics (Firebase Analytics)</h3>
<p>To improve the App we use Google's Firebase Analytics to collect:</p>
<ul>
<li><p>The app instance ID (an identifier Firebase creates for each installation), screen views and feature events (for example, the <strong>type</strong> and format of codes you scan or create, how you save or share, settings changes and error types)</p>
</li>
<li><p>Information Firebase collects automatically: device model, operating system and version, App version, language, approximate country/region (derived from IP address), first-open and session information</p>
</li>
</ul>
<p>We never send the <strong>content</strong> of codes you scan or create, your email or your name as analytics, and we do not collect the advertising ID. Analytics is on by default on Android; on iOS nothing is collected until you turn it on. Turning off Settings → App Info &amp; Support → Usage Analytics stops collection from that point.</p>
<h3>2-4. Location (optional)</h3>
<ul>
<li><p><strong>Creating a location QR code:</strong> we ask for location permission only when you tap "current location" on the map screen, and read your device's location only while the App is in use. We never use background location. The location is used only for the map and the QR code you create, and is not sent to our server.</p>
</li>
<li><p><strong>Place search:</strong> when you search for a place on the map, the search text and the current map center coordinates (which may be your current location) are sent to Google Maps Platform (Places and Geocoding). Converting coordinates to an address uses your device's built-in location service (Google on Android, Apple on iOS).</p>
</li>
<li><p><strong>Connecting to Wi-Fi from a QR code (Android):</strong> Android requires location permission to connect to Wi-Fi networks; the App does not collect your location in this case.</p>
</li>
</ul>
<h3>2-5. Device permissions and information that stays on your device</h3>
<p>We request each permission only when you use the related feature; you can deny it and keep using everything else. The following is not sent to our server (see 2-2 for scan values when Realtime Server Sync is on).</p>
<ul>
<li><p><strong>Camera:</strong> scanning QR codes and barcodes. Camera frames are analyzed on the device. If "Save Scan Photo" is on, the photo taken at the moment of scanning is kept only in the App's private storage; you can turn this off in Settings.</p>
</li>
<li><p><strong>Photos:</strong> used only to <strong>save</strong> created QR codes or scan images to your gallery. To read a code from an image, only the photo you pick in the system photo picker is analyzed on the device; the App does not read your whole photo library.</p>
</li>
<li><p><strong>Contacts:</strong> used only when you choose to add a contact (vCard) from a QR code. The App does not read your existing contacts or send them anywhere.</p>
</li>
<li><p><strong>Calendar:</strong> used only when you choose to add an event from a QR code; the App looks up which calendars can be written to and writes the event. Event details are not sent anywhere.</p>
</li>
<li><p><strong>NFC:</strong> reading NFC tags and saving them to your scan history.</p>
</li>
<li><p><strong>Notifications:</strong> only for notifications scheduled on the device, such as lottery draw reminders.</p>
</li>
<li><p><strong>Biometrics (Face ID / fingerprint):</strong> used to unlock the App through the operating system. The App never receives or stores biometric data.</p>
</li>
<li><p><strong>Wi-Fi state:</strong> used to connect to a network from a Wi-Fi QR code.</p>
</li>
</ul>
<h3>2-6. Backup (optional)</h3>
<ul>
<li><p><strong>Google Drive backup:</strong> when you run backup or restore, the App saves a backup file (JSON) of your settings and scan history to <strong>your own</strong> Google Drive, and on restore finds and reads that backup file. Backups do not pass through our server and we cannot access them.</p>
</li>
<li><p><strong>iCloud (iOS):</strong> if you use iCloud, App data may be synced and backed up to your own iCloud. This also does not pass through our server.</p>
</li>
</ul>
<h3>2-7. Transfers you set up yourself</h3>
<ul>
<li><p><strong>Scan URL integration and product search:</strong> if you turn these on and choose an address or search site, scanned values are sent to that website and are governed by that website's privacy policy.</p>
</li>
<li><p><strong>Lottery result check:</strong> the App queries the Korean lottery operator's (dhlottery.co.kr) website with the draw number only; no personal information is sent.</p>
</li>
</ul>
<h3>2-8. Information generated while using the Service</h3>
<p>When the App or a browser connects to our server, connection records such as IP address, access time and request logs may be kept by the server environment. We use them only for security and troubleshooting.</p>
<h2>3. Why we process your information</h2>
<ul>
<li><p>Identifying members, keeping you signed in, account management and verification (including password-reset emails)</p>
</li>
<li><p>Creating Realtime Server Sync sessions and showing and managing their scans</p>
</li>
<li><p>Keeping feature-unlock status across your devices</p>
</li>
<li><p>Usage statistics, error detection and service improvement (when analytics is on)</p>
</li>
<li><p>Place search and map display for creating location QR codes</p>
</li>
<li><p>Preventing abuse, security and answering inquiries</p>
</li>
</ul>
<h2>4. How long we keep it</h2>
<ul>
<li><p><strong>Account information:</strong> kept until you delete your account. On deletion, sign-in is blocked and sign-in tokens are deleted immediately, and the remaining account information is permanently deleted within 30 days.</p>
</li>
<li><p><strong>Realtime Server Sync data (sessions and scan values):</strong> kept until you delete the session or scans. Sessions deleted on the web dashboard stay in the trash for 30 days so they can be restored, and can then be permanently deleted. When you delete your account, they are permanently deleted within 30 days.</p>
</li>
<li><p><strong>Feature-unlock records:</strong> kept until you delete your account and deleted within 30 days after that.</p>
</li>
<li><p><strong>Analytics data:</strong> deleted automatically when the retention period configured in Firebase (Google Analytics) expires.</p>
</li>
<li><p><strong>On-device data (scan history, photos, settings):</strong> stays on your device until you delete it in the App or uninstall the App. We cannot access it.</p>
</li>
<li><p>If a law requires us to keep certain information, we keep it separately and only for the period the law requires.</p>
</li>
</ul>
<h2>5. How we destroy information</h2>
<p>When the retention period ends or the purpose has been achieved, we destroy the information without delay. Information in our server database is deleted so that it cannot be recovered. We do not keep personal information on paper.</p>
<h2>6. Disclosure to third parties</h2>
<p>We do not provide your personal information to third parties. Exceptions: sessions you make public can be viewed by anyone with the link, and we may disclose information when lawfully required by investigative authorities or other legal process.</p>
<h2>7. Service providers and international transfers</h2>
<p>We use the following providers to run the Service. Data sent to them is transmitted over encrypted connections (HTTPS) while you use the App.</p>
<ul>
<li><p><strong>Google LLC (United States)</strong></p>
<ul>
<li><p>Firebase Analytics: analytics data in 2-3 / app usage analysis / deleted per the configured retention period</p>
</li>
<li><p>Google Maps Platform: place search text, map center coordinates / place search and map display / per Google's policies after processing</p>
</li>
<li><p>Sign in with Google: Google account information in 2-1 / authentication / until account deletion</p>
</li>
<li><p><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></p>
</li>
</ul>
</li>
<li><p><strong>Apple Inc. (United States, iOS)</strong></p>
<ul>
<li><p>Sign in with Apple: Apple account information in 2-1 / authentication / until account deletion</p>
</li>
<li><p><a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">Apple Privacy Policy</a></p>
</li>
</ul>
</li>
<li><p><strong>Server hosting provider:</strong> operating the scanview.app server and database (account information and Realtime Server Sync data) / until the service contract ends or you delete your account</p>
</li>
</ul>
<p>You can refuse these transfers by turning off analytics or by not using the related features (sign-in, place search). Only those features become unavailable; everything else keeps working.</p>
<h2>8. Your rights</h2>
<p>You may at any time access, correct or delete your personal information, or ask us to stop processing it.</p>
<ul>
<li><p><strong>Access and correction:</strong> in the App, go to Settings → your profile (Account Settings) to view and edit your name (nickname) and change your password.</p>
</li>
<li><p><strong>Deletion (delete account):</strong> Settings → your profile (Account Settings) → Danger Zone → Delete Account. If you cannot use the App, request deletion by email as described on the <a href="https://scanview.app/legal/account-deletion?lang=en" target="_blank" rel="noopener noreferrer">Account &amp; Data Deletion</a> page.</p>
</li>
<li><p><strong>Opting out of analytics:</strong> turn off Settings → App Info &amp; Support → Usage Analytics.</p>
</li>
<li><p><strong>Withdrawing permissions:</strong> you can turn off camera, location, photos, contacts, calendar and notification permissions in your device settings at any time.</p>
</li>
<li><p>For other requests, email us at the address below. After verifying your identity we will respond without delay (within 10 days at the latest). You may also make requests through a legal representative or an authorized agent.</p>
</li>
</ul>
<h2>9. Children</h2>
<p>The Service is not directed to children under 14 (or under 13 where that is the applicable age), and we do not knowingly collect their personal information. If we learn that such a child has created an account, we will delete the account and its information without delay.</p>
<h2>10. Security measures</h2>
<ul>
<li><p>All communication between the App and our server is encrypted with HTTPS/WSS</p>
</li>
<li><p>Account and session passwords are stored only as irreversible hashes</p>
</li>
<li><p>Sign-in information on the device is kept in the operating system's secure storage (Keychain/Keystore)</p>
</li>
<li><p>Admin functions are restricted to authorized staff and admin actions are logged</p>
</li>
</ul>
<h2>11. Cookies and similar technologies</h2>
<p>The App does not use cookies. The scanview.app website uses browser storage (localStorage) to keep you signed in and remember display settings, and a cookie to remember your language. You can clear them in your browser settings. We do not use advertising or tracking cookies.</p>
<h2>12. Privacy officer and contact</h2>
<ul>
<li><p>Operator: Cubion (큐비온)</p>
</li>
<li><p>Privacy officer: Representative of Cubion</p>
</li>
<li><p>Email: <a href="mailto:qrscanner.app.help@gmail.com" target="_blank" rel="noopener noreferrer">qrscanner.app.help@gmail.com</a></p>
</li>
</ul>
<p>If you need to report or get advice on a privacy violation, you can also contact the Korean authorities below.</p>
<ul>
<li><p>Personal Information Infringement Report Center: 118 (in Korea), privacy.kisa.or.kr</p>
</li>
<li><p>Personal Information Dispute Mediation Committee: 1833-6972, www.kopico.go.kr</p>
</li>
</ul>
<h2>13. Changes to this policy</h2>
<p>We will announce changes on this page and in the App at least 7 days before they take effect, or at least 30 days before for changes that significantly affect your rights.</p>
<ul>
<li><p>Effective date: October 16, 2026</p>
</li>
</ul>$body$,
  '2.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  version = EXCLUDED.version,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();

COMMIT;
