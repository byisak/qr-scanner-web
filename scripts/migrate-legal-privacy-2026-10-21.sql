-- 개인정보 처리방침(type = 'privacy') 갱신 — 시행일 2026-10-28 (방침 13조: 시행 7일 전 공지)
-- 바뀐 점: 링크 안전 검사(스캔한 URL → 서버 → Google Safe Browsing, 저장 안 함) 2-9 신설·위탁 목록·거부 방법,
--          사용 분석 iOS도 기본 켬(광고 ID·광고 개인화 신호 없음), 근처 기기(블루투스, PC 키보드 입력) 권한,
--          품목 관리 파일 선택(기기 안에만 저장), 구글 시트 등으로 보내기(웹훅), 처리 목적 1줄.
-- 5개 언어(ko, en, ja, zh, es) 모두. 이전 내용 백업: /Volumes/T7/dev-cache/legal/privacy-*.json (2026-10-21 공개 API)
BEGIN;
UPDATE legal_documents SET content = $body$<p>큐비온(이하 "회사")은 QR 스캐너 앱(Android·iOS, 이하 "앱")과 실시간 스캔 확인 웹 서비스 scanview.app(이하 앱과 함께 "서비스")을 이용하는 분의 개인정보를 「개인정보 보호법」 등 관련 법령에 따라 처리하고 보호합니다. 이 방침은 앱 1.3.0 버전 기준이며 2026년 10월 28일부터 시행합니다.</p>
<h2>1. 한눈에 보기</h2>
<ul>
<li><p>회원가입 없이 스캔, 코드 생성, 기록 관리 등 대부분의 기능을 쓸 수 있습니다. 이때 스캔 기록, 만든 코드, 스캔 사진, 설정은 <strong>기기 안에만</strong> 저장되고 회사 서버로 전송되지 않습니다.</p>
</li>
<li><p>앱에는 <strong>광고가 없으며 광고 ID를 수집하지 않습니다.</strong></p>
</li>
<li><p>회사 서버(scanview.app)로 정보가 가는 경우는 ① 회원가입·로그인을 할 때, ② 로그인한 상태에서 <strong>실시간 서버 전송</strong>을 직접 켰을 때, ③ <strong>링크 안전 검사</strong>가 켜져 있을 때 스캔한 웹 주소(URL)의 위험 여부를 확인할 때입니다. ③의 웹 주소는 저장하지 않습니다.</p>
</li>
<li><p>사용 분석(Firebase Analytics)은 Android와 iOS 모두 기본으로 켜져 있으며, 광고 ID 없이 수집하고 광고·추적에 쓰지 않습니다. <strong>설정 → 정보 → 사용 분석 동의</strong>에서 언제든 끄거나 켤 수 있습니다.</p>
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
<p>설정 → 업무 기능 → 실시간 PC 전송을 켠 경우에만, 스캔할 때마다 다음 정보가 scanview.app 서버로 전송·저장됩니다.</p>
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
<p>스캔하거나 만든 코드의 <strong>내용</strong>, 이메일, 이름은 분석 정보로 보내지 않으며, 광고 ID를 수집하지 않고 광고 개인화 신호도 보내지 않습니다. Android와 iOS 모두 기본으로 켜져 있으며, 설정 → 정보 → 사용 분석 동의에서 끄면 그때부터 수집을 멈춥니다.</p>
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
<li><p><strong>근처 기기(블루투스, Android):</strong> 설정 → 업무 기능 → PC 키보드 입력을 켤 때 휴대폰을 PC의 블루투스 키보드로 연결하는 데 사용합니다. 스캔 값은 연결된 PC에 키 입력으로만 전달되며 회사 서버로 보내지 않습니다.</p>
</li>
<li><p><strong>파일 선택:</strong> 설정 → 업무 기능 → 품목 관리에서 사용자가 고른 엑셀·CSV 파일만 읽습니다. 불러온 품목 정보(코드·품명·규격·위치 등)는 기기 안에만 저장됩니다.</p>
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
<li><p><strong>구글 시트 등으로 보내기:</strong> 실시간 세션의 소유자가 웹 대시보드에서 받을 주소(예: 구글 시트의 Apps Script 웹 앱)를 지정하면, 그 세션에 들어오는 스캔 값, 스캔 시각, 세션 이름, 스캔한 사람의 이름이 회사 서버에서 그 주소로 전송됩니다. 전송된 정보는 받는 서비스의 개인정보 처리방침을 따르며, 같은 화면에서 언제든 끌 수 있습니다.</p>
</li>
</ul>
<h3>2-8. 서비스 이용 중 자동으로 생성되는 정보</h3>
<p>서버에 접속하는 과정에서 IP 주소, 접속 일시, 요청 기록 등 접속 기록이 서버 운영 환경에 남을 수 있습니다. 이 정보는 보안과 장애 대응에만 사용합니다.</p>
<h3>2-9. 링크 안전 검사 (기본 켬)</h3>
<p>스캔한 코드가 웹 주소(URL)이면, 사용자가 열기 전에 피싱·악성코드 사이트인지 확인하기 위해 다음과 같이 처리합니다.</p>
<ul>
<li><p>전송 정보: 스캔한 웹 주소. 회사 서버(scanview.app)를 거쳐 Google Safe Browsing(위험 사이트 목록)에 조회하며, 회원 정보나 기기 식별자는 함께 보내지 않습니다.</p>
</li>
<li><p>보관: 웹 주소는 저장하지 않습니다. 같은 주소를 반복 조회하지 않도록 검사 결과만 서버 메모리에 최대 30분 두며, 과도한 요청을 막기 위해 IP 주소별 요청 횟수를 10분 동안 기록합니다.</p>
</li>
<li><p>끄는 방법: 설정 → 스캔 → 링크 안전 검사를 끄면 웹 주소를 보내지 않습니다.</p>
</li>
</ul>
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
<li><p>스캔한 웹 주소가 피싱·악성코드 사이트인지 확인(링크 안전 검사)</p>
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
<li><p>Google Safe Browsing: 2-9의 웹 주소 / 위험 사이트 확인 / 요청 처리 후 Google 정책에 따름</p>
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
<li><p><strong>Vercel Inc. (미국, 서버는 서울 리전에서 실행)</strong>: scanview.app 웹 서비스와 API 서버 운영 / 회원 정보와 실시간 전송 데이터의 처리(저장은 아래 Supabase) / 위탁 계약 종료 시까지</p>
</li>
<li><p><strong>Supabase Inc. (미국, 데이터베이스는 서울 리전에 저장)</strong>: 회원 정보, 실시간 전송 데이터(세션·스캔 값) 보관과 실시간 알림 전달 / 회원 탈퇴 후 30일 이내 삭제 또는 위탁 계약 종료 시까지</p>
</li>
<li><p><strong>Resend Inc. (미국)</strong>: 비밀번호 재설정 메일 발송(받는 사람 이메일 주소, 이름, 재설정 링크) / 발송 기록은 Resend 정책에 따른 기간 동안 보관</p>
</li>
<li><p><strong>Cloudflare, Inc. (미국)</strong>: scanview.app 도메인 이름 관리와 문의 메일(support@scanview.app) 전달 / 전달 후 보관하지 않음</p>
</li>
</ul>
<p>이용자는 사용 분석이나 링크 안전 검사를 끄거나 해당 기능(로그인, 장소 검색)을 쓰지 않는 방법으로 국외 이전을 거부할 수 있습니다. 이 경우 해당 기능만 쓸 수 없고 나머지 기능은 그대로 쓸 수 있습니다.</p>
<h2>8. 이용자의 권리와 행사 방법</h2>
<p>이용자는 언제든지 자신의 개인정보를 열람·정정·삭제하거나 처리 정지를 요구할 수 있습니다.</p>
<ul>
<li><p><strong>열람·정정:</strong> 앱의 설정 → 프로필(계정 설정)에서 이름(닉네임)을 확인·수정하고 비밀번호를 바꿀 수 있습니다.</p>
</li>
<li><p><strong>삭제(회원 탈퇴):</strong> 설정 → 프로필(계정 설정) → 위험 영역 → 회원탈퇴. 앱을 쓸 수 없으면 <a href="https://scanview.app/legal/account-deletion" target="_blank" rel="noopener noreferrer">계정 및 데이터 삭제 안내</a>에 따라 이메일로 요청할 수 있습니다.</p>
</li>
<li><p><strong>사용 분석 거부:</strong> 설정 → 정보 → 사용 분석 동의를 끕니다.</p>
</li>
<li><p><strong>링크 안전 검사 끄기:</strong> 설정 → 스캔 → 링크 안전 검사를 끕니다.</p>
</li>
<li><p><strong>권한 철회:</strong> 기기 설정에서 카메라·위치·사진·연락처·캘린더·알림·근처 기기 권한을 언제든 끌 수 있습니다.</p>
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
<li><p>이메일: <a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
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
<li><p>시행일: 2026년 10월 28일</p>
</li>
</ul>$body$, version = '2.1', updated_at = NOW(), published_at = NOW()
WHERE type = 'privacy' AND locale = 'ko';
UPDATE legal_documents SET content = $body$<p>Cubion (큐비온, "we", "us") processes and protects the personal information of people who use the QR Scanner app for Android and iOS (the "App") and the scanview.app real-time scan viewer (together with the App, the "Service") in accordance with the Personal Information Protection Act of Korea and other applicable laws. This policy describes App version 1.3.0 and takes effect on October 28, 2026.</p>
<h2>1. Summary</h2>
<ul>
<li><p>Most features (scanning, creating codes, managing history) work without an account. In that case your scan history, created codes, scan photos and settings are stored <strong>only on your device</strong> and are never sent to our server.</p>
</li>
<li><p>The App <strong>contains no ads and does not collect the advertising ID.</strong></p>
</li>
<li><p>Information reaches our server (scanview.app) only when you (1) sign up or sign in, (2) turn on <strong>Realtime Server Sync</strong> yourself while signed in, or (3) the <strong>link safety check</strong> is on and a scanned web address (URL) is checked for danger. Addresses in case (3) are not stored.</p>
</li>
<li><p>Usage analytics (Firebase Analytics) is on by default on both Android and iOS. It is collected without the advertising ID and is not used for advertising or tracking. You can turn it on or off at any time under <strong>Settings → About → Usage Analytics</strong>.</p>
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
<p>Only when you turn on Settings → Work tools → Live PC sync, the following is sent to and stored on the scanview.app server each time you scan:</p>
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
<p>We never send the <strong>content</strong> of codes you scan or create, your email or your name as analytics. We do not collect the advertising ID and do not send ad personalization signals. Analytics is on by default on both Android and iOS; turning off Settings → About → Usage Analytics stops collection from that point.</p>
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
<li><p><strong>Nearby devices (Bluetooth, Android):</strong> used when you turn on Settings → Work tools → PC keyboard input, to connect your phone to a PC as a Bluetooth keyboard. Scanned values are sent only to the connected PC as keystrokes and never to our server.</p>
</li>
<li><p><strong>File selection:</strong> in Settings → Work tools → Items, we read only the Excel or CSV file you pick. Imported item information (codes, names, specs, locations, etc.) is stored only on your device.</p>
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
<li><p><strong>Send to Google Sheets and similar:</strong> if the owner of a realtime session sets a receiving address on the web dashboard (for example a Google Sheets Apps Script web app), our server sends each scan in that session to that address: the scanned value, scan time, session name and the scanner's name. That information is then handled under the receiving service's privacy policy. You can turn this off at any time on the same screen.</p>
</li>
</ul>
<h3>2-8. Information generated while using the Service</h3>
<p>When the App or a browser connects to our server, connection records such as IP address, access time and request logs may be kept by the server environment. We use them only for security and troubleshooting.</p>
<h3>2-9. Link safety check (on by default)</h3>
<p>When a scanned code is a web address (URL), we check whether it is a phishing or malware site before you open it, as follows.</p>
<ul>
<li><p>What is sent: the scanned web address. It is looked up in Google Safe Browsing (Google’s list of unsafe sites) through our server (scanview.app). No account information or device identifier is sent with it.</p>
</li>
<li><p>Retention: the web address is not stored. Only the check result is kept in server memory for up to 30 minutes to avoid repeated lookups, and request counts per IP address are kept for 10 minutes to prevent abuse.</p>
</li>
<li><p>How to turn it off: turn off Settings → Scanning → Link safety check and no web addresses are sent.</p>
</li>
</ul>
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
<li><p>Checking whether scanned web addresses are phishing or malware sites (link safety check)</p>
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
<li><p>Google Safe Browsing: web addresses described in 2-9 / checking for unsafe sites / handled under Google’s policy after the request</p>
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
<li><p><strong>Vercel Inc. (USA; servers run in the Seoul region)</strong>: runs the scanview.app website and API server / processes account information and live sync data (stored at Supabase below) / until the service contract ends</p>
</li>
<li><p><strong>Supabase Inc. (USA; database stored in the Seoul region)</strong>: stores account information and live sync data (sessions and scan values) and delivers real-time updates / deleted within 30 days after you delete your account, or when the service contract ends</p>
</li>
<li><p><strong>Resend Inc. (USA)</strong>: sends password reset emails (recipient email address, name, reset link) / delivery logs kept for the period set by Resend</p>
</li>
<li><p><strong>Cloudflare, Inc. (USA)</strong>: manages the scanview.app domain and forwards support emails (support@scanview.app) / not stored after forwarding</p>
</li>
</ul>
<p>You can refuse these transfers by turning off analytics or the link safety check, or by not using the related features (sign-in, place search). Only those features become unavailable; everything else keeps working.</p>
<h2>8. Your rights</h2>
<p>You may at any time access, correct or delete your personal information, or ask us to stop processing it.</p>
<ul>
<li><p><strong>Access and correction:</strong> in the App, go to Settings → your profile (Account Settings) to view and edit your name (nickname) and change your password.</p>
</li>
<li><p><strong>Deletion (delete account):</strong> Settings → your profile (Account Settings) → Danger Zone → Delete Account. If you cannot use the App, request deletion by email as described on the <a href="https://scanview.app/legal/account-deletion?lang=en" target="_blank" rel="noopener noreferrer">Account &amp; Data Deletion</a> page.</p>
</li>
<li><p><strong>Opting out of analytics:</strong> turn off Settings → About → Usage Analytics.</p>
</li>
<li><p><strong>Turning off the link safety check:</strong> turn off Settings → Scanning → Link safety check.</p>
</li>
<li><p><strong>Withdrawing permissions:</strong> you can turn off camera, location, photos, contacts, calendar, notification and nearby-device permissions at any time in your device settings.</p>
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
<li><p>Email: <a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
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
<li><p>Effective date: October 28, 2026</p>
</li>
</ul>$body$, version = '2.1', updated_at = NOW(), published_at = NOW()
WHERE type = 'privacy' AND locale = 'en';
UPDATE legal_documents SET content = $body$<p>Cubion（큐비온、以下「当社」）は、QRスキャナーアプリ（Android・iOS、以下「アプリ」）およびリアルタイムスキャン確認ウェブサービスscanview.app（以下、アプリとあわせて「本サービス」）をご利用の方の個人情報を、韓国の「個人情報保護法」その他の関連法令に従って取り扱い、保護します。本ポリシーはアプリのバージョン1.3.0を基準としており、2026年10月28日から施行します。韓国語版と本日本語版の内容が異なる場合は、韓国語版が優先します。</p>
<h2>1. 概要</h2>
<ul>
<li><p>会員登録をしなくても、スキャン、コード作成、履歴管理などほとんどの機能をご利用いただけます。この場合、スキャン履歴、作成したコード、スキャン写真、設定は<strong>端末内にのみ</strong>保存され、当社のサーバーには送信されません。</p>
</li>
<li><p>アプリには<strong>広告がなく、広告IDを収集しません。</strong></p>
</li>
<li><p>当社のサーバー（scanview.app）に情報が送られるのは、①会員登録・ログインをするとき、②ログインした状態でご自身で<strong>リアルタイムサーバー送信</strong>をオンにしたとき、③<strong>リンクの安全チェック</strong>がオンのときにスキャンしたウェブアドレス（URL）の危険性を確認するときに限られます。③のウェブアドレスは保存しません。</p>
</li>
<li><p>使用分析（Firebase Analytics）は、AndroidとiOSのどちらも初期設定でオンになっています。広告IDを使わずに収集し、広告やトラッキングには使用しません。<strong>設定 → 情報 → 使用分析の同意</strong>でいつでもオン・オフを切り替えられます。</p>
</li>
<li><p>アカウントとサーバー上のデータは、アプリからすぐに退会するか、<a href="https://scanview.app/legal/account-deletion?lang=ja" target="_blank" rel="noopener noreferrer">アカウントとデータの削除について</a>のページに記載の方法で削除を依頼できます。</p>
</li>
</ul>
<h2>2. 取り扱う個人情報の項目と収集方法</h2>
<h3>2-1. 会員登録・ログイン（任意）</h3>
<p>会員登録は任意ですが、リアルタイムサーバー送信機能を使うにはログインが必要です。</p>
<ul>
<li><p><strong>メールアドレスでの登録：</strong>メールアドレス、パスワード、名前（ニックネーム）。パスワードは復元できない方式（ソルトを加えたscryptハッシュ）でのみ保存します。</p>
</li>
<li><p><strong>Googleでログイン：</strong>Googleアカウントのメールアドレス、名前、プロフィール写真のURL、Googleアカウントの固有識別子</p>
</li>
<li><p><strong>Appleでサインイン（iOS）：</strong>Appleから提供されるメールアドレス（利用者が選択した場合はAppleのプライベートリレーアドレス）、名前（提供された場合）、Appleアカウントの固有識別子</p>
</li>
<li><p><strong>自動生成される情報：</strong>会員番号、ログイン維持用の認証トークン、アプリが作成するランダムな端末識別子（ログイン端末の区別用で、広告IDやハードウェア識別子ではありません）、登録日、最終ログイン・アクセス日時、機能のロック解除状態の記録</p>
</li>
</ul>
<h3>2-2. リアルタイムサーバー送信（任意、ログインが必要）</h3>
<p>設定 → 業務機能 → リアルタイムPC送信をオンにした場合に限り、スキャンするたびに次の情報がscanview.appのサーバーに送信・保存されます。</p>
<ul>
<li><p>スキャンしたコードの内容（値）、スキャン日時、会員番号</p>
</li>
<li><p>セッション情報：セッションID、セッション名、公開設定、セッションのパスワード（設定した場合、ハッシュで保存）、作成日時・最終アクティビティ日時</p>
</li>
</ul>
<p><strong>ご注意：</strong>新しいセッションは初期設定で<strong>公開</strong>です。公開セッションは、セッションのアドレス（リンク）を知っている人なら誰でもウェブでスキャン内容を閲覧できます。個人情報や機密性の高い内容を含むコードを送信する場合は、セッションを非公開に変更するか、パスワードを設定してください。</p>
<h3>2-3. 使用分析（Firebase Analytics）</h3>
<p>アプリの改善のため、GoogleのFirebase Analyticsを使って次の情報を収集します。</p>
<ul>
<li><p>アプリインスタンスID（アプリのインストールごとにFirebaseが作成する識別子）、画面の表示、機能の利用イベント（例：スキャン・作成したコードの<strong>種類</strong>と形式、保存・共有の方法、設定の変更、エラーの種類）</p>
</li>
<li><p>Firebaseが自動的に収集する端末のモデル、OSとそのバージョン、アプリのバージョン、言語、おおよその国・地域（IPアドレスに基づく）、初回起動・セッション情報</p>
</li>
</ul>
<p>スキャンまたは作成したコードの<strong>内容</strong>、メールアドレス、名前は分析情報として送信せず、広告IDの収集や広告のパーソナライズ用の信号の送信も行いません。AndroidとiOSのどちらも初期設定でオンになっており、設定 → 情報 → 使用分析の同意でオフにすると、その時点から収集を停止します。</p>
<h3>2-4. 位置情報（任意）</h3>
<ul>
<li><p><strong>位置情報QRコードの作成：</strong>地図画面で「現在地」をタップしたときにのみ位置情報の権限を求め、アプリの画面を表示している間にのみ端末の現在地を確認します。バックグラウンドでの位置情報は使用しません。この位置情報は地図と利用者が作成するQRコードにのみ使用し、当社のサーバーには送信しません。</p>
</li>
<li><p><strong>場所の検索：</strong>地図で場所を検索すると、検索語と現在の地図の中心座標（現在地である場合があります）がGoogle Maps Platform（Places・Geocoding）に送信されます。座標を住所に変換する機能には、端末標準の位置情報サービス（AndroidはGoogle、iOSはApple）を利用します。</p>
</li>
<li><p><strong>Wi-Fi QRで接続（Android）：</strong>AndroidではWi-Fi接続に位置情報の権限が必要なためリクエストしますが、アプリはこの際に位置情報を収集しません。</p>
</li>
</ul>
<h3>2-5. 端末の権限と端末内でのみ処理する情報</h3>
<p>次の権限は該当する機能を使うときにのみリクエストし、拒否しても他の機能はご利用いただけます。以下の情報は当社のサーバーには送信しません（リアルタイムサーバー送信をオンにした場合のスキャン値については2-2をご覧ください）。</p>
<ul>
<li><p><strong>カメラ：</strong>QRコード・バーコードのスキャン。カメラの映像は端末上でその場で解析します。「スキャン写真を保存」の設定がオンの場合は、スキャンした瞬間の写真をアプリ内部のストレージにのみ保管します。この設定は設定画面でオフにできます。</p>
</li>
<li><p><strong>写真：</strong>作成したQRコードやスキャン画像をギャラリーに<strong>保存</strong>するときにのみ使用します。画像からコードを読み取る際は、システムの写真選択画面で利用者が選んだ写真のみを端末上で解析し、フォトライブラリ全体は読み取りません。</p>
</li>
<li><p><strong>連絡先：</strong>連絡先（vCard）QRを利用者が選択して連絡先に追加するときにのみ使用します。既存の連絡先を読み取ったり、外部に送信したりすることはありません。</p>
</li>
<li><p><strong>カレンダー：</strong>予定のQRを利用者が選択してカレンダーに追加するときに、追加可能なカレンダーの一覧を確認し、予定を書き込みます。予定の内容を外部に送信することはありません。</p>
</li>
<li><p><strong>NFC：</strong>NFCタグを読み取り、スキャン履歴に保存します。</p>
</li>
<li><p><strong>通知：</strong>宝くじの抽選日のお知らせなど、端末上で予約する通知にのみ使用します。</p>
</li>
<li><p><strong>生体認証（Face ID・指紋）：</strong>アプリのロック解除にOSの機能を利用します。アプリが生体情報を受け取ったり保存したりすることはありません。</p>
</li>
<li><p><strong>Wi-Fiの状態の確認・変更：</strong>Wi-Fi QRでネットワークに接続するときに使用します。</p>
</li>
<li><p><strong>付近のデバイス（Bluetooth、Android）：</strong>設定 → 業務機能 → PCキーボード入力をオンにするとき、スマートフォンをPCのBluetoothキーボードとして接続するために使用します。スキャン値は接続したPCにキー入力として送られるだけで、当社のサーバーには送信しません。</p>
</li>
<li><p><strong>ファイルの選択：</strong>設定 → 業務機能 → 品目管理で、利用者が選んだExcel・CSVファイルのみを読み込みます。読み込んだ品目情報（コード・品名・規格・場所など）は端末内にのみ保存されます。</p>
</li>
</ul>
<h3>2-6. バックアップ（任意）</h3>
<ul>
<li><p><strong>Googleドライブへのバックアップ：</strong>利用者がバックアップ・復元を実行すると、利用者ご本人のGoogleドライブに設定とスキャン履歴のバックアップファイル（JSON）を保存し、復元時にはそのバックアップファイルを探して読み込みます。バックアップファイルは当社のサーバーを経由せず、当社がその内容にアクセスすることはありません。</p>
</li>
<li><p><strong>iCloud（iOS）：</strong>iCloudをご利用の場合、アプリのデータが利用者ご本人のiCloudに同期・バックアップされることがあります。これも当社のサーバーを経由しません。</p>
</li>
</ul>
<h3>2-7. 利用者がご自身で設定した外部への送信</h3>
<ul>
<li><p><strong>スキャンURL連携・商品検索：</strong>利用者がこの機能をオンにしてアドレスや検索サイトを指定すると、スキャンしたコードの値がそのウェブサイトに送られます。送られた情報は、そのウェブサイトのプライバシーポリシーに従って取り扱われます。</p>
</li>
<li><p><strong>宝くじの当選確認：</strong>韓国の宝くじ運営事業者（dhlottery.co.kr）のウェブサイトに回号のみを照会し、個人情報は送信しません。</p>
</li>
<li><p><strong>Googleスプレッドシートなどへの送信：</strong>リアルタイムセッションの所有者がウェブダッシュボードで受信先のアドレス（例：GoogleスプレッドシートのApps Scriptウェブアプリ）を指定すると、そのセッションに届くスキャン値、スキャン日時、セッション名、スキャンした人の名前が当社のサーバーからそのアドレスへ送信されます。送信された情報は受信先サービスのプライバシーポリシーに従って取り扱われます。同じ画面でいつでもオフにできます。</p>
</li>
</ul>
<h3>2-8. サービスの利用中に自動的に生成される情報</h3>
<p>サーバーに接続する過程で、IPアドレス、アクセス日時、リクエスト記録などのアクセスログがサーバーの運用環境に残ることがあります。この情報はセキュリティと障害対応にのみ使用します。</p>
<h3>2-9. リンクの安全チェック（初期設定でオン）</h3>
<p>スキャンしたコードがウェブアドレス（URL）の場合、開く前にフィッシングやマルウェアのサイトでないかを確認するため、次のとおり取り扱います。</p>
<ul>
<li><p>送信する情報：スキャンしたウェブアドレス。当社のサーバー（scanview.app）を経由してGoogleセーフ ブラウジング（危険なサイトのリスト）に照会します。会員情報や端末の識別子は送信しません。</p>
</li>
<li><p>保管：ウェブアドレスは保存しません。同じアドレスの繰り返し照会を避けるため確認結果のみをサーバーのメモリに最大30分保持し、過剰なリクエストを防ぐためIPアドレスごとのリクエスト回数を10分間記録します。</p>
</li>
<li><p>オフにする方法：設定 → スキャン → リンクの安全チェックをオフにすると、ウェブアドレスは送信されません。</p>
</li>
</ul>
<h2>3. 個人情報の利用目的</h2>
<ul>
<li><p>会員の識別、ログイン状態の維持、アカウント管理と本人確認（パスワード再設定メールの送信を含む）</p>
</li>
<li><p>リアルタイムサーバー送信のセッション作成と、スキャンデータの表示・管理</p>
</li>
<li><p>機能のロック解除状態を端末間で維持</p>
</li>
<li><p>アプリの利用統計の分析、エラーの把握とサービスの改善（使用分析に同意した場合）</p>
</li>
<li><p>位置情報QRコードを作成するための場所の検索と地図の表示</p>
</li>
<li><p>不正利用の防止、セキュリティ、お問い合わせへの対応</p>
</li>
<li><p>スキャンしたウェブアドレスがフィッシング・マルウェアのサイトかどうかの確認（リンクの安全チェック）</p>
</li>
</ul>
<h2>4. 保有および利用期間</h2>
<ul>
<li><p><strong>会員情報：</strong>退会するまで保有します。退会するとすぐにログインが遮断され、ログイントークンが削除されます。残りのアカウント情報は退会日から30日以内に完全に削除します。</p>
</li>
<li><p><strong>リアルタイムサーバー送信のデータ（セッション・スキャン値）：</strong>利用者がセッションやスキャンを削除するまで保有します。ウェブダッシュボードで削除したセッションはゴミ箱に30日間保管され、その間は復元でき、その後は完全に削除できます。退会した場合は、退会日から30日以内にあわせて完全に削除します。</p>
</li>
<li><p><strong>機能のロック解除の記録：</strong>退会するまで保有し、退会日から30日以内に削除します。</p>
</li>
<li><p><strong>使用分析情報：</strong>Firebase（Googleアナリティクス）に設定された保存期間が過ぎると自動的に削除されます。</p>
</li>
<li><p><strong>端末内の情報（スキャン履歴・写真・設定）：</strong>利用者がアプリで削除するか、アプリをアンインストールするまで端末に残ります。当社はこの情報にアクセスできません。</p>
</li>
<li><p>関係法令に基づき保存が必要な情報がある場合は、その法令が定める期間に限り、分離して保管します。</p>
</li>
</ul>
<h2>5. 個人情報の廃棄手続きと方法</h2>
<p>保有期間が終了した、または利用目的を達成した個人情報は、遅滞なく廃棄します。サーバーのデータベースに保存された情報は復元できないように削除します。紙の文書として出力した個人情報はありません。</p>
<h2>6. 個人情報の第三者提供</h2>
<p>当社は、利用者の個人情報を第三者に提供しません。ただし、利用者がご自身で公開に設定したリアルタイムセッションはリンクを知っている人が閲覧でき、また法令に基づき捜査機関などが適法な手続きにより要求する場合は例外とします。</p>
<h2>7. 個人情報の処理の委託と国外移転</h2>
<p>当社は、本サービスの提供のために次の事業者のサービスを利用しています。以下の事業者に情報が送信される際は、アプリの利用中に暗号化されたネットワーク（HTTPS）で送信されます。</p>
<ul>
<li><p><strong>Google LLC（米国）</strong></p>
<ul>
<li><p>Firebase Analytics：2-3の使用分析情報 / アプリの利用分析 / 保存期間の設定に従って削除</p>
</li>
<li><p>Google Maps Platform：場所の検索語、地図の中心座標 / 場所の検索と地図の表示 / リクエスト処理後はGoogleのポリシーに従う</p>
</li>
<li><p>Googleでログイン：2-1のGoogleアカウント情報 / ログイン認証 / 退会するまで</p>
</li>
<li><p>Googleセーフ ブラウジング：2-9のウェブアドレス／危険なサイトの確認／リクエスト処理後はGoogleのポリシーに従う</p>
</li>
<li><p>お問い合わせ先：<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google プライバシーポリシー</a></p>
</li>
</ul>
</li>
<li><p><strong>Apple Inc.（米国、iOS）</strong></p>
<ul>
<li><p>Appleでサインイン：2-1のAppleアカウント情報 / ログイン認証 / 退会するまで</p>
</li>
<li><p>お問い合わせ先：<a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">Apple プライバシーポリシー</a></p>
</li>
</ul>
</li>
<li><p><strong>Vercel Inc.（米国、サーバーはソウルリージョンで稼働）</strong>：scanview.appウェブサービスとAPIサーバーの運用 / 会員情報とリアルタイム送信データの処理（保存は下記のSupabase） / 委託契約の終了まで</p>
</li>
<li><p><strong>Supabase Inc.（米国、データベースはソウルリージョンに保存）</strong>：会員情報、リアルタイム送信データ（セッション・スキャン値）の保管とリアルタイム通知の配信 / 退会後30日以内に削除、または委託契約の終了まで</p>
</li>
<li><p><strong>Resend Inc.（米国）</strong>：パスワード再設定メールの送信（受信者のメールアドレス、名前、再設定リンク） / 送信記録はResendのポリシーに定める期間保管</p>
</li>
<li><p><strong>Cloudflare, Inc.（米国）</strong>：scanview.appのドメイン名の管理とお問い合わせメール（support@scanview.app）の転送 / 転送後は保管しない</p>
</li>
</ul>
<p>利用者は、使用分析やリンクの安全チェックをオフにするか、該当する機能（ログイン、場所の検索）を使わないことで、国外移転を拒否できます。この場合、該当する機能のみ利用できなくなり、その他の機能はそのままご利用いただけます。</p>
<h2>8. 利用者の権利と行使方法</h2>
<p>利用者はいつでも、ご自身の個人情報の閲覧・訂正・削除、または処理の停止を求めることができます。</p>
<ul>
<li><p><strong>閲覧・訂正：</strong>アプリの設定 → プロフィール（アカウント設定）で、名前（ニックネーム）の確認・変更とパスワードの変更ができます。</p>
</li>
<li><p><strong>削除（退会）：</strong>設定 → プロフィール（アカウント設定）→ 危険な操作 → 退会。アプリを使用できない場合は、<a href="https://scanview.app/legal/account-deletion?lang=ja" target="_blank" rel="noopener noreferrer">アカウントとデータの削除について</a>の案内に従ってメールで依頼できます。</p>
</li>
<li><p><strong>使用分析の拒否：</strong>設定 → 情報 → 使用分析の同意をオフにします。</p>
</li>
<li><p><strong>リンクの安全チェックをオフにする：</strong>設定 → スキャン → リンクの安全チェックをオフにします。</p>
</li>
<li><p><strong>権限の撤回：</strong>端末の設定で、カメラ・位置情報・写真・連絡先・カレンダー・通知・付近のデバイスの権限をいつでもオフにできます。</p>
</li>
<li><p>その他のご要望は下記のメールアドレスまでお送りください。本人確認のうえ、遅滞なく（遅くとも10日以内に）対応結果をお知らせします。法定代理人や委任を受けた方を通じてご依頼いただくこともできます。</p>
</li>
</ul>
<h2>9. 14歳未満の児童</h2>
<p>本サービスは14歳未満の児童を対象としておらず、14歳未満の児童の個人情報を故意に収集することはありません。14歳未満の児童が会員登録したことが判明した場合は、そのアカウントと情報を遅滞なく削除します。</p>
<h2>10. 個人情報の安全確保のための措置</h2>
<ul>
<li><p>アプリとサーバー間のすべての通信をHTTPS・WSSで暗号化</p>
</li>
<li><p>パスワードとセッションのパスワードは、復元できないハッシュでのみ保存</p>
</li>
<li><p>端末に保存するログイン情報は、OSのセキュアストレージ（Keychain・Keystore）に保管</p>
</li>
<li><p>管理者機能は権限のある担当者のみが使用できるよう制限し、管理者の作業記録を残す</p>
</li>
</ul>
<h2>11. 個人情報の自動収集装置</h2>
<p>アプリはCookieを使用しません。scanview.appウェブサイトでは、ログイン状態の維持と画面設定の保存のためにブラウザのストレージ（localStorage）を、言語設定の維持のためにCookieを使用しており、これらはブラウザの設定で削除できます。広告・トラッキング目的のCookieは使用しません。</p>
<h2>12. 個人情報保護責任者とお問い合わせ先</h2>
<ul>
<li><p>運営者：Cubion（큐비온）</p>
</li>
<li><p>個人情報保護責任者：Cubion 代表者</p>
</li>
<li><p>メールアドレス：<a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<p>個人情報の侵害に関する申告や相談が必要な場合は、以下の韓国の機関にお問い合わせいただけます。</p>
<ul>
<li><p>個人情報侵害申告センター：（韓国国内、局番なし）118、privacy.kisa.or.kr</p>
</li>
<li><p>個人情報紛争調停委員会：1833-6972、www.kopico.go.kr</p>
</li>
<li><p>大検察庁 サイバー捜査課：（韓国国内、局番なし）1301、www.spo.go.kr</p>
</li>
<li><p>警察庁 サイバー捜査局：（韓国国内、局番なし）182、ecrm.police.go.kr</p>
</li>
</ul>
<h2>13. ポリシーの変更</h2>
<p>本ポリシーの内容が変更される場合は、施行の7日前からこのページとアプリでお知らせします。利用者の権利に関わる重要な変更がある場合は、施行の30日前からお知らせします。</p>
<ul>
<li><p>施行日：2026年10月28日</p>
</li>
</ul>$body$, version = '2.1', updated_at = NOW(), published_at = NOW()
WHERE type = 'privacy' AND locale = 'ja';
UPDATE legal_documents SET content = $body$<p>Cubion（큐비온，以下简称"公司"）依照韩国《个人信息保护法》等相关法律法规，处理并保护 QR扫描器应用（Android、iOS，以下简称"应用"）及实时扫描查看网络服务 scanview.app（以下与应用合称"本服务"）用户的个人信息。本政策以应用1.3.0版本为准，自2026年10月28日起施行。韩文版与本中文版内容不一致时，以韩文版为准。</p>
<h2>1. 概要</h2>
<ul>
<li><p>无需注册会员即可使用扫描、生成代码、管理记录等大部分功能。此时，扫描记录、生成的代码、扫描照片和设置<strong>仅保存在设备中</strong>，不会传输到公司服务器。</p>
</li>
<li><p>应用<strong>不含广告，也不收集广告标识符。</strong></p>
</li>
<li><p>信息仅在以下情况下传输到公司服务器（scanview.app）：① 注册会员或登录时；② 在登录状态下由您本人开启<strong>实时服务器传输</strong>时；③ <strong>链接安全检查</strong>开启时，检查所扫描网址（URL）是否危险时。③ 中的网址不会被保存。</p>
</li>
<li><p>使用分析（Firebase Analytics）在 Android 和 iOS 上均默认开启，收集时不使用广告标识符，也不用于广告或跟踪。您可以随时在<strong>设置 → 关于 → 使用分析同意</strong>中关闭或开启。</p>
</li>
<li><p>您可以在应用中直接注销账户，或按照<a href="https://scanview.app/legal/account-deletion?lang=zh" target="_blank" rel="noopener noreferrer">账户与数据删除说明</a>页面中的方法申请删除账户和服务器数据。</p>
</li>
</ul>
<h2>2. 处理的个人信息项目及收集方式</h2>
<h3>2-1. 会员注册与登录（可选）</h3>
<p>会员注册为可选项，但使用实时服务器传输功能需要登录。</p>
<ul>
<li><p><strong>电子邮件注册：</strong>电子邮件地址、密码、姓名（昵称）。密码仅以不可还原的方式（加盐的 scrypt 哈希）保存。</p>
</li>
<li><p><strong>Google 登录：</strong>Google 账户的电子邮件地址、姓名、头像地址、Google 账户唯一标识符</p>
</li>
<li><p><strong>通过 Apple 登录（iOS）：</strong>Apple 提供的电子邮件地址（用户选择时为 Apple 的隐藏中转地址）、姓名（如提供）、Apple 账户唯一标识符</p>
</li>
<li><p><strong>自动生成的信息：</strong>会员编号、用于保持登录状态的认证令牌、应用生成的随机设备标识符（用于区分登录设备，并非广告标识符或硬件标识符）、注册日期、最近登录与访问时间、功能解锁状态记录</p>
</li>
</ul>
<h3>2-2. 实时服务器传输（可选，需要登录）</h3>
<p>仅在开启 设置 → 业务功能 → 实时发送到电脑 的情况下，每次扫描时以下信息才会传输并保存到 scanview.app 服务器。</p>
<ul>
<li><p>所扫描代码的内容（值）、扫描时间、会员编号</p>
</li>
<li><p>会话信息：会话 ID、会话名称、是否公开、会话密码（如已设置，以哈希形式保存）、创建时间和最近活动时间</p>
</li>
</ul>
<p><strong>注意：</strong>新会话默认为<strong>公开</strong>。任何知道会话地址（链接）的人都可以在网页上查看公开会话的扫描内容。发送含有个人信息或敏感内容的代码时，请将会话改为非公开或设置密码。</p>
<h3>2-3. 使用分析（Firebase Analytics）</h3>
<p>为改进应用，公司通过 Google 的 Firebase Analytics 收集以下信息。</p>
<ul>
<li><p>应用实例 ID（Firebase 为每次应用安装生成的标识符）、页面浏览、功能使用事件（例如：所扫描或生成代码的<strong>类型</strong>和格式、保存与分享方式、设置更改、错误类型）</p>
</li>
<li><p>Firebase 自动收集的设备型号、操作系统及版本、应用版本、语言、大致国家/地区（基于 IP 地址）、首次启动与会话信息</p>
</li>
</ul>
<p>所扫描或生成代码的<strong>内容</strong>、电子邮件和姓名不会作为分析信息发送；不收集广告标识符，也不发送广告个性化信号。在 Android 和 iOS 上均默认开启，在 设置 → 关于 → 使用分析同意 中关闭后，即从此时起停止收集。</p>
<h3>2-4. 位置（可选）</h3>
<ul>
<li><p><strong>生成位置二维码：</strong>仅在地图页面点击"当前位置"时请求位置权限，并且仅在应用界面处于显示状态时获取设备的当前位置。不使用后台位置。该位置仅用于地图和用户生成的二维码，不会发送到公司服务器。</p>
</li>
<li><p><strong>地点搜索：</strong>在地图上搜索地点时，搜索词和当前地图中心坐标（可能是当前位置）会发送到 Google Maps Platform（Places、Geocoding）。将坐标转换为地址的功能使用设备自带的位置服务（Android 为 Google，iOS 为 Apple）。</p>
</li>
<li><p><strong>通过 Wi-Fi 二维码连接（Android）：</strong>由于 Android 要求连接 Wi-Fi 时具有位置权限，因此会请求该权限，但应用此时不收集位置信息。</p>
</li>
</ul>
<h3>2-5. 设备权限及仅在设备内处理的信息</h3>
<p>以下权限仅在使用相关功能时请求，拒绝后仍可使用其他功能。以下信息不会传输到公司服务器（开启实时服务器传输时的扫描值请参阅2-2）。</p>
<ul>
<li><p><strong>相机：</strong>扫描二维码和条形码。相机画面直接在设备上分析。如开启"保存扫描照片"设置，扫描瞬间的照片仅保存在应用内部存储空间中，可在设置中关闭。</p>
</li>
<li><p><strong>照片：</strong>仅在将生成的二维码或扫描图片<strong>保存</strong>到相册时使用。从图片中识别代码时，仅在设备上分析用户通过系统照片选择器选择的照片，不读取整个照片图库。</p>
</li>
<li><p><strong>通讯录：</strong>仅在用户选择将联系人（vCard）二维码添加到通讯录时使用。不读取现有联系人，也不向外部发送。</p>
</li>
<li><p><strong>日历：</strong>在用户选择将日程二维码添加到日历时，查看可添加的日历列表并写入日程。不会将日程内容发送到外部。</p>
</li>
<li><p><strong>NFC：</strong>读取 NFC 标签并保存到扫描记录中。</p>
</li>
<li><p><strong>通知：</strong>仅用于彩票开奖日提醒等在设备上预约的通知。</p>
</li>
<li><p><strong>生物识别（Face ID、指纹）：</strong>使用操作系统功能解锁应用，应用既不接收也不保存生物识别信息。</p>
</li>
<li><p><strong>查看和更改 Wi-Fi 状态：</strong>在通过 Wi-Fi 二维码连接网络时使用。</p>
</li>
<li><p><strong>附近的设备（蓝牙，Android）：</strong>在开启 设置 → 业务功能 → PC 键盘输入 时，用于将手机作为蓝牙键盘连接到电脑。扫描值仅以按键输入的形式发送到已连接的电脑，不会发送到公司服务器。</p>
</li>
<li><p><strong>文件选择：</strong>在 设置 → 业务功能 → 商品管理 中，仅读取用户所选的 Excel、CSV 文件。导入的商品信息（条码、品名、规格、位置等）仅保存在设备中。</p>
</li>
</ul>
<h3>2-6. 备份（可选）</h3>
<ul>
<li><p><strong>Google 云端硬盘备份：</strong>用户执行备份或恢复时，将设置和扫描记录的备份文件（JSON）保存到用户本人的 Google 云端硬盘，恢复时查找并读取该备份文件。备份文件不经过公司服务器，公司也不会访问其内容。</p>
</li>
<li><p><strong>iCloud（iOS）：</strong>如您使用 iCloud，应用数据可能会同步并备份到您本人的 iCloud。这同样不经过公司服务器。</p>
</li>
</ul>
<h3>2-7. 用户自行设置的外部传输</h3>
<ul>
<li><p><strong>扫描 URL 联动与商品搜索：</strong>用户开启此功能并指定地址或搜索网站后，所扫描的代码值将发送到该网站。发送的信息适用该网站的隐私政策。</p>
</li>
<li><p><strong>彩票中奖查询：</strong>仅向韩国彩票运营机构网站（dhlottery.co.kr）查询期号，不发送个人信息。</p>
</li>
<li><p><strong>发送到 Google 表格等：</strong>实时会话的所有者在网页控制台中指定接收地址（例如 Google 表格的 Apps Script Web 应用）后，该会话收到的扫描值、扫描时间、会话名称和扫描人姓名将由公司服务器发送到该地址。发送的信息适用接收服务的隐私政策，可随时在同一界面中关闭。</p>
</li>
</ul>
<h3>2-8. 使用服务过程中自动生成的信息</h3>
<p>在连接服务器的过程中，IP 地址、访问时间、请求记录等访问日志可能会留存在服务器运行环境中。这些信息仅用于安全和故障处理。</p>
<h3>2-9. 链接安全检查（默认开启）</h3>
<p>当扫描的代码是网址（URL）时，为了在打开前确认其是否为钓鱼或恶意软件网站，按以下方式处理。</p>
<ul>
<li><p>发送的信息：所扫描的网址。经公司服务器（scanview.app）在 Google 安全浏览（危险网站列表）中查询，不会同时发送会员信息或设备标识符。</p>
</li>
<li><p>保存：不保存网址。为避免重复查询同一地址，仅将检查结果在服务器内存中保留最多 30 分钟；为防止过量请求，按 IP 地址记录请求次数 10 分钟。</p>
</li>
<li><p>关闭方法：关闭 设置 → 扫描 → 链接安全检查 后，将不再发送网址。</p>
</li>
</ul>
<h2>3. 个人信息的处理目的</h2>
<ul>
<li><p>识别会员、保持登录状态、账户管理及身份验证（包括发送密码重置邮件）</p>
</li>
<li><p>创建实时服务器传输会话以及显示和管理扫描数据</p>
</li>
<li><p>在设备之间保持功能解锁状态</p>
</li>
<li><p>分析应用使用统计、发现错误并改进服务（同意使用分析时）</p>
</li>
<li><p>为生成位置二维码而进行地点搜索和地图显示</p>
</li>
<li><p>防止不当使用、保障安全、回复咨询</p>
</li>
<li><p>检查所扫描的网址是否为钓鱼或恶意软件网站（链接安全检查）</p>
</li>
</ul>
<h2>4. 保存及使用期限</h2>
<ul>
<li><p><strong>会员信息：</strong>保存至注销账户为止。注销后立即禁止登录并删除登录令牌，其余账户信息将自注销之日起30天内永久删除。</p>
</li>
<li><p><strong>实时服务器传输数据（会话、扫描值）：</strong>保存至用户删除会话或扫描记录为止。在网页控制台中删除的会话将在回收站中保留30天，在此期间可以恢复，之后可以永久删除。注销账户时，将自注销之日起30天内一并永久删除。</p>
</li>
<li><p><strong>功能解锁记录：</strong>保存至注销账户为止，并自注销之日起30天内删除。</p>
</li>
<li><p><strong>使用分析信息：</strong>超过 Firebase（Google Analytics）中设置的保留期限后自动删除。</p>
</li>
<li><p><strong>设备内的信息（扫描记录、照片、设置）：</strong>在用户于应用中删除或卸载应用之前，一直保留在设备中。公司无法访问这些信息。</p>
</li>
<li><p>如相关法律法规要求保存某些信息，仅在该法律法规规定的期限内单独保管。</p>
</li>
</ul>
<h2>5. 个人信息的销毁程序和方法</h2>
<p>保存期限届满或处理目的已实现的个人信息，将及时销毁。保存在服务器数据库中的信息将以无法恢复的方式删除。公司不存在以纸质文件形式打印的个人信息。</p>
<h2>6. 向第三方提供个人信息</h2>
<p>公司不向第三方提供用户的个人信息。但用户自行设置为公开的实时会话可被知道链接的人查看，以及侦查机关等依照法律法规通过合法程序提出要求的情况除外。</p>
<h2>7. 个人信息处理委托及跨境转移</h2>
<p>为提供本服务，公司使用以下服务商的服务。信息在使用应用期间通过加密网络（HTTPS）传输给以下服务商。</p>
<ul>
<li><p><strong>Google LLC（美国）</strong></p>
<ul>
<li><p>Firebase Analytics：2-3所述的使用分析信息 / 应用使用分析 / 按照保留期限设置删除</p>
</li>
<li><p>Google Maps Platform：地点搜索词、地图中心坐标 / 地点搜索与地图显示 / 请求处理后依照 Google 政策</p>
</li>
<li><p>Google 登录：2-1所述的 Google 账户信息 / 登录认证 / 至注销账户为止</p>
</li>
<li><p>Google 安全浏览：2-9 中的网址 / 检查危险网站 / 请求处理后依照 Google 政策</p>
</li>
<li><p>联系方式：<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 隐私权政策</a></p>
</li>
</ul>
</li>
<li><p><strong>Apple Inc.（美国，iOS）</strong></p>
<ul>
<li><p>通过 Apple 登录：2-1所述的 Apple 账户信息 / 登录认证 / 至注销账户为止</p>
</li>
<li><p>联系方式：<a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">Apple 隐私政策</a></p>
</li>
</ul>
</li>
<li><p><strong>Vercel Inc.（美国，服务器在首尔区域运行）</strong>：运营 scanview.app 网络服务和 API 服务器 / 处理会员信息和实时传输数据（存储于下述 Supabase） / 至委托合同终止为止</p>
</li>
<li><p><strong>Supabase Inc.（美国，数据库存储于首尔区域）</strong>：保管会员信息、实时传输数据（会话、扫描值）并传递实时通知 / 注销账户后30天内删除，或至委托合同终止为止</p>
</li>
<li><p><strong>Resend Inc.（美国）</strong>：发送密码重置邮件（收件人电子邮件地址、姓名、重置链接） / 发送记录按照 Resend 政策规定的期限保管</p>
</li>
<li><p><strong>Cloudflare, Inc.（美国）</strong>：管理 scanview.app 域名并转发咨询邮件（support@scanview.app） / 转发后不予保存</p>
</li>
</ul>
<p>用户可以通过关闭使用分析或链接安全检查，或不使用相关功能（登录、地点搜索）来拒绝跨境转移。在这种情况下，仅相关功能无法使用，其他功能仍可照常使用。</p>
<h2>8. 用户的权利及行使方式</h2>
<p>用户可随时要求查阅、更正、删除本人的个人信息或停止处理。</p>
<ul>
<li><p><strong>查阅与更正：</strong>可在应用的 设置 → 个人资料（账户设置）中查看和修改姓名（昵称），以及更改密码。</p>
</li>
<li><p><strong>删除（注销账户）：</strong>设置 → 个人资料（账户设置）→ 危险区域 → 注销账户。如无法使用应用，可按照<a href="https://scanview.app/legal/account-deletion?lang=zh" target="_blank" rel="noopener noreferrer">账户与数据删除说明</a>通过电子邮件申请。</p>
</li>
<li><p><strong>拒绝使用分析：</strong>关闭 设置 → 关于 → 使用分析同意。</p>
</li>
<li><p><strong>关闭链接安全检查：</strong>关闭 设置 → 扫描 → 链接安全检查。</p>
</li>
<li><p><strong>撤回权限：</strong>可随时在设备设置中关闭相机、位置、照片、通讯录、日历、通知和附近的设备权限。</p>
</li>
<li><p>其他请求请发送至下方电子邮件地址，公司将在核实身份后及时（最迟10天内）告知处理结果。也可以通过法定代理人或受托人提出请求。</p>
</li>
</ul>
<h2>9. 未满14周岁的儿童</h2>
<p>本服务不以未满14周岁的儿童为对象，也不会在知情的情况下收集未满14周岁儿童的个人信息。如发现未满14周岁的儿童注册了会员，将及时删除该账户及相关信息。</p>
<h2>10. 个人信息安全保障措施</h2>
<ul>
<li><p>应用与服务器之间的所有通信均通过 HTTPS、WSS 加密</p>
</li>
<li><p>密码和会话密码仅以不可还原的哈希形式保存</p>
</li>
<li><p>保存在设备上的登录信息存放于操作系统的安全存储区（Keychain、Keystore）</p>
</li>
<li><p>管理员功能仅限有权限的负责人使用，并保留管理员操作记录</p>
</li>
</ul>
<h2>11. 个人信息自动收集装置</h2>
<p>应用不使用 Cookie。scanview.app 网站为保持登录状态和保存界面设置而使用浏览器存储（localStorage），为保持语言设置而使用 Cookie，您可以在浏览器设置中将其删除。公司不使用以广告或追踪为目的的 Cookie。</p>
<h2>12. 个人信息保护负责人及联系方式</h2>
<ul>
<li><p>运营方：Cubion（큐비온）</p>
</li>
<li><p>个人信息保护负责人：Cubion 代表</p>
</li>
<li><p>电子邮件：<a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<p>如需举报个人信息侵权或进行咨询，可联系以下韩国机构。</p>
<ul>
<li><p>个人信息侵权举报中心：（韩国境内，无需区号）118，privacy.kisa.or.kr</p>
</li>
<li><p>个人信息纠纷调解委员会：1833-6972，www.kopico.go.kr</p>
</li>
<li><p>大检察厅网络调查科：（韩国境内，无需区号）1301，www.spo.go.kr</p>
</li>
<li><p>警察厅网络调查局：（韩国境内，无需区号）182，ecrm.police.go.kr</p>
</li>
</ul>
<h2>13. 政策的变更</h2>
<p>本政策内容发生变更时，将自施行前7日起通过本页面和应用进行通知。如有对用户权利产生重要影响的变更，将自施行前30日起进行通知。</p>
<ul>
<li><p>施行日期：2026年10月28日</p>
</li>
</ul>$body$, version = '2.1', updated_at = NOW(), published_at = NOW()
WHERE type = 'privacy' AND locale = 'zh';
UPDATE legal_documents SET content = $body$<p>Cubion (큐비온, en adelante, la "Empresa") trata y protege la información personal de las personas que utilizan la aplicación QR Scanner (Android e iOS, en adelante, la "Aplicación") y el servicio web de visualización de escaneos en tiempo real scanview.app (junto con la Aplicación, en adelante, el "Servicio") de conformidad con la Ley de Protección de Información Personal de Corea y demás normativa aplicable. Esta política corresponde a la versión 1.3.0 de la Aplicación y entra en vigor el 28 de octubre de 2026. Si la versión en coreano y esta versión en español difieren, prevalecerá la versión en coreano.</p>
<h2>1. Resumen</h2>
<ul>
<li><p>Puede usar la mayoría de las funciones, como escanear, crear códigos y gestionar el historial, sin registrarse. En ese caso, el historial de escaneos, los códigos creados, las fotos de escaneo y la configuración se guardan <strong>solo en su dispositivo</strong> y no se envían al servidor de la Empresa.</p>
</li>
<li><p>La Aplicación <strong>no contiene anuncios ni recopila el ID de publicidad.</strong></p>
</li>
<li><p>La información solo llega al servidor de la Empresa (scanview.app) cuando ① se registra o inicia sesión, ② activa usted mismo la <strong>Sincronización en tiempo real</strong> con la sesión iniciada, o ③ la <strong>comprobación de enlaces</strong> está activada y se comprueba si una dirección web (URL) escaneada es peligrosa. Las direcciones del caso ③ no se guardan.</p>
</li>
<li><p>El análisis de uso (Firebase Analytics) está activado de forma predeterminada en Android e iOS. Se recopila sin el ID de publicidad y no se usa con fines publicitarios ni de seguimiento. Puede activarlo o desactivarlo en cualquier momento en <strong>Configuración → Información → Consentimiento de análisis</strong>.</p>
</li>
<li><p>Puede eliminar su cuenta y los datos del servidor directamente desde la Aplicación, o solicitar su eliminación siguiendo el procedimiento de la página <a href="https://scanview.app/legal/account-deletion?lang=es" target="_blank" rel="noopener noreferrer">Eliminación de cuenta y datos</a>.</p>
</li>
</ul>
<h2>2. Información personal que tratamos y cómo la recopilamos</h2>
<h3>2-1. Registro e inicio de sesión (opcional)</h3>
<p>El registro es opcional, pero para usar la función de Sincronización en tiempo real es necesario iniciar sesión.</p>
<ul>
<li><p><strong>Registro con correo electrónico:</strong> dirección de correo electrónico, contraseña y nombre (apodo). La contraseña se guarda únicamente de forma irreversible (hash scrypt con sal).</p>
</li>
<li><p><strong>Inicio de sesión con Google:</strong> la dirección de correo electrónico, el nombre, la URL de la foto de perfil y el identificador único de su cuenta de Google</p>
</li>
<li><p><strong>Iniciar sesión con Apple (iOS):</strong> la dirección de correo electrónico que proporciona Apple (o la dirección de retransmisión privada de Apple, si usted la elige), su nombre (si lo comparte) y el identificador único de su cuenta de Apple</p>
</li>
<li><p><strong>Información generada automáticamente:</strong> número de miembro, tokens de autenticación para mantener la sesión iniciada, un identificador aleatorio de dispositivo creado por la Aplicación (sirve para distinguir los dispositivos con sesión iniciada y no es el ID de publicidad ni un identificador de hardware), fecha de registro, fecha y hora del último inicio de sesión y acceso, y registro del estado de desbloqueo de funciones</p>
</li>
</ul>
<h3>2-2. Sincronización en tiempo real (opcional, requiere iniciar sesión)</h3>
<p>Solo si activa Configuración → Herramientas de trabajo → Envío en vivo al PC, cada vez que escanee se enviará y almacenará la siguiente información en el servidor de scanview.app:</p>
<ul>
<li><p>El contenido (valor) del código escaneado, la hora del escaneo y su número de miembro</p>
</li>
<li><p>Información de la sesión: ID de sesión, nombre de la sesión, si es pública o privada, contraseña de la sesión (si se ha establecido, guardada como hash) y fecha y hora de creación y de la última actividad</p>
</li>
</ul>
<p><strong>Importante:</strong> las sesiones nuevas son <strong>públicas</strong> de forma predeterminada. Cualquier persona que conozca la dirección (enlace) de una sesión pública puede ver su contenido de escaneo en la web. Si envía códigos que contienen información personal o sensible, cambie la sesión a privada o establezca una contraseña.</p>
<h3>2-3. Análisis de uso (Firebase Analytics)</h3>
<p>Para mejorar la Aplicación, recopilamos la siguiente información mediante Firebase Analytics de Google:</p>
<ul>
<li><p>El ID de instancia de la aplicación (un identificador que Firebase crea para cada instalación), las vistas de pantalla y los eventos de uso de funciones (por ejemplo, el <strong>tipo</strong> y el formato de los códigos que escanea o crea, cómo los guarda o comparte, los cambios de configuración y los tipos de error)</p>
</li>
<li><p>Información que Firebase recopila automáticamente: modelo del dispositivo, sistema operativo y su versión, versión de la Aplicación, idioma, país o región aproximados (según la dirección IP) e información de la primera apertura y de las sesiones</p>
</li>
</ul>
<p>No enviamos como datos de análisis el <strong>contenido</strong> de los códigos que escanea o crea, ni su correo electrónico ni su nombre; no recopilamos el ID de publicidad ni enviamos señales de personalización de anuncios. Está activado de forma predeterminada en Android e iOS; si lo desactiva en Configuración → Información → Consentimiento de análisis, la recopilación se detiene a partir de ese momento.</p>
<h3>2-4. Ubicación (opcional)</h3>
<ul>
<li><p><strong>Creación de códigos QR de ubicación:</strong> solo solicitamos el permiso de ubicación cuando toca "ubicación actual" en la pantalla del mapa, y consultamos la ubicación actual del dispositivo solo mientras la Aplicación está en pantalla. No utilizamos la ubicación en segundo plano. Esta ubicación se usa únicamente para el mapa y para el código QR que usted crea, y no se envía al servidor de la Empresa.</p>
</li>
<li><p><strong>Búsqueda de lugares:</strong> al buscar un lugar en el mapa, el texto de búsqueda y las coordenadas del centro actual del mapa (que pueden ser su ubicación actual) se envían a Google Maps Platform (Places y Geocoding). La conversión de coordenadas en direcciones utiliza el servicio de ubicación integrado del dispositivo (Google en Android y Apple en iOS).</p>
</li>
<li><p><strong>Conexión a Wi-Fi mediante QR (Android):</strong> se solicita el permiso de ubicación porque Android lo exige para conectarse a redes Wi-Fi; en este caso la Aplicación no recopila información de ubicación.</p>
</li>
</ul>
<h3>2-5. Permisos del dispositivo e información que se procesa solo en el dispositivo</h3>
<p>Los siguientes permisos solo se solicitan cuando utiliza la función correspondiente, y si los deniega puede seguir usando las demás funciones. La siguiente información no se envía al servidor de la Empresa (para los valores escaneados con la Sincronización en tiempo real activada, consulte el apartado 2-2).</p>
<ul>
<li><p><strong>Cámara:</strong> escaneo de códigos QR y códigos de barras. Las imágenes de la cámara se analizan directamente en el dispositivo. Si la opción "Guardar foto del escaneo" está activada, la foto del momento del escaneo se conserva únicamente en el almacenamiento interno de la Aplicación; puede desactivarla en la configuración.</p>
</li>
<li><p><strong>Fotos:</strong> solo se usa para <strong>guardar</strong> en la galería los códigos QR creados o las imágenes de escaneo. Para leer un código desde una imagen, solo se analiza en el dispositivo la foto que usted elige en el selector de fotos del sistema; la Aplicación no lee toda su biblioteca de fotos.</p>
</li>
<li><p><strong>Contactos:</strong> solo se usa cuando usted decide añadir a sus contactos un contacto (vCard) desde un código QR. La Aplicación no lee sus contactos existentes ni los envía a terceros.</p>
</li>
<li><p><strong>Calendario:</strong> cuando usted decide añadir a su calendario un evento desde un código QR, la Aplicación consulta la lista de calendarios disponibles y escribe el evento. El contenido de los eventos no se envía a terceros.</p>
</li>
<li><p><strong>NFC:</strong> lectura de etiquetas NFC y almacenamiento en el historial de escaneos.</p>
</li>
<li><p><strong>Notificaciones:</strong> solo para notificaciones programadas en el dispositivo, como los recordatorios de la fecha del sorteo de lotería.</p>
</li>
<li><p><strong>Autenticación biométrica (Face ID o huella dactilar):</strong> se utiliza la función del sistema operativo para desbloquear la Aplicación; la Aplicación no recibe ni almacena datos biométricos.</p>
</li>
<li><p><strong>Consulta y cambio del estado de Wi-Fi:</strong> se usa para conectarse a una red mediante un código QR de Wi-Fi.</p>
</li>
<li><p><strong>Dispositivos cercanos (Bluetooth, Android):</strong> se usa al activar Configuración → Herramientas de trabajo → Teclado para PC, para conectar el teléfono a un PC como teclado Bluetooth. Los valores escaneados solo se envían al PC conectado como pulsaciones de teclas y nunca a nuestro servidor.</p>
</li>
<li><p><strong>Selección de archivos:</strong> en Configuración → Herramientas de trabajo → Artículos, solo leemos el archivo de Excel o CSV que usted elija. La información de artículos importada (códigos, nombres, especificaciones, ubicaciones, etc.) se guarda únicamente en el dispositivo.</p>
</li>
</ul>
<h3>2-6. Copia de seguridad (opcional)</h3>
<ul>
<li><p><strong>Copia de seguridad en Google Drive:</strong> cuando usted realiza una copia de seguridad o una restauración, la Aplicación guarda un archivo de copia de seguridad (JSON) de la configuración y del historial de escaneos en su propio Google Drive y, al restaurar, busca y lee ese archivo. Los archivos de copia de seguridad no pasan por el servidor de la Empresa, y la Empresa no accede a su contenido.</p>
</li>
<li><p><strong>iCloud (iOS):</strong> si usa iCloud, los datos de la Aplicación pueden sincronizarse y respaldarse en su propio iCloud. Esto tampoco pasa por el servidor de la Empresa.</p>
</li>
</ul>
<h3>2-7. Envíos externos configurados por el usuario</h3>
<ul>
<li><p><strong>Integración de URL de escaneo y búsqueda de productos:</strong> si activa estas funciones e indica una dirección o un sitio de búsqueda, el valor del código escaneado se envía a ese sitio web. La información enviada se rige por la política de privacidad de dicho sitio web.</p>
</li>
<li><p><strong>Comprobación de premios de lotería:</strong> la Aplicación consulta únicamente el número de sorteo en el sitio web del operador de lotería de Corea (dhlottery.co.kr) y no envía información personal.</p>
</li>
<li><p><strong>Envío a Google Sheets y servicios similares:</strong> si la persona propietaria de una sesión en tiempo real indica en el panel web una dirección de destino (por ejemplo, una aplicación web de Apps Script de Google Sheets), nuestro servidor envía a esa dirección cada escaneo de la sesión: el valor escaneado, la hora del escaneo, el nombre de la sesión y el nombre de quien escaneó. Esa información se rige por la política de privacidad del servicio de destino. Puede desactivarlo en cualquier momento en la misma pantalla.</p>
</li>
</ul>
<h3>2-8. Información generada automáticamente durante el uso del Servicio</h3>
<p>Al conectarse al servidor, pueden quedar registros de acceso, como la dirección IP, la fecha y hora de acceso y el historial de solicitudes, en el entorno de operación del servidor. Esta información se usa únicamente para la seguridad y la resolución de incidencias.</p>
<h3>2-9. Comprobación de enlaces (activada de forma predeterminada)</h3>
<p>Cuando un código escaneado es una dirección web (URL), comprobamos si es un sitio de phishing o de malware antes de que lo abra, de la siguiente forma.</p>
<ul>
<li><p>Información enviada: la dirección web escaneada. Se consulta en Google Navegación Segura (lista de sitios no seguros de Google) a través de nuestro servidor (scanview.app). No se envían datos de cuenta ni identificadores del dispositivo.</p>
</li>
<li><p>Conservación: la dirección web no se guarda. Solo se conserva el resultado de la comprobación en la memoria del servidor durante un máximo de 30 minutos para evitar consultas repetidas, y se registra durante 10 minutos el número de solicitudes por dirección IP para evitar abusos.</p>
</li>
<li><p>Cómo desactivarla: desactive Configuración → Escaneo → Comprobación de enlaces y no se enviará ninguna dirección web.</p>
</li>
</ul>
<h2>3. Finalidades del tratamiento de la información personal</h2>
<ul>
<li><p>Identificación de miembros, mantenimiento de la sesión iniciada, gestión de la cuenta y verificación de identidad (incluido el envío de correos para restablecer la contraseña)</p>
</li>
<li><p>Creación de sesiones de Sincronización en tiempo real y visualización y gestión de los datos de escaneo</p>
</li>
<li><p>Mantenimiento del estado de desbloqueo de funciones entre dispositivos</p>
</li>
<li><p>Análisis de estadísticas de uso de la Aplicación, detección de errores y mejora del servicio (si ha dado su consentimiento al análisis de uso)</p>
</li>
<li><p>Búsqueda de lugares y visualización de mapas para crear códigos QR de ubicación</p>
</li>
<li><p>Prevención del uso indebido, seguridad y atención de consultas</p>
</li>
<li><p>Comprobar si las direcciones web escaneadas son sitios de phishing o malware (comprobación de enlaces)</p>
</li>
</ul>
<h2>4. Plazo de conservación y uso</h2>
<ul>
<li><p><strong>Información de miembro:</strong> se conserva hasta que se da de baja. Al darse de baja, el inicio de sesión se bloquea y los tokens de inicio de sesión se eliminan de inmediato, y el resto de la información de la cuenta se elimina de forma permanente en un plazo de 30 días desde la fecha de baja.</p>
</li>
<li><p><strong>Datos de la Sincronización en tiempo real (sesiones y valores escaneados):</strong> se conservan hasta que usted elimina la sesión o los escaneos. Las sesiones eliminadas en el panel web se guardan en la papelera durante 30 días, durante los cuales pueden restaurarse, y después pueden eliminarse de forma permanente. Si se da de baja, se eliminan de forma permanente junto con la cuenta en un plazo de 30 días desde la fecha de baja.</p>
</li>
<li><p><strong>Registros de desbloqueo de funciones:</strong> se conservan hasta que se da de baja y se eliminan en un plazo de 30 días desde la fecha de baja.</p>
</li>
<li><p><strong>Información de análisis de uso:</strong> se elimina automáticamente cuando vence el plazo de conservación configurado en Firebase (Google Analytics).</p>
</li>
<li><p><strong>Información en el dispositivo (historial de escaneos, fotos y configuración):</strong> permanece en el dispositivo hasta que usted la elimina en la Aplicación o desinstala la Aplicación. La Empresa no puede acceder a esta información.</p>
</li>
<li><p>Si la normativa aplicable exige conservar determinada información, esta se guarda por separado y solo durante el plazo que establezca dicha normativa.</p>
</li>
</ul>
<h2>5. Procedimiento y método de destrucción de la información personal</h2>
<p>La información personal cuyo plazo de conservación haya vencido o cuya finalidad se haya cumplido se destruye sin demora. La información almacenada en la base de datos del servidor se elimina de forma que no pueda recuperarse. No existe información personal impresa en papel.</p>
<h2>6. Cesión de información personal a terceros</h2>
<p>La Empresa no cede la información personal de los usuarios a terceros. Se exceptúan las sesiones en tiempo real que el propio usuario haya configurado como públicas, que pueden ser vistas por quien conozca el enlace, y los casos en que las autoridades de investigación u otros organismos lo requieran mediante un procedimiento legal conforme a la normativa.</p>
<h2>7. Encargo del tratamiento y transferencias internacionales</h2>
<p>Para prestar el Servicio, la Empresa utiliza los servicios de los siguientes proveedores. La información que se envía a estos proveedores durante el uso de la Aplicación se transmite a través de una red cifrada (HTTPS).</p>
<ul>
<li><p><strong>Google LLC (Estados Unidos)</strong></p>
<ul>
<li><p>Firebase Analytics: información de análisis de uso del apartado 2-3 / análisis del uso de la aplicación / eliminación según el plazo de conservación configurado</p>
</li>
<li><p>Google Maps Platform: texto de búsqueda de lugares y coordenadas del centro del mapa / búsqueda de lugares y visualización del mapa / tras procesar la solicitud, conforme a las políticas de Google</p>
</li>
<li><p>Inicio de sesión con Google: información de la cuenta de Google del apartado 2-1 / autenticación de inicio de sesión / hasta la baja del miembro</p>
</li>
<li><p>Google Navegación Segura: direcciones web descritas en 2-9 / comprobación de sitios no seguros / se rige por la política de Google tras procesar la solicitud</p>
</li>
<li><p>Contacto: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de privacidad de Google</a></p>
</li>
</ul>
</li>
<li><p><strong>Apple Inc. (Estados Unidos, iOS)</strong></p>
<ul>
<li><p>Iniciar sesión con Apple: información de la cuenta de Apple del apartado 2-1 / autenticación de inicio de sesión / hasta la baja del miembro</p>
</li>
<li><p>Contacto: <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">Política de privacidad de Apple</a></p>
</li>
</ul>
</li>
<li><p><strong>Vercel Inc. (Estados Unidos; los servidores funcionan en la región de Seúl)</strong>: operación del servicio web scanview.app y del servidor de API / tratamiento de la información de miembros y de los datos de envío en tiempo real (almacenados en Supabase, indicado más abajo) / hasta la finalización del contrato de encargo</p>
</li>
<li><p><strong>Supabase Inc. (Estados Unidos; la base de datos se almacena en la región de Seúl)</strong>: almacenamiento de la información de miembros y de los datos de envío en tiempo real (sesiones y valores escaneados) y entrega de notificaciones en tiempo real / eliminación en un plazo de 30 días tras la baja del miembro, o hasta la finalización del contrato de encargo</p>
</li>
<li><p><strong>Resend Inc. (Estados Unidos)</strong>: envío de correos para restablecer la contraseña (dirección de correo electrónico del destinatario, nombre y enlace de restablecimiento) / los registros de envío se conservan durante el plazo que establezcan las políticas de Resend</p>
</li>
<li><p><strong>Cloudflare, Inc. (Estados Unidos)</strong>: gestión del nombre de dominio scanview.app y reenvío de los correos de consulta (support@scanview.app) / no se conservan tras el reenvío</p>
</li>
</ul>
<p>Puede negarse a estas transferencias internacionales desactivando el análisis de uso o la comprobación de enlaces, o no utilizando las funciones correspondientes (inicio de sesión y búsqueda de lugares). En ese caso, solo dejarán de estar disponibles dichas funciones y podrá seguir usando las demás con normalidad.</p>
<h2>8. Derechos del usuario y cómo ejercerlos</h2>
<p>Puede solicitar en cualquier momento el acceso, la rectificación o la eliminación de su información personal, o la suspensión de su tratamiento.</p>
<ul>
<li><p><strong>Acceso y rectificación:</strong> en la Aplicación, en Configuración → su perfil (Configuración de cuenta), puede consultar y modificar su nombre (apodo) y cambiar su contraseña.</p>
</li>
<li><p><strong>Eliminación (baja):</strong> Configuración → su perfil (Configuración de cuenta) → Zona de peligro → Eliminar cuenta. Si no puede usar la Aplicación, puede solicitarla por correo electrónico siguiendo las indicaciones de la página <a href="https://scanview.app/legal/account-deletion?lang=es" target="_blank" rel="noopener noreferrer">Eliminación de cuenta y datos</a>.</p>
</li>
<li><p><strong>Rechazo del análisis de uso:</strong> desactive Configuración → Información → Consentimiento de análisis.</p>
</li>
<li><p><strong>Desactivar la comprobación de enlaces:</strong> desactive Configuración → Escaneo → Comprobación de enlaces.</p>
</li>
<li><p><strong>Retirada de permisos:</strong> puede desactivar en cualquier momento los permisos de cámara, ubicación, fotos, contactos, calendario, notificaciones y dispositivos cercanos en los ajustes del dispositivo.</p>
</li>
<li><p>Para otras solicitudes, escríbanos a la dirección de correo electrónico que figura más abajo. Tras verificar su identidad, le comunicaremos el resultado sin demora (a más tardar en 10 días). También puede presentar solicitudes a través de un representante legal o de una persona autorizada.</p>
</li>
</ul>
<h2>9. Menores de 14 años</h2>
<p>El Servicio no está dirigido a menores de 14 años, y no recopilamos a sabiendas información personal de menores de 14 años. Si descubrimos que un menor de 14 años se ha registrado, eliminaremos sin demora la cuenta y su información.</p>
<h2>10. Medidas de seguridad de la información personal</h2>
<ul>
<li><p>Todas las comunicaciones entre la Aplicación y el servidor se cifran con HTTPS y WSS</p>
</li>
<li><p>Las contraseñas de cuenta y de sesión se guardan únicamente como hashes irreversibles</p>
</li>
<li><p>La información de inicio de sesión almacenada en el dispositivo se guarda en el almacenamiento seguro del sistema operativo (Keychain o Keystore)</p>
</li>
<li><p>Las funciones de administración están restringidas al personal autorizado y se registran las acciones de los administradores</p>
</li>
</ul>
<h2>11. Dispositivos de recopilación automática de información personal</h2>
<p>La Aplicación no utiliza cookies. El sitio web scanview.app utiliza el almacenamiento del navegador (localStorage) para mantener la sesión iniciada y guardar la configuración de visualización, y una cookie para recordar el idioma; puede eliminarlos desde la configuración de su navegador. No utilizamos cookies con fines publicitarios ni de seguimiento.</p>
<h2>12. Responsable de protección de la información personal y contacto</h2>
<ul>
<li><p>Operador: Cubion (큐비온)</p>
</li>
<li><p>Responsable de protección de la información personal: representante de Cubion</p>
</li>
<li><p>Correo electrónico: <a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<p>Si necesita denunciar una vulneración de su información personal o recibir asesoramiento, puede dirigirse a los siguientes organismos de Corea.</p>
<ul>
<li><p>Centro de Denuncias de Vulneraciones de Información Personal: 118 (desde Corea, sin prefijo), privacy.kisa.or.kr</p>
</li>
<li><p>Comité de Mediación de Conflictos sobre Información Personal: 1833-6972, www.kopico.go.kr</p>
</li>
<li><p>División de Investigación Cibernética de la Fiscalía Suprema: 1301 (desde Corea, sin prefijo), www.spo.go.kr</p>
</li>
<li><p>Oficina de Investigación Cibernética de la Agencia Nacional de Policía: 182 (desde Corea, sin prefijo), ecrm.police.go.kr</p>
</li>
</ul>
<h2>13. Cambios en esta política</h2>
<p>Si el contenido de esta política cambia, lo anunciaremos en esta página y en la Aplicación a partir de 7 días antes de su entrada en vigor. Si se trata de cambios importantes para los derechos de los usuarios, lo anunciaremos a partir de 30 días antes.</p>
<ul>
<li><p>Fecha de entrada en vigor: 28 de octubre de 2026</p>
</li>
</ul>$body$, version = '2.1', updated_at = NOW(), published_at = NOW()
WHERE type = 'privacy' AND locale = 'es';
COMMIT;
SELECT locale, version, length(content) AS len, updated_at FROM legal_documents WHERE type = 'privacy' ORDER BY locale;
