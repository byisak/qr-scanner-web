-- 이용약관 영문판 (2026-10-17). 한국어판(terms/ko)과 같은 내용. 다시 실행해도 안전 (ON CONFLICT DO NOTHING)
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'terms', 'en',
  $title$QR Scanner Terms of Service$title$,
  $body$<p>These Terms set out the conditions for using the QR Scanner app (Android and iOS, the "App") and the live scan web service scanview.app (together with the App, the "Service") provided by Cubion (the "Company"), and the rights and obligations of the Company and users. These Terms take effect on October 17, 2026. If the Korean version and this English version differ, the Korean version prevails.</p>
<h2>1. Definitions</h2>
<ul>
<li><p><strong>User:</strong> anyone who uses the Service under these Terms, including people who use the App without an account.</p>
</li>
<li><p><strong>Member:</strong> a user who has signed up and signed in with email, Google or Apple.</p>
</li>
<li><p><strong>Session:</strong> a collection of scans a member creates for Live PC sync. Each session has its own address (link).</p>
</li>
<li><p><strong>Scan data:</strong> code values, scan times and similar data a member sends to a session.</p>
</li>
</ul>
<h2>2. Effect and changes</h2>
<ul>
<li><p>These Terms take effect when posted in the Service or on scanview.app.</p>
</li>
<li><p>The Company may change these Terms within the limits of applicable law. We announce the effective date and the changes on scanview.app or in the App at least 7 days in advance (30 days for changes unfavorable to users).</p>
</li>
<li><p>If you do not agree to the changed Terms, you can stop using the Service and delete your account. Continuing to use the Service after the effective date means you accept the changes.</p>
</li>
</ul>
<h2>3. The Service</h2>
<ul>
<li><p>App features such as scanning and history for QR codes and barcodes, code creation and stocktake. Data from these features is stored only on your device.</p>
</li>
<li><p>Live PC sync for members: values scanned in the App are sent to a scanview.app session so they can be seen on a web page right away.</p>
</li>
<li><p>The Service is currently free. If we introduce paid features, we will announce the price and conditions in advance and charge only with your consent.</p>
</li>
</ul>
<h2>4. Accounts</h2>
<ul>
<li><p>Signing up is optional. Live PC sync requires signing up and signing in.</p>
</li>
<li><p>Members must sign up with accurate information and must not use another person's email or account.</p>
</li>
<li><p>You are responsible for your password and for devices that stay signed in. If you notice that your account has been misused, change your password right away and let us know.</p>
</li>
<li><p>Children under 14 may not sign up as members.</p>
</li>
</ul>
<h2>5. Sessions and scan data</h2>
<ul>
<li><p>Rights to and responsibility for sessions and scan data belong to the member who created them. The Company stores and processes them only as needed to provide the Service.</p>
</li>
<li><p>New sessions are <strong>public</strong> by default, and anyone who knows the address of a public session can view it. When you send codes containing personal information or trade secrets, make the session private or set a password. The Company is not responsible for exposure caused by public settings unless it acted intentionally or with gross negligence.</p>
</li>
<li><p>Sessions you delete are kept in the trash for 30 days and then permanently deleted.</p>
</li>
<li><p>The Company works to protect data against outages and errors, but we recommend keeping your own copy of important scan data using export (CSV or Excel).</p>
</li>
</ul>
<h2>6. Prohibited conduct</h2>
<p>Users must not:</p>
<ul>
<li><p>access another person's account or session without permission, or try to guess session passwords</p>
</li>
<li><p>disrupt the Service by sending excessive requests to its servers or by abnormal automated use</p>
</li>
<li><p>spread illegal information, other people's personal information, or links to malicious code through sessions</p>
</li>
<li><p>reverse engineer the Service, or copy or sell it without the Company's permission</p>
</li>
<li><p>otherwise violate applicable law</p>
</li>
</ul>
<p>If such conduct is confirmed, the Company may make the session private or delete it, and restrict the account. We will tell the member why, and the member can object by writing to support@scanview.app.</p>
<h2>7. Changes to and suspension of the Service</h2>
<ul>
<li><p>The Company may change or stop parts of the Service for operational or technical reasons. We announce changes or suspensions with a significant effect on members 30 days in advance.</p>
</li>
<li><p>The Service may stop briefly without notice for maintenance, outages, natural disasters or similar unavoidable reasons.</p>
</li>
<li><p>If we end the whole Service, we will announce it at least 30 days in advance and let members export their scan data during that period.</p>
</li>
</ul>
<h2>8. Deleting your account</h2>
<ul>
<li><p>You can delete your account at any time in the App under Settings → your profile (Account Settings) → Delete Account, or request deletion by email as described on the <a href="https://scanview.app/legal/account-deletion?lang=en" target="_blank" rel="noopener noreferrer">Account &amp; Data Deletion</a> page.</p>
</li>
<li><p>Once you delete your account, sign-in is blocked immediately, and your account information and session and scan data on our servers are permanently deleted within 30 days.</p>
</li>
</ul>
<h2>9. Limitation of liability</h2>
<ul>
<li><p>Unless applicable law provides otherwise, the Company is not liable in connection with the Service, which is provided free of charge, except for damage caused by the Company's intent or gross negligence.</p>
</li>
<li><p>Scan accuracy can vary with the condition of the code, lighting and the device camera. When you use results for important decisions such as stock counts or payments, check them again.</p>
</li>
<li><p>The Company is not responsible for the content of external websites opened from scanned addresses (URLs) or for damage arising on those sites.</p>
</li>
<li><p>Users are responsible for damage caused by their own violation of these Terms or applicable law.</p>
</li>
</ul>
<h2>10. Privacy</h2>
<p>The Company handles personal information according to the <a href="https://scanview.app/legal/privacy?lang=en" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</p>
<h2>11. Disputes and jurisdiction</h2>
<ul>
<li><p>If you have questions or complaints about the Service, contact support@scanview.app. We reply within 7 business days of receipt.</p>
</li>
<li><p>These Terms are governed by the laws of the Republic of Korea, and disputes are settled by the competent court under the Korean Civil Procedure Act.</p>
</li>
</ul>
<h2>Addendum</h2>
<p>These Terms take effect on October 17, 2026.</p>
<p>Contact: support@scanview.app · Operated by Cubion</p>$body$,
  '1.0', true, now()
)
ON CONFLICT (type, locale) DO NOTHING;

SELECT type, locale, is_published FROM legal_documents WHERE type = 'terms' ORDER BY locale;
