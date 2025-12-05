# Oracle Database 설정 가이드

## 1. 데이터베이스 스키마 생성

Oracle Cloud Console에서 SQL 실행:

1. **Oracle Cloud Console 접속**
   - https://cloud.oracle.com 로그인
   - Autonomous Database → `qrcodedb` 선택
   - "Database Actions" → "SQL" 클릭

2. **스키마 실행**
   - `schema.sql` 파일의 내용을 복사
   - SQL 워크시트에 붙여넣기
   - 실행 (Run Script 버튼)

```sql
-- schema.sql 내용 실행
CREATE TABLE sessions ( ... );
CREATE TABLE scan_data ( ... );
CREATE INDEX idx_scan_session ON scan_data(session_id);
...
```

## 2. 연결 정보 확인

### Option 1: TLS 연결 (권장)

Oracle Cloud Console에서:
1. Autonomous Database → `qrcodedb` 선택
2. "DB Connection" 버튼 클릭
3. "TLS" 탭 선택
4. Connection String 복사 (예: qrcodedb_high)

### Option 2: Wallet 다운로드

1. "Wallet" 탭 선택
2. "Download Wallet" 클릭
3. 비밀번호 설정 및 다운로드
4. 압축 해제 후 `TNS_ADMIN` 환경 변수 설정

## 3. 환경 변수 설정

`.env.local` 파일 수정:

```bash
# Oracle Database 연결 정보
ORACLE_USER=ADMIN
ORACLE_PASSWORD=실제-비밀번호

# TLS 연결 문자열 (Option 1)
ORACLE_CONNECTION_STRING=(description=(retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.ap-osaka-1.oraclecloud.com))(connect_data=(service_name=qrcodedb_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))

# 또는 Wallet 사용 시 (Option 2)
ORACLE_CONNECTION_STRING=qrcodedb_high
```

## 4. Oracle Instant Client 설치 (Linux 서버)

```bash
# Oracle Instant Client 다운로드
wget https://download.oracle.com/otn_software/linux/instantclient/2115000/instantclient-basic-linux.x64-21.15.0.0.0dbru.zip

# 압축 해제
unzip instantclient-basic-linux.x64-21.15.0.0.0dbru.zip

# 환경 변수 설정
export LD_LIBRARY_PATH=/path/to/instantclient_21_15:$LD_LIBRARY_PATH

# Wallet 사용 시 (Option 2)
export TNS_ADMIN=/path/to/wallet
```

## 5. 연결 테스트

```bash
# 서버 실행
npm run dev

# 로그 확인
✅ Oracle DB 연결 풀 생성 성공
> Ready on http://0.0.0.0:3000
```

## 6. 문제 해결

### 연결 실패 시

```bash
# 1. Instant Client 경로 확인
echo $LD_LIBRARY_PATH

# 2. TNS_ADMIN 확인 (Wallet 사용 시)
echo $TNS_ADMIN
ls $TNS_ADMIN/tnsnames.ora

# 3. 연결 문자열 테스트
sqlplus ADMIN/password@connection_string
```

### 일반적인 오류

**ORA-12541: TNS:no listener**
- Connection String이 잘못되었거나 네트워크 문제
- ACL 설정 확인 (Oracle Cloud Console)

**ORA-01017: invalid username/password**
- 비밀번호 확인
- ADMIN 계정 잠금 여부 확인

**DPI-1047: Cannot locate a 64-bit Oracle Client library**
- Oracle Instant Client 미설치
- LD_LIBRARY_PATH 미설정

## 7. 보안 권장사항

1. **.env.local 파일 보호**
   ```bash
   chmod 600 .env.local
   ```

2. **Git에서 제외**
   - `.env.local`은 `.gitignore`에 포함됨
   - 절대 커밋하지 말 것!

3. **프로덕션 환경**
   - 환경 변수는 서버 설정에서 관리
   - Secrets Manager 사용 권장

## 8. 데이터베이스 관리

### 세션 정리 (오래된 세션 삭제)
```sql
DELETE FROM sessions WHERE last_activity < SYSDATE - 1;
```

### 백업
- Oracle Autonomous Database는 자동 백업 (60일 보관)
- 수동 백업: Database Actions → Backup

### 모니터링
- Performance Hub에서 실시간 모니터링
- SQL 성능 분석 가능
