-- 계정 및 데이터 삭제 안내 문서(type = 'account-deletion') 초기 내용
-- 공개 주소: https://scanview.app/legal/account-deletion (?lang=ko|en|ja|zh|es)
-- Google Play "계정 삭제 요구사항"용 웹 링크. 관리자 화면(대시보드 → 관리자 → 약관 관리 → 계정 삭제 안내)에서 이후 수정 가능.
--
-- 적용 방법: 이 브랜치의 코드(account-deletion 타입 허용)를 배포한 뒤 운영 DB에서 한 번 실행.
--   psql "$DATABASE_URL" -f scripts/migrate-legal-account-deletion.sql
-- 같은 (type, locale) 행이 있으면 덮어쓴다(UPSERT). 여러 번 실행해도 결과는 같다.
-- 주의: 본문에 "탈퇴 후 30일 이내 영구 삭제"라고 적었으므로 scripts/purge-withdrawn-users.sql 을
--       주기적으로(최소 월 1회) 실행하거나, 회원 탈퇴 API가 데이터를 바로 지우도록 바꿔야 문서와 실제가 일치한다.
-- 원본: 제목은 각 문서의 첫 번째 '# ' 줄, 본문은 마크다운을 관리자 편집기(Tiptap)가 읽는 HTML로 변환한 것.

BEGIN;

-- account-deletion / ko
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'account-deletion', 'ko',
  $title$계정 및 데이터 삭제 안내$title$,
  $body$<p>이 페이지는 큐비온이 운영하는 <strong>QR 스캐너(QR Scanner)</strong> 앱(Android·iOS)과 scanview.app 서비스의 계정 및 데이터를 삭제하는 방법을 안내합니다.</p>
<ul>
<li><p>앱 이름: QR 스캐너 (QR Scanner)</p>
</li>
<li><p>개발자: 큐비온</p>
</li>
<li><p>문의: <a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<h2>1. 앱에서 바로 삭제하기 (회원 탈퇴)</h2>
<ol>
<li><p>앱을 열고 하단의 <strong>설정</strong> 탭으로 이동합니다.</p>
</li>
<li><p>맨 위의 <strong>프로필(이름이 표시된 카드)</strong>을 눌러 <strong>계정 설정</strong> 화면을 엽니다.</p>
</li>
<li><p>아래쪽 <strong>위험 영역</strong>에서 <strong>회원탈퇴</strong>를 누릅니다.</p>
</li>
<li><p>확인 창에서 <strong>확인</strong>을 누르면 탈퇴가 완료되고 자동으로 로그아웃됩니다.</p>
</li>
</ol>
<h2>2. 앱 없이 이메일로 요청하기</h2>
<p>앱을 삭제했거나 로그인할 수 없는 경우 이메일로 삭제를 요청할 수 있습니다.</p>
<ul>
<li><p>받는 주소: <a href="mailto:support@scanview.app?subject=%5B%EA%B3%84%EC%A0%95%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD%5D%20QR%20%EC%8A%A4%EC%BA%90%EB%84%88" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
<li><p>제목: <strong>[계정 삭제 요청] QR 스캐너</strong></p>
</li>
<li><p>본문: 가입한 이메일 주소, 가입 방법(이메일·Google·Apple), 삭제를 원한다는 내용</p>
</li>
<li><p>본인 확인을 위해 <strong>가입한 이메일 주소로</strong> 보내 주세요. Apple의 '나의 이메일 가리기'로 가입했다면 그 주소로 보낸 메일이 전달되는 Apple ID 이메일에서 보내 주시고, 가능한 경우 가입 시 표시된 중계 주소도 적어 주세요.</p>
</li>
<li><p>다른 주소에서 보내면 본인 확인을 위해 추가 확인을 요청할 수 있습니다.</p>
</li>
</ul>
<p>요청을 받으면 본인 확인 후 영업일 기준 7일 이내에 처리 결과를 회신하며, 늦어도 요청일로부터 30일 이내에 삭제를 마칩니다.</p>
<h2>3. 삭제되는 데이터</h2>
<p>탈퇴하거나 삭제 요청이 처리되면 다음 데이터가 삭제됩니다.</p>
<ul>
<li><p><strong>계정 정보:</strong> 이메일 주소, 이름(닉네임), 비밀번호(해시), 프로필 사진 주소, Google·Apple 로그인 연결 정보(계정 고유 식별자), 가입·마지막 로그인 일시</p>
</li>
<li><p><strong>로그인 정보:</strong> 로그인 유지용 인증 토큰과 기기 식별자, 비밀번호 재설정 기록</p>
</li>
<li><p><strong>실시간 서버 전송 데이터:</strong> 만든 세션(세션 이름, 공개 여부, 비밀번호 등 설정)과 그 세션으로 전송된 스캔 값·스캔 시각</p>
</li>
<li><p><strong>기능 잠금 해제 기록:</strong> 계정에 연결된 기능 잠금 해제 상태와 관련 기록</p>
</li>
</ul>
<h3>삭제 시점</h3>
<ul>
<li><p><strong>즉시:</strong> 로그인이 차단되고 모든 기기의 로그인 토큰이 삭제됩니다. 같은 계정으로 다시 로그인할 수 없습니다.</p>
</li>
<li><p><strong>30일 이내:</strong> 서버에 남아 있는 위 데이터 전체를 영구 삭제합니다. 삭제된 데이터는 복구할 수 없습니다.</p>
</li>
</ul>
<p>공개로 설정한 실시간 세션은 영구 삭제 전까지 링크로 열릴 수 있습니다. 바로 볼 수 없게 하려면 탈퇴하기 전에 앱의 <strong>설정 → 실시간 서버 전송</strong> 또는 scanview.app 대시보드에서 세션을 삭제하거나 비공개로 바꿔 주세요.</p>
<h2>4. 보관되는 데이터</h2>
<ul>
<li><p>회사 서버에는 탈퇴 후 30일이 지나면 위 데이터를 남기지 않습니다.</p>
</li>
<li><p>관계 법령에 따라 보존해야 하는 정보가 생기는 경우(예: 수사기관의 적법한 요청)에만 그 법령이 정한 기간 동안 분리해 보관합니다.</p>
</li>
<li><p>사용 분석 정보(Firebase Analytics)는 계정과 연결되지 않은 앱 설치 단위 정보이며, Firebase에 설정된 보존 기간이 지나면 자동으로 삭제됩니다. 앱의 <strong>설정 → 앱 정보 및 지원 → 사용 분석 동의</strong>를 끄면 더 이상 수집하지 않습니다.</p>
</li>
</ul>
<h2>5. 기기에 저장된 데이터</h2>
<p>스캔 기록, 만든 코드, 스캔 사진, 설정은 회사 서버가 아닌 <strong>사용자 기기에만</strong> 저장되므로 회원 탈퇴로 지워지지 않습니다.</p>
<ul>
<li><p>앱의 <strong>기록</strong> 화면에서 항목을 지우거나 <strong>전체 삭제</strong>로 한 번에 지울 수 있습니다.</p>
</li>
<li><p>앱을 삭제(제거)하면 기기에 저장된 앱 데이터가 모두 지워집니다.</p>
</li>
<li><p>Google 드라이브나 iCloud에 직접 만든 백업 파일은 사용자 본인 저장소에 있으므로 해당 서비스에서 직접 삭제해 주세요.</p>
</li>
</ul>
<h2>6. 관련 문서</h2>
<ul>
<li><p><a href="https://scanview.app/legal/privacy" target="_blank" rel="noopener noreferrer">개인정보 처리방침</a></p>
</li>
<li><p><a href="https://scanview.app/legal/terms" target="_blank" rel="noopener noreferrer">서비스 이용약관</a></p>
</li>
</ul>$body$,
  '1.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  version = EXCLUDED.version,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();

-- account-deletion / en
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'account-deletion', 'en',
  $title$Account & Data Deletion$title$,
  $body$<p>This page explains how to delete your account and data for the <strong>QR Scanner (QR 스캐너)</strong> app for Android and iOS and the scanview.app service, operated by Cubion (큐비온).</p>
<ul>
<li><p>App name: QR Scanner (QR 스캐너)</p>
</li>
<li><p>Developer: Cubion (큐비온)</p>
</li>
<li><p>Contact: <a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<h2>1. Delete your account in the app</h2>
<ol>
<li><p>Open the app and go to the <strong>Settings</strong> tab at the bottom.</p>
</li>
<li><p>Tap your <strong>profile card</strong> (showing your name) at the top to open <strong>Account Settings</strong>.</p>
</li>
<li><p>Under <strong>Danger Zone</strong>, tap <strong>Delete Account</strong>.</p>
</li>
<li><p>Tap <strong>Confirm</strong>. Your account is deleted and you are signed out.</p>
</li>
</ol>
<h2>2. Request deletion by email (without the app)</h2>
<p>If you have uninstalled the app or cannot sign in, you can request deletion by email.</p>
<ul>
<li><p>To: <a href="mailto:support@scanview.app?subject=%5BAccount%20Deletion%20Request%5D%20QR%20Scanner" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
<li><p>Subject: <strong>[Account Deletion Request] QR Scanner</strong></p>
</li>
<li><p>Body: the email address you signed up with, how you signed up (email, Google or Apple), and that you want your account deleted</p>
</li>
<li><p>To verify that the request is yours, please send it <strong>from the email address registered to your account</strong>. If you used Apple's "Hide My Email", send it from the Apple ID email that receives mail forwarded from that relay address and include the relay address if you can.</p>
</li>
<li><p>If you write from a different address, we may ask for additional verification.</p>
</li>
</ul>
<p>After verifying your identity we will reply within 7 business days, and deletion will be completed within 30 days of your request at the latest.</p>
<h2>3. What is deleted</h2>
<p>When you delete your account or your request is processed, the following data is deleted:</p>
<ul>
<li><p><strong>Account information:</strong> email address, name (nickname), password (hash), profile photo URL, Google/Apple sign-in links (account identifiers), sign-up and last sign-in times</p>
</li>
<li><p><strong>Sign-in data:</strong> authentication tokens, device identifiers and password-reset records</p>
</li>
<li><p><strong>Realtime Server Sync data:</strong> sessions you created (session name, public/private setting, password and other settings) and the scan values and times sent to them</p>
</li>
<li><p><strong>Feature-unlock records:</strong> feature-unlock status and related records linked to your account</p>
</li>
</ul>
<h3>When it is deleted</h3>
<ul>
<li><p><strong>Immediately:</strong> sign-in is blocked and sign-in tokens on all devices are deleted. You can no longer sign in to the account.</p>
</li>
<li><p><strong>Within 30 days:</strong> all of the remaining data above is permanently deleted from our server. Deleted data cannot be recovered.</p>
</li>
</ul>
<p>A session you made public may still open from its link until it is permanently deleted. To make it unavailable right away, delete the session or make it private before deleting your account, in the app under <strong>Settings → Realtime Server Sync</strong> or on the scanview.app dashboard.</p>
<h2>4. What is kept</h2>
<ul>
<li><p>After 30 days from deletion, none of the data above remains on our server.</p>
</li>
<li><p>Only if a law requires us to keep certain information (for example, a lawful request from investigative authorities) will we keep it separately, for the period that law requires.</p>
</li>
<li><p>Usage analytics (Firebase Analytics) is tied to the app installation, not to your account, and is deleted automatically when the retention period configured in Firebase expires. Turn off <strong>Settings → App Info &amp; Support → Usage Analytics</strong> in the app to stop collection.</p>
</li>
</ul>
<h2>5. Data stored on your device</h2>
<p>Your scan history, created codes, scan photos and settings are stored <strong>only on your device</strong>, not on our server, so deleting your account does not remove them.</p>
<ul>
<li><p>Delete individual items in the app's <strong>History</strong> screen, or use <strong>Delete All</strong> to remove everything.</p>
</li>
<li><p>Uninstalling the app removes all app data stored on the device.</p>
</li>
<li><p>Backup files you created in Google Drive or iCloud are in your own storage; please delete them there.</p>
</li>
</ul>
<h2>6. Related documents</h2>
<ul>
<li><p><a href="https://scanview.app/legal/privacy?lang=en" target="_blank" rel="noopener noreferrer">Privacy Policy</a></p>
</li>
<li><p><a href="https://scanview.app/legal/terms?lang=en" target="_blank" rel="noopener noreferrer">Terms of Service</a></p>
</li>
</ul>$body$,
  '1.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  version = EXCLUDED.version,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();

-- account-deletion / ja
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'account-deletion', 'ja',
  $title$アカウントとデータの削除について$title$,
  $body$<p>このページでは、큐비온（Cubion）が運営する <strong>QR Scanner（QR 스캐너）</strong> アプリ（Android・iOS）と scanview.app サービスのアカウントおよびデータを削除する方法をご案内します。</p>
<ul>
<li><p>アプリ名：QR Scanner（QR 스캐너）</p>
</li>
<li><p>開発者：큐비온（Cubion）</p>
</li>
<li><p>お問い合わせ：<a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<h2>1. アプリで削除する（退会）</h2>
<ol>
<li><p>アプリを開き、下部の <strong>設定</strong> タブに移動します。</p>
</li>
<li><p>上部の <strong>プロフィール（名前が表示されたカード）</strong> をタップして <strong>アカウント設定</strong> を開きます。</p>
</li>
<li><p><strong>危険な操作</strong> の <strong>退会</strong> をタップします。</p>
</li>
<li><p>確認画面で <strong>確認</strong> をタップすると退会が完了し、自動的にログアウトされます。</p>
</li>
</ol>
<h2>2. アプリを使わずにメールで依頼する</h2>
<ul>
<li><p>宛先：<a href="mailto:support@scanview.app?subject=%5BAccount%20Deletion%20Request%5D%20QR%20Scanner" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
<li><p>件名：<strong>[Account Deletion Request] QR Scanner</strong></p>
</li>
<li><p>本文：登録したメールアドレス、登録方法（メール・Google・Apple）、削除を希望する旨</p>
</li>
<li><p>本人確認のため、<strong>登録したメールアドレスから</strong> 送信してください。別のアドレスから送信された場合は追加の確認をお願いすることがあります。</p>
</li>
</ul>
<p>本人確認後、7営業日以内に返信し、遅くとも依頼日から30日以内に削除を完了します。</p>
<h2>3. 削除されるデータ</h2>
<ul>
<li><p><strong>アカウント情報：</strong> メールアドレス、名前（ニックネーム）、パスワード（ハッシュ）、プロフィール写真のURL、Google・Appleログインの連携情報、登録日時・最終ログイン日時</p>
</li>
<li><p><strong>ログイン情報：</strong> 認証トークン、端末識別子、パスワード再設定の記録</p>
</li>
<li><p><strong>リアルタイムサーバー送信のデータ：</strong> 作成したセッション（名前・公開設定・パスワードなど）と、そこに送信されたスキャン値・スキャン日時</p>
</li>
<li><p><strong>機能ロック解除の記録</strong></p>
</li>
</ul>
<p>退会と同時にログインが遮断され、すべての端末の認証トークンが削除されます。残りのデータは <strong>30日以内</strong> にサーバーから完全に削除され、復元できません。公開セッションは完全削除まではリンクから閲覧できる場合があるため、すぐに非公開にしたい場合は退会前に <strong>設定 → リアルタイムサーバー送信</strong> または scanview.app のダッシュボードでセッションを削除するか非公開にしてください。</p>
<h2>4. 保持されるデータ</h2>
<p>退会から30日を過ぎると、上記のデータはサーバーに残りません。法令により保存が必要な場合に限り、その法令が定める期間だけ分離して保管します。使用分析（Firebase Analytics）のデータはアカウントではなくアプリのインストール単位の情報で、Firebaseで設定された保存期間を過ぎると自動的に削除されます。アプリの <strong>設定 → アプリ情報とサポート → 使用分析の同意</strong> をオフにすると収集を停止します。</p>
<h2>5. 端末に保存されたデータ</h2>
<p>スキャン履歴、作成したコード、スキャン写真、設定は <strong>端末にのみ</strong> 保存されるため、退会しても削除されません。アプリの <strong>履歴</strong> 画面で個別に、または <strong>すべて削除</strong> でまとめて削除できます。アプリをアンインストールすると、端末内のアプリデータはすべて削除されます。Googleドライブや iCloud に作成したバックアップは、ご自身で各サービスから削除してください。</p>
<h2>6. 関連文書</h2>
<ul>
<li><p><a href="https://scanview.app/legal/privacy?lang=ja" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a></p>
</li>
<li><p><a href="https://scanview.app/legal/terms?lang=ja" target="_blank" rel="noopener noreferrer">利用規約</a></p>
</li>
</ul>$body$,
  '1.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  version = EXCLUDED.version,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();

-- account-deletion / zh
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'account-deletion', 'zh',
  $title$账户与数据删除说明$title$,
  $body$<p>本页面说明如何删除由 큐비온（Cubion）运营的 <strong>QR Scanner（QR 스캐너）</strong> 应用（Android、iOS）及 scanview.app 服务中的账户和数据。</p>
<ul>
<li><p>应用名称：QR Scanner（QR 스캐너）</p>
</li>
<li><p>开发者：큐비온（Cubion）</p>
</li>
<li><p>联系方式：<a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<h2>1. 在应用中删除（注销账户）</h2>
<ol>
<li><p>打开应用，进入底部的 <strong>设置</strong> 标签。</p>
</li>
<li><p>点击顶部的 <strong>个人资料卡片（显示您的名字）</strong>，打开 <strong>账户设置</strong>。</p>
</li>
<li><p>在 <strong>危险区域</strong> 中点击 <strong>注销账户</strong>。</p>
</li>
<li><p>在确认窗口中点击 <strong>确认</strong>，即完成注销并自动退出登录。</p>
</li>
</ol>
<h2>2. 不使用应用，通过电子邮件申请</h2>
<ul>
<li><p>收件人：<a href="mailto:support@scanview.app?subject=%5BAccount%20Deletion%20Request%5D%20QR%20Scanner" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
<li><p>主题：<strong>[Account Deletion Request] QR Scanner</strong></p>
</li>
<li><p>正文：注册时使用的电子邮件地址、注册方式（电子邮件、Google、Apple），以及希望删除账户的说明</p>
</li>
<li><p>为确认是您本人，请 <strong>使用注册时的电子邮件地址</strong> 发送。如从其他地址发送，我们可能会要求进一步确认。</p>
</li>
</ul>
<p>确认身份后，我们将在 7 个工作日内回复，并最迟在收到申请后 30 天内完成删除。</p>
<h2>3. 将被删除的数据</h2>
<ul>
<li><p><strong>账户信息：</strong> 电子邮件地址、名字（昵称）、密码（哈希）、头像地址、Google/Apple 登录关联信息、注册及最后登录时间</p>
</li>
<li><p><strong>登录信息：</strong> 认证令牌、设备标识符、密码重置记录</p>
</li>
<li><p><strong>实时服务器传输数据：</strong> 您创建的会话（名称、公开设置、密码等）及发送到这些会话的扫描内容和扫描时间</p>
</li>
<li><p><strong>功能解锁记录</strong></p>
</li>
</ul>
<p>注销后会立即阻止登录，并删除所有设备上的认证令牌。其余数据将在 <strong>30 天内</strong> 从服务器永久删除，且无法恢复。公开会话在永久删除前仍可能通过链接查看；如需立即隐藏，请在注销前通过 <strong>设置 → 实时服务器传输</strong> 或 scanview.app 控制台删除会话或将其设为非公开。</p>
<h2>4. 保留的数据</h2>
<p>注销 30 天后，上述数据不会保留在服务器上。仅在法律要求保存时，才会在法律规定的期限内单独保管。使用分析（Firebase Analytics）数据以应用安装为单位、不与账户关联，超过 Firebase 中设置的保留期限后自动删除。关闭应用中的 <strong>设置 → 应用信息和支持 → 使用分析同意</strong> 即可停止收集。</p>
<h2>5. 设备上保存的数据</h2>
<p>扫描历史、创建的代码、扫描照片和设置 <strong>仅保存在您的设备上</strong>，注销账户不会删除它们。您可以在应用的 <strong>历史</strong> 页面逐条删除，或使用 <strong>全部删除</strong> 一次性删除。卸载应用会删除设备上的全部应用数据。您在 Google 云端硬盘或 iCloud 中创建的备份文件，请在相应服务中自行删除。</p>
<h2>6. 相关文件</h2>
<ul>
<li><p><a href="https://scanview.app/legal/privacy?lang=zh" target="_blank" rel="noopener noreferrer">隐私政策</a></p>
</li>
<li><p><a href="https://scanview.app/legal/terms?lang=zh" target="_blank" rel="noopener noreferrer">服务条款</a></p>
</li>
</ul>$body$,
  '1.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  version = EXCLUDED.version,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();

-- account-deletion / es
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'account-deletion', 'es',
  $title$Eliminación de cuenta y datos$title$,
  $body$<p>Esta página explica cómo eliminar tu cuenta y tus datos de la aplicación <strong>QR Scanner (QR 스캐너)</strong> para Android e iOS y del servicio scanview.app, operados por Cubion (큐비온).</p>
<ul>
<li><p>Nombre de la aplicación: QR Scanner (QR 스캐너)</p>
</li>
<li><p>Desarrollador: Cubion (큐비온)</p>
</li>
<li><p>Contacto: <a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<h2>1. Eliminar la cuenta desde la aplicación</h2>
<ol>
<li><p>Abre la aplicación y ve a la pestaña <strong>Configuración</strong> en la parte inferior.</p>
</li>
<li><p>Toca la <strong>tarjeta de perfil</strong> (con tu nombre) en la parte superior para abrir <strong>Configuración de cuenta</strong>.</p>
</li>
<li><p>En <strong>Zona de peligro</strong>, toca <strong>Eliminar cuenta</strong>.</p>
</li>
<li><p>Toca <strong>Confirmar</strong>. La cuenta se elimina y se cierra la sesión automáticamente.</p>
</li>
</ol>
<h2>2. Solicitar la eliminación por correo electrónico (sin la aplicación)</h2>
<ul>
<li><p>Para: <a href="mailto:support@scanview.app?subject=%5BAccount%20Deletion%20Request%5D%20QR%20Scanner" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
<li><p>Asunto: <strong>[Account Deletion Request] QR Scanner</strong></p>
</li>
<li><p>Mensaje: la dirección de correo con la que te registraste, el método de registro (correo, Google o Apple) y que deseas eliminar tu cuenta</p>
</li>
<li><p>Para verificar tu identidad, envía el mensaje <strong>desde la dirección de correo registrada</strong>. Si escribes desde otra dirección, podemos pedirte una verificación adicional.</p>
</li>
</ul>
<p>Tras verificar tu identidad responderemos en un plazo de 7 días hábiles y completaremos la eliminación como máximo 30 días después de tu solicitud.</p>
<h2>3. Datos que se eliminan</h2>
<ul>
<li><p><strong>Información de la cuenta:</strong> correo electrónico, nombre (apodo), contraseña (hash), URL de la foto de perfil, vínculos de inicio de sesión con Google/Apple, fechas de registro y de último inicio de sesión</p>
</li>
<li><p><strong>Datos de inicio de sesión:</strong> tokens de autenticación, identificadores de dispositivo y registros de restablecimiento de contraseña</p>
</li>
<li><p><strong>Datos de sincronización en tiempo real:</strong> las sesiones que creaste (nombre, visibilidad, contraseña y otros ajustes) y los valores y horas de escaneo enviados a ellas</p>
</li>
<li><p><strong>Registros de desbloqueo de funciones</strong></p>
</li>
</ul>
<p>Al eliminar la cuenta, el inicio de sesión se bloquea y los tokens de todos los dispositivos se eliminan de inmediato. El resto de los datos se elimina de forma permanente del servidor <strong>en un plazo de 30 días</strong> y no se puede recuperar. Una sesión pública puede seguir abriéndose desde su enlace hasta su eliminación definitiva; para ocultarla de inmediato, elimínala o hazla privada antes de eliminar la cuenta en <strong>Configuración → Sincronización en tiempo real</strong> o en el panel de scanview.app.</p>
<h2>4. Datos que se conservan</h2>
<p>Pasados 30 días desde la eliminación, ninguno de los datos anteriores permanece en nuestro servidor. Solo si una ley nos obliga a conservar cierta información la guardaremos por separado y durante el plazo que dicha ley establezca. Los datos de análisis de uso (Firebase Analytics) están asociados a la instalación de la aplicación, no a tu cuenta, y se eliminan automáticamente al vencer el plazo de conservación configurado en Firebase. Desactiva <strong>Configuración → Información y soporte → Consentimiento de análisis</strong> para dejar de recopilarlos.</p>
<h2>5. Datos guardados en tu dispositivo</h2>
<p>El historial de escaneos, los códigos creados, las fotos de escaneo y los ajustes se guardan <strong>solo en tu dispositivo</strong>, por lo que eliminar la cuenta no los borra. Puedes borrarlos uno a uno en la pantalla <strong>Historial</strong> de la aplicación o todos a la vez con <strong>Eliminar todo</strong>. Al desinstalar la aplicación se eliminan todos sus datos del dispositivo. Las copias de seguridad que hayas creado en Google Drive o iCloud están en tu propio almacenamiento; elimínalas desde esos servicios.</p>
<h2>6. Documentos relacionados</h2>
<ul>
<li><p><a href="https://scanview.app/legal/privacy?lang=es" target="_blank" rel="noopener noreferrer">Política de privacidad</a></p>
</li>
<li><p><a href="https://scanview.app/legal/terms?lang=es" target="_blank" rel="noopener noreferrer">Términos del servicio</a></p>
</li>
</ul>$body$,
  '1.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  version = EXCLUDED.version,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();

COMMIT;
