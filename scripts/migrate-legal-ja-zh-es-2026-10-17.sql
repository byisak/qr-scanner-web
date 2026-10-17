-- 이용약관·개인정보 처리방침 일본어(ja)·중국어 간체(zh)·스페인어(es)판 (2026-10-17).
-- 한국어판(terms/ko v1.0, privacy/ko v2.0) 번역. 다시 실행해도 안전 (ON CONFLICT DO NOTHING)

BEGIN;

INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'terms', 'ja',
  $title$QRスキャナー 利用規約$title$,
  $body$<p>本規約は、Cubion（以下「当社」）が提供するQRスキャナーアプリ（Android・iOS、以下「アプリ」）およびリアルタイムスキャン確認ウェブサービスscanview.app（以下、アプリとあわせて「本サービス」）の利用条件と手続き、ならびに当社と利用者の権利・義務を定めるものです。本規約は2026年10月17日から施行します。韓国語版と本日本語版の内容が異なる場合は、韓国語版が優先します。</p>
<h2>第1条（定義）</h2>
<ul>
<li><p><strong>利用者：</strong>本規約に従って本サービスを利用する人をいいます。会員登録をせずにアプリを利用する人も含みます。</p>
</li>
<li><p><strong>会員：</strong>メールアドレス、GoogleまたはAppleのアカウントで登録し、ログインした利用者をいいます。</p>
</li>
<li><p><strong>セッション：</strong>会員がリアルタイムPC送信のために作成するスキャンのまとまりをいいます。セッションごとに固有のアドレス（リンク）があります。</p>
</li>
<li><p><strong>スキャンデータ：</strong>会員がセッションに送信したコードの値やスキャン日時などをいいます。</p>
</li>
</ul>
<h2>第2条（規約の効力と変更）</h2>
<ul>
<li><p>本規約は、本サービスの画面またはscanview.appに掲示することで効力が生じます。</p>
</li>
<li><p>当社は、関連法令に反しない範囲で本規約を変更することがあります。変更する場合は、施行日と変更内容を施行日の7日前から（利用者に不利な変更の場合は30日前から）scanview.appまたはアプリでお知らせします。</p>
</li>
<li><p>変更後の規約に同意しない場合は、本サービスの利用を中止して退会することができます。施行日以降も引き続き利用した場合は、変更後の規約に同意したものとみなします。</p>
</li>
</ul>
<h2>第3条（サービスの内容）</h2>
<ul>
<li><p>QRコード・バーコードのスキャンと履歴、コード作成、在庫棚卸しなどのアプリ機能。これらの機能のデータは利用者の端末内にのみ保存されます。</p>
</li>
<li><p>会員に提供するリアルタイムPC送信：アプリでスキャンした値をscanview.appのセッションに送り、ウェブ画面ですぐに確認できる機能</p>
</li>
<li><p>本サービスは現在無料で提供しています。有料機能を新たに提供する場合は、価格と条件を事前にお知らせし、利用者が同意した場合にのみ料金をいただきます。</p>
</li>
</ul>
<h2>第4条（会員登録とアカウント管理）</h2>
<ul>
<li><p>会員登録は任意です。リアルタイムPC送信を利用するには、会員登録とログインが必要です。</p>
</li>
<li><p>会員は正確な情報で登録しなければならず、他人のメールアドレスやアカウントを使用してはなりません。</p>
</li>
<li><p>パスワードとログイン状態の端末は、会員ご自身で管理してください。アカウントが不正に使用されたことに気付いた場合は、すぐにパスワードを変更し、当社にお知らせください。</p>
</li>
<li><p>14歳未満の方は会員登録できません。</p>
</li>
</ul>
<h2>第5条（セッションとスキャンデータ）</h2>
<ul>
<li><p>セッションとスキャンデータに関する権利と責任は、それを作成した会員にあります。当社は、本サービスの提供に必要な範囲でのみこれを保存・処理します。</p>
</li>
<li><p>新しいセッションは初期設定で<strong>公開</strong>となっており、公開セッションはアドレスを知っている人なら誰でも閲覧できます。個人情報や営業秘密を含むコードを送信する場合は、セッションを非公開に変更するか、パスワードを設定してください。公開設定によって生じた露出について、当社は故意または重大な過失がない限り責任を負いません。</p>
</li>
<li><p>会員が削除したセッションは、ゴミ箱に30日間保管された後、完全に削除されます。</p>
</li>
<li><p>当社は障害やエラーに備えてデータの保護に努めますが、重要なスキャンデータは会員ご自身でエクスポート（CSV・Excel）して別途保管することをおすすめします。</p>
</li>
</ul>
<h2>第6条（禁止行為）</h2>
<p>利用者は、次の行為をしてはなりません。</p>
<ul>
<li><p>他人のアカウントやセッションに許可なくアクセスする行為、またはセッションのパスワードを総当たりで探ろうとする行為</p>
</li>
<li><p>本サービスのサーバーに過度なリクエストを送信したり、自動化ツールで不正に利用したりして、本サービスの運営を妨げる行為</p>
</li>
<li><p>違法な情報、他人の個人情報、悪意のあるコードにつながるアドレスをセッションを通じて広める行為</p>
</li>
<li><p>本サービスをリバースエンジニアリングする行為、または当社の許可なく複製・販売する行為</p>
</li>
<li><p>その他、関連法令に違反する行為</p>
</li>
</ul>
<p>当社は、これらの行為を確認した場合、該当するセッションを非公開に変更または削除し、アカウントの利用を制限することがあります。制限する場合はその理由を会員にお知らせし、会員はsupport@scanview.appに異議を申し立てることができます。</p>
<h2>第7条（サービスの変更と中断）</h2>
<ul>
<li><p>当社は、運営上・技術上の必要に応じて本サービスの一部を変更または中断することがあります。会員への影響が大きい変更や中断は、30日前にお知らせします。</p>
</li>
<li><p>設備点検、障害、天災地変などやむを得ない場合には、事前にお知らせできないまま本サービスが一時的に停止することがあります。</p>
</li>
<li><p>本サービス全体を終了する場合は、少なくとも30日前にお知らせし、その期間中に会員がスキャンデータをエクスポートできるようにします。</p>
</li>
</ul>
<h2>第8条（退会）</h2>
<ul>
<li><p>会員はいつでも、アプリの設定 → プロフィール（アカウント設定）→ 退会から退会するか、<a href="https://scanview.app/legal/account-deletion?lang=ja" target="_blank" rel="noopener noreferrer">アカウントとデータの削除について</a>の案内に従ってメールで削除を依頼することができます。</p>
</li>
<li><p>退会するとすぐにログインできなくなり、サーバーに残っているアカウント情報とセッション・スキャンデータは30日以内に完全に削除されます。</p>
</li>
</ul>
<h2>第9条（責任の制限）</h2>
<ul>
<li><p>当社は、無料で提供する本サービスに関して、関連法令に特別な定めがない限り責任を負いません。ただし、当社の故意または重大な過失によって生じた損害はこの限りではありません。</p>
</li>
<li><p>スキャン結果の正確さは、コードの状態、照明、端末のカメラによって異なる場合があります。在庫数量や決済など重要な判断に使用する場合は、利用者ご自身で結果をもう一度確認してください。</p>
</li>
<li><p>スキャンしたアドレス（URL）からつながる外部サイトの内容や、そのサイトで生じた損害について、当社は責任を負いません。</p>
</li>
<li><p>利用者が本規約または関連法令に違反して生じた損害は、その利用者が責任を負います。</p>
</li>
</ul>
<h2>第10条（個人情報の保護）</h2>
<p>当社は、利用者の個人情報を<a href="https://scanview.app/legal/privacy?lang=ja" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>に従って取り扱います。</p>
<h2>第11条（紛争の解決と管轄）</h2>
<ul>
<li><p>本サービスの利用に関してご不明な点やご不満がある場合は、support@scanview.appまでご連絡ください。当社は受け付けた日から7営業日以内に回答します。</p>
</li>
<li><p>本規約は大韓民国の法律に準拠し、紛争が生じた場合は韓国の民事訴訟法に基づく管轄裁判所で解決します。</p>
</li>
</ul>
<h2>附則</h2>
<p>本規約は2026年10月17日から施行します。</p>
<p>お問い合わせ：support@scanview.app · 運営：Cubion</p>$body$,
  '1.0', true, now()
)
ON CONFLICT (type, locale) DO NOTHING;

INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'terms', 'zh',
  $title$QR扫描器 服务条款$title$,
  $body$<p>本条款规定了 Cubion（以下简称"公司"）提供的 QR扫描器应用（Android、iOS，以下简称"应用"）及实时扫描查看网络服务 scanview.app（以下与应用合称"本服务"）的使用条件和程序，以及公司与用户的权利和义务。本条款自2026年10月17日起施行。韩文版与本中文版内容不一致时，以韩文版为准。</p>
<h2>第1条（定义）</h2>
<ul>
<li><p><strong>用户：</strong>指根据本条款使用本服务的人，包括未注册会员而使用应用的人。</p>
</li>
<li><p><strong>会员：</strong>指通过电子邮件、Google 或 Apple 账户注册并登录的用户。</p>
</li>
<li><p><strong>会话：</strong>指会员为实时发送到电脑而创建的扫描集合单位。每个会话都有其专属地址（链接）。</p>
</li>
<li><p><strong>扫描数据：</strong>指会员发送到会话的代码值和扫描时间等信息。</p>
</li>
</ul>
<h2>第2条（条款的效力与变更）</h2>
<ul>
<li><p>本条款自在本服务界面或 scanview.app 上公布之日起生效。</p>
</li>
<li><p>公司可在不违反相关法律法规的范围内变更本条款。变更时，将自施行日前7日起（对用户不利的变更自施行日前30日起）在 scanview.app 或应用中公告施行日期和变更内容。</p>
</li>
<li><p>如不同意变更后的条款，用户可停止使用本服务并注销账户。施行日之后继续使用本服务的，视为同意变更后的条款。</p>
</li>
</ul>
<h2>第3条（服务内容）</h2>
<ul>
<li><p>二维码、条形码的扫描与记录、代码生成、库存盘点等应用功能。这些功能的数据仅保存在用户的设备中。</p>
</li>
<li><p>向会员提供的实时发送到电脑：将在应用中扫描的值发送到 scanview.app 会话，以便在网页上即时查看的功能</p>
</li>
<li><p>本服务目前免费提供。如新增付费功能，公司将事先公告价格和条件，并仅在用户同意的情况下收取费用。</p>
</li>
</ul>
<h2>第4条（会员注册与账户管理）</h2>
<ul>
<li><p>会员注册为可选项。使用实时发送到电脑功能需要注册会员并登录。</p>
</li>
<li><p>会员应使用准确的信息注册，不得使用他人的电子邮件或账户。</p>
</li>
<li><p>密码及处于登录状态的设备应由会员自行管理。如发现账户被盗用，请立即更改密码并通知公司。</p>
</li>
<li><p>未满14周岁者不得注册为会员。</p>
</li>
</ul>
<h2>第5条（会话与扫描数据）</h2>
<ul>
<li><p>会话和扫描数据的权利与责任归创建该会话和数据的会员所有。公司仅在提供本服务所需的范围内保存和处理这些数据。</p>
</li>
<li><p>新会话默认为<strong>公开</strong>，任何知道公开会话地址的人都可以查看。发送含有个人信息或商业秘密的代码时，应将会话改为非公开或设置密码。因公开设置而导致的泄露，除公司存在故意或重大过失外，公司不承担责任。</p>
</li>
<li><p>会员删除的会话将在回收站中保留30天，之后永久删除。</p>
</li>
<li><p>公司会尽力保护数据以应对故障或错误，但建议会员通过导出功能（CSV、Excel）另行保存重要的扫描数据。</p>
</li>
</ul>
<h2>第6条（禁止行为）</h2>
<p>用户不得实施以下行为：</p>
<ul>
<li><p>未经许可访问他人的账户或会话，或试图通过随机尝试破解会话密码的行为</p>
</li>
<li><p>向本服务服务器发送过量请求，或使用自动化工具进行异常使用，从而妨碍本服务运营的行为</p>
</li>
<li><p>通过会话传播违法信息、他人个人信息或指向恶意代码的地址的行为</p>
</li>
<li><p>对本服务进行逆向工程，或未经公司许可复制、销售本服务的行为</p>
</li>
<li><p>其他违反相关法律法规的行为</p>
</li>
</ul>
<p>一经确认存在上述行为，公司可将相关会话改为非公开或予以删除，并限制账户的使用。限制时将告知会员理由，会员可通过 support@scanview.app 提出异议。</p>
<h2>第7条（服务的变更与中止）</h2>
<ul>
<li><p>公司可根据运营或技术上的需要变更或中止本服务的部分内容。对会员影响较大的变更或中止，将提前30天通知。</p>
</li>
<li><p>因设备检修、故障、自然灾害等不可避免的情况，本服务可能在未事先通知的情况下暂时中断。</p>
</li>
<li><p>终止全部服务时，公司将至少提前30天通知，并在此期间允许会员导出扫描数据。</p>
</li>
</ul>
<h2>第8条（注销账户）</h2>
<ul>
<li><p>会员可随时在应用的 设置 → 个人资料（账户设置）→ 注销账户 中注销，或按照<a href="https://scanview.app/legal/account-deletion?lang=zh" target="_blank" rel="noopener noreferrer">账户与数据删除说明</a>通过电子邮件申请删除。</p>
</li>
<li><p>注销后将立即无法登录，服务器上剩余的账户信息以及会话和扫描数据将在30天内永久删除。</p>
</li>
</ul>
<h2>第9条（责任限制）</h2>
<ul>
<li><p>对于免费提供的本服务，除相关法律法规另有特别规定外，公司不承担责任。但因公司故意或重大过失造成的损害除外。</p>
</li>
<li><p>扫描结果的准确性可能因代码状态、光线和设备摄像头而有所不同。将结果用于库存数量或付款等重要判断时，用户应再次核对结果。</p>
</li>
<li><p>对于通过扫描的地址（URL）打开的外部网站的内容，以及在该网站上产生的损害，公司不承担责任。</p>
</li>
<li><p>因用户违反本条款或相关法律法规而造成的损害，由该用户自行承担责任。</p>
</li>
</ul>
<h2>第10条（个人信息保护）</h2>
<p>公司依照<a href="https://scanview.app/legal/privacy?lang=zh" target="_blank" rel="noopener noreferrer">隐私政策</a>处理用户的个人信息。</p>
<h2>第11条（争议解决与管辖）</h2>
<ul>
<li><p>如对本服务的使用有任何疑问或不满，请联系 support@scanview.app。公司将自收到之日起7个工作日内答复。</p>
</li>
<li><p>本条款适用大韩民国法律。如发生争议，由依照韩国《民事诉讼法》确定的有管辖权的法院解决。</p>
</li>
</ul>
<h2>附则</h2>
<p>本条款自2026年10月17日起施行。</p>
<p>联系方式：support@scanview.app · 运营方：Cubion</p>$body$,
  '1.0', true, now()
)
ON CONFLICT (type, locale) DO NOTHING;

INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'terms', 'es',
  $title$Términos de servicio de QR Scanner$title$,
  $body$<p>Estos Términos establecen las condiciones y los procedimientos de uso de la aplicación QR Scanner (Android e iOS, en adelante, la "Aplicación") y del servicio web de visualización de escaneos en tiempo real scanview.app (junto con la Aplicación, en adelante, el "Servicio") que ofrece Cubion (en adelante, la "Empresa"), así como los derechos y obligaciones de la Empresa y de los usuarios. Estos Términos entran en vigor el 17 de octubre de 2026. Si la versión en coreano y esta versión en español difieren, prevalecerá la versión en coreano.</p>
<h2>Artículo 1 (Definiciones)</h2>
<ul>
<li><p><strong>Usuario:</strong> toda persona que utiliza el Servicio conforme a estos Términos, incluidas las personas que usan la Aplicación sin registrarse.</p>
</li>
<li><p><strong>Miembro:</strong> el usuario que se ha registrado e iniciado sesión con su correo electrónico o con una cuenta de Google o Apple.</p>
</li>
<li><p><strong>Sesión:</strong> el conjunto de escaneos que un miembro crea para el envío en vivo al PC. Cada sesión tiene su propia dirección (enlace).</p>
</li>
<li><p><strong>Datos de escaneo:</strong> los valores de los códigos, la hora del escaneo y otros datos similares que un miembro envía a una sesión.</p>
</li>
</ul>
<h2>Artículo 2 (Vigencia y modificación de los Términos)</h2>
<ul>
<li><p>Estos Términos surten efecto cuando se publican en el Servicio o en scanview.app.</p>
</li>
<li><p>La Empresa puede modificar estos Términos dentro de los límites de la legislación aplicable. En ese caso, anunciará la fecha de entrada en vigor y los cambios en scanview.app o en la Aplicación con al menos 7 días de antelación (30 días si los cambios son desfavorables para los usuarios).</p>
</li>
<li><p>Si no está de acuerdo con los Términos modificados, puede dejar de usar el Servicio y eliminar su cuenta. Si sigue utilizando el Servicio después de la fecha de entrada en vigor, se considerará que acepta los Términos modificados.</p>
</li>
</ul>
<h2>Artículo 3 (Contenido del Servicio)</h2>
<ul>
<li><p>Funciones de la Aplicación como el escaneo y el historial de códigos QR y códigos de barras, la creación de códigos y el inventario. Los datos de estas funciones se guardan únicamente en el dispositivo del usuario.</p>
</li>
<li><p>Envío en vivo al PC para miembros: función que envía los valores escaneados en la Aplicación a una sesión de scanview.app para que puedan consultarse de inmediato en una página web.</p>
</li>
<li><p>Actualmente el Servicio es gratuito. Si se incorporan funciones de pago, la Empresa anunciará con antelación el precio y las condiciones, y solo cobrará con el consentimiento del usuario.</p>
</li>
</ul>
<h2>Artículo 4 (Registro y gestión de la cuenta)</h2>
<ul>
<li><p>El registro es opcional. Para utilizar el envío en vivo al PC es necesario registrarse e iniciar sesión.</p>
</li>
<li><p>Los miembros deben registrarse con información correcta y no pueden utilizar el correo electrónico ni la cuenta de otra persona.</p>
</li>
<li><p>Cada miembro es responsable de su contraseña y de los dispositivos en los que mantiene la sesión iniciada. Si detecta que su cuenta ha sido usada sin autorización, cambie su contraseña de inmediato e informe a la Empresa.</p>
</li>
<li><p>Las personas menores de 14 años no pueden registrarse como miembros.</p>
</li>
</ul>
<h2>Artículo 5 (Sesiones y datos de escaneo)</h2>
<ul>
<li><p>Los derechos y la responsabilidad sobre las sesiones y los datos de escaneo corresponden al miembro que los creó. La Empresa los almacena y trata únicamente en la medida necesaria para prestar el Servicio.</p>
</li>
<li><p>Las sesiones nuevas son <strong>públicas</strong> de forma predeterminada, y cualquier persona que conozca la dirección de una sesión pública puede verla. Si envía códigos que contienen información personal o secretos comerciales, cambie la sesión a privada o establezca una contraseña. La Empresa no se responsabiliza de la exposición derivada de la configuración pública, salvo en caso de dolo o negligencia grave por su parte.</p>
</li>
<li><p>Las sesiones que elimina un miembro se conservan en la papelera durante 30 días y después se eliminan de forma permanente.</p>
</li>
<li><p>La Empresa procura proteger los datos frente a fallos y errores, pero recomienda que el miembro guarde por su cuenta una copia de los datos de escaneo importantes mediante la función de exportación (CSV o Excel).</p>
</li>
</ul>
<h2>Artículo 6 (Conductas prohibidas)</h2>
<p>Los usuarios no deben realizar las siguientes conductas:</p>
<ul>
<li><p>acceder sin permiso a la cuenta o a la sesión de otra persona, o intentar averiguar contraseñas de sesión mediante pruebas aleatorias</p>
</li>
<li><p>obstaculizar el funcionamiento del Servicio enviando solicitudes excesivas a sus servidores o haciendo un uso anómalo mediante herramientas automatizadas</p>
</li>
<li><p>difundir a través de sesiones información ilegal, información personal de terceros o direcciones que lleven a código malicioso</p>
</li>
<li><p>aplicar ingeniería inversa al Servicio, o copiarlo o venderlo sin el permiso de la Empresa</p>
</li>
<li><p>cualquier otra conducta que infrinja la legislación aplicable</p>
</li>
</ul>
<p>Si se confirma alguna de estas conductas, la Empresa puede cambiar la sesión a privada o eliminarla, y restringir el uso de la cuenta. En ese caso, la Empresa informará al miembro del motivo, y el miembro podrá presentar una objeción escribiendo a support@scanview.app.</p>
<h2>Artículo 7 (Modificación e interrupción del Servicio)</h2>
<ul>
<li><p>La Empresa puede modificar o interrumpir parte del Servicio por necesidades operativas o técnicas. Los cambios o interrupciones que afecten de forma importante a los miembros se anunciarán con 30 días de antelación.</p>
</li>
<li><p>En casos inevitables, como mantenimiento de las instalaciones, fallos o desastres naturales, el Servicio puede detenerse temporalmente sin aviso previo.</p>
</li>
<li><p>Si se pone fin a todo el Servicio, la Empresa lo anunciará con al menos 30 días de antelación y permitirá que los miembros exporten sus datos de escaneo durante ese período.</p>
</li>
</ul>
<h2>Artículo 8 (Baja del miembro)</h2>
<ul>
<li><p>El miembro puede darse de baja en cualquier momento desde Configuración → su perfil (Configuración de cuenta) → Eliminar cuenta en la Aplicación, o solicitar la eliminación por correo electrónico siguiendo las indicaciones de la página <a href="https://scanview.app/legal/account-deletion?lang=es" target="_blank" rel="noopener noreferrer">Eliminación de cuenta y datos</a>.</p>
</li>
<li><p>Tras la baja, el inicio de sesión se bloquea de inmediato, y la información de la cuenta y los datos de sesiones y escaneos que queden en el servidor se eliminan de forma permanente en un plazo de 30 días.</p>
</li>
</ul>
<h2>Artículo 9 (Limitación de responsabilidad)</h2>
<ul>
<li><p>Salvo que la legislación aplicable disponga otra cosa, la Empresa no asume responsabilidad en relación con el Servicio, que se ofrece de forma gratuita. Se exceptúan los daños causados por dolo o negligencia grave de la Empresa.</p>
</li>
<li><p>La precisión de los resultados de escaneo puede variar según el estado del código, la iluminación y la cámara del dispositivo. Cuando utilice los resultados para decisiones importantes, como cantidades de inventario o pagos, verifíquelos de nuevo.</p>
</li>
<li><p>La Empresa no se responsabiliza del contenido de los sitios web externos a los que se accede desde las direcciones (URL) escaneadas ni de los daños que se produzcan en esos sitios.</p>
</li>
<li><p>El usuario es responsable de los daños causados por su propio incumplimiento de estos Términos o de la legislación aplicable.</p>
</li>
</ul>
<h2>Artículo 10 (Protección de la información personal)</h2>
<p>La Empresa trata la información personal de los usuarios conforme a la <a href="https://scanview.app/legal/privacy?lang=es" target="_blank" rel="noopener noreferrer">Política de privacidad</a>.</p>
<h2>Artículo 11 (Resolución de conflictos y jurisdicción)</h2>
<ul>
<li><p>Si tiene preguntas o quejas sobre el uso del Servicio, escriba a support@scanview.app. La Empresa responderá en un plazo de 7 días hábiles a partir de la recepción.</p>
</li>
<li><p>Estos Términos se rigen por las leyes de la República de Corea, y cualquier conflicto se resolverá ante el tribunal competente conforme a la Ley de Procedimiento Civil de Corea.</p>
</li>
</ul>
<h2>Disposición adicional</h2>
<p>Estos Términos entran en vigor el 17 de octubre de 2026.</p>
<p>Contacto: support@scanview.app · Operado por Cubion</p>$body$,
  '1.0', true, now()
)
ON CONFLICT (type, locale) DO NOTHING;

INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'privacy', 'ja',
  $title$QRスキャナー プライバシーポリシー$title$,
  $body$<p>Cubion（큐비온、以下「当社」）は、QRスキャナーアプリ（Android・iOS、以下「アプリ」）およびリアルタイムスキャン確認ウェブサービスscanview.app（以下、アプリとあわせて「本サービス」）をご利用の方の個人情報を、韓国の「個人情報保護法」その他の関連法令に従って取り扱い、保護します。本ポリシーはアプリのバージョン1.3.0を基準としており、2026年10月16日から施行します。韓国語版と本日本語版の内容が異なる場合は、韓国語版が優先します。</p>
<h2>1. 概要</h2>
<ul>
<li><p>会員登録をしなくても、スキャン、コード作成、履歴管理などほとんどの機能をご利用いただけます。この場合、スキャン履歴、作成したコード、スキャン写真、設定は<strong>端末内にのみ</strong>保存され、当社のサーバーには送信されません。</p>
</li>
<li><p>アプリには<strong>広告がなく、広告IDを収集しません。</strong></p>
</li>
<li><p>当社のサーバー（scanview.app）に情報が送られるのは、①会員登録・ログインをするとき、②ログインした状態でご自身で<strong>リアルタイムサーバー送信</strong>をオンにしたときに限られます。</p>
</li>
<li><p>使用分析（Firebase Analytics）は、Androidでは初期設定でオン、iOSでは初期設定でオフになっています。<strong>設定 → 情報 → 使用分析の同意</strong>でいつでもオン・オフを切り替えられます。</p>
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
<p>スキャンまたは作成したコードの<strong>内容</strong>、メールアドレス、名前は分析情報として送信せず、広告IDは収集しません。Androidでは初期設定でオンになっており、iOSでは利用者がオンにするまで収集しません。設定 → 情報 → 使用分析の同意でオフにすると、その時点から収集を停止します。</p>
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
</ul>
<h3>2-8. サービスの利用中に自動的に生成される情報</h3>
<p>サーバーに接続する過程で、IPアドレス、アクセス日時、リクエスト記録などのアクセスログがサーバーの運用環境に残ることがあります。この情報はセキュリティと障害対応にのみ使用します。</p>
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
<p>利用者は、使用分析をオフにするか、該当する機能（ログイン、場所の検索）を使わないことで、国外移転を拒否できます。この場合、該当する機能のみ利用できなくなり、その他の機能はそのままご利用いただけます。</p>
<h2>8. 利用者の権利と行使方法</h2>
<p>利用者はいつでも、ご自身の個人情報の閲覧・訂正・削除、または処理の停止を求めることができます。</p>
<ul>
<li><p><strong>閲覧・訂正：</strong>アプリの設定 → プロフィール（アカウント設定）で、名前（ニックネーム）の確認・変更とパスワードの変更ができます。</p>
</li>
<li><p><strong>削除（退会）：</strong>設定 → プロフィール（アカウント設定）→ 危険な操作 → 退会。アプリを使用できない場合は、<a href="https://scanview.app/legal/account-deletion?lang=ja" target="_blank" rel="noopener noreferrer">アカウントとデータの削除について</a>の案内に従ってメールで依頼できます。</p>
</li>
<li><p><strong>使用分析の拒否：</strong>設定 → 情報 → 使用分析の同意をオフにします。</p>
</li>
<li><p><strong>権限の撤回：</strong>端末の設定で、カメラ・位置情報・写真・連絡先・カレンダー・通知の権限をいつでもオフにできます。</p>
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
<li><p>施行日：2026年10月16日</p>
</li>
</ul>$body$,
  '2.0', true, now()
)
ON CONFLICT (type, locale) DO NOTHING;

INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'privacy', 'zh',
  $title$QR扫描器 隐私政策$title$,
  $body$<p>Cubion（큐비온，以下简称"公司"）依照韩国《个人信息保护法》等相关法律法规，处理并保护 QR扫描器应用（Android、iOS，以下简称"应用"）及实时扫描查看网络服务 scanview.app（以下与应用合称"本服务"）用户的个人信息。本政策以应用1.3.0版本为准，自2026年10月16日起施行。韩文版与本中文版内容不一致时，以韩文版为准。</p>
<h2>1. 概要</h2>
<ul>
<li><p>无需注册会员即可使用扫描、生成代码、管理记录等大部分功能。此时，扫描记录、生成的代码、扫描照片和设置<strong>仅保存在设备中</strong>，不会传输到公司服务器。</p>
</li>
<li><p>应用<strong>不含广告，也不收集广告标识符。</strong></p>
</li>
<li><p>信息仅在以下情况下传输到公司服务器（scanview.app）：① 注册会员或登录时；② 在登录状态下由您本人开启<strong>实时服务器传输</strong>时。</p>
</li>
<li><p>使用分析（Firebase Analytics）在 Android 上默认开启，在 iOS 上默认关闭。您可以随时在<strong>设置 → 关于 → 使用分析同意</strong>中关闭或开启。</p>
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
<p>所扫描或生成代码的<strong>内容</strong>、电子邮件和姓名不会作为分析信息发送，也不收集广告标识符。在 Android 上默认开启；在 iOS 上，用户开启之前不会收集。在 设置 → 关于 → 使用分析同意 中关闭后，即从此时起停止收集。</p>
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
</ul>
<h3>2-8. 使用服务过程中自动生成的信息</h3>
<p>在连接服务器的过程中，IP 地址、访问时间、请求记录等访问日志可能会留存在服务器运行环境中。这些信息仅用于安全和故障处理。</p>
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
<p>用户可以通过关闭使用分析或不使用相关功能（登录、地点搜索）来拒绝跨境转移。在这种情况下，仅相关功能无法使用，其他功能仍可照常使用。</p>
<h2>8. 用户的权利及行使方式</h2>
<p>用户可随时要求查阅、更正、删除本人的个人信息或停止处理。</p>
<ul>
<li><p><strong>查阅与更正：</strong>可在应用的 设置 → 个人资料（账户设置）中查看和修改姓名（昵称），以及更改密码。</p>
</li>
<li><p><strong>删除（注销账户）：</strong>设置 → 个人资料（账户设置）→ 危险区域 → 注销账户。如无法使用应用，可按照<a href="https://scanview.app/legal/account-deletion?lang=zh" target="_blank" rel="noopener noreferrer">账户与数据删除说明</a>通过电子邮件申请。</p>
</li>
<li><p><strong>拒绝使用分析：</strong>关闭 设置 → 关于 → 使用分析同意。</p>
</li>
<li><p><strong>撤回权限：</strong>可随时在设备设置中关闭相机、位置、照片、通讯录、日历、通知权限。</p>
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
<li><p>施行日期：2026年10月16日</p>
</li>
</ul>$body$,
  '2.0', true, now()
)
ON CONFLICT (type, locale) DO NOTHING;

INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'privacy', 'es',
  $title$Política de privacidad de QR Scanner$title$,
  $body$<p>Cubion (큐비온, en adelante, la "Empresa") trata y protege la información personal de las personas que utilizan la aplicación QR Scanner (Android e iOS, en adelante, la "Aplicación") y el servicio web de visualización de escaneos en tiempo real scanview.app (junto con la Aplicación, en adelante, el "Servicio") de conformidad con la Ley de Protección de Información Personal de Corea y demás normativa aplicable. Esta política corresponde a la versión 1.3.0 de la Aplicación y entra en vigor el 16 de octubre de 2026. Si la versión en coreano y esta versión en español difieren, prevalecerá la versión en coreano.</p>
<h2>1. Resumen</h2>
<ul>
<li><p>Puede usar la mayoría de las funciones, como escanear, crear códigos y gestionar el historial, sin registrarse. En ese caso, el historial de escaneos, los códigos creados, las fotos de escaneo y la configuración se guardan <strong>solo en su dispositivo</strong> y no se envían al servidor de la Empresa.</p>
</li>
<li><p>La Aplicación <strong>no contiene anuncios ni recopila el ID de publicidad.</strong></p>
</li>
<li><p>La información solo llega al servidor de la Empresa (scanview.app) cuando ① se registra o inicia sesión, o ② activa usted mismo la <strong>Sincronización en tiempo real</strong> con la sesión iniciada.</p>
</li>
<li><p>El análisis de uso (Firebase Analytics) está activado de forma predeterminada en Android y desactivado de forma predeterminada en iOS. Puede activarlo o desactivarlo en cualquier momento en <strong>Configuración → Información → Consentimiento de análisis</strong>.</p>
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
<p>No enviamos como datos de análisis el <strong>contenido</strong> de los códigos que escanea o crea, ni su correo electrónico ni su nombre, y no recopilamos el ID de publicidad. En Android está activado de forma predeterminada; en iOS no se recopila nada hasta que usted lo active. Si lo desactiva en Configuración → Información → Consentimiento de análisis, la recopilación se detiene a partir de ese momento.</p>
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
</ul>
<h3>2-8. Información generada automáticamente durante el uso del Servicio</h3>
<p>Al conectarse al servidor, pueden quedar registros de acceso, como la dirección IP, la fecha y hora de acceso y el historial de solicitudes, en el entorno de operación del servidor. Esta información se usa únicamente para la seguridad y la resolución de incidencias.</p>
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
<p>Puede negarse a estas transferencias internacionales desactivando el análisis de uso o no utilizando las funciones correspondientes (inicio de sesión y búsqueda de lugares). En ese caso, solo dejarán de estar disponibles dichas funciones y podrá seguir usando las demás con normalidad.</p>
<h2>8. Derechos del usuario y cómo ejercerlos</h2>
<p>Puede solicitar en cualquier momento el acceso, la rectificación o la eliminación de su información personal, o la suspensión de su tratamiento.</p>
<ul>
<li><p><strong>Acceso y rectificación:</strong> en la Aplicación, en Configuración → su perfil (Configuración de cuenta), puede consultar y modificar su nombre (apodo) y cambiar su contraseña.</p>
</li>
<li><p><strong>Eliminación (baja):</strong> Configuración → su perfil (Configuración de cuenta) → Zona de peligro → Eliminar cuenta. Si no puede usar la Aplicación, puede solicitarla por correo electrónico siguiendo las indicaciones de la página <a href="https://scanview.app/legal/account-deletion?lang=es" target="_blank" rel="noopener noreferrer">Eliminación de cuenta y datos</a>.</p>
</li>
<li><p><strong>Rechazo del análisis de uso:</strong> desactive Configuración → Información → Consentimiento de análisis.</p>
</li>
<li><p><strong>Retirada de permisos:</strong> puede desactivar en cualquier momento los permisos de cámara, ubicación, fotos, contactos, calendario y notificaciones en la configuración del dispositivo.</p>
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
<li><p>Fecha de entrada en vigor: 16 de octubre de 2026</p>
</li>
</ul>$body$,
  '2.0', true, now()
)
ON CONFLICT (type, locale) DO NOTHING;

COMMIT;

SELECT type, locale, is_published FROM legal_documents ORDER BY type, locale;
