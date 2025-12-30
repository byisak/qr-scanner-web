# PostgreSQL Database 설정 가이드

## 1. PostgreSQL 설치 (Ubuntu)

```bash
# PostgreSQL 설치
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL 서비스 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 2. 데이터베이스 및 사용자 생성

```bash
# PostgreSQL 접속
sudo -u postgres psql

# 데이터베이스 생성
CREATE DATABASE qrscanner;

# 사용자 생성 및 비밀번호 설정
CREATE USER qrscanner_user WITH ENCRYPTED PASSWORD 'your_secure_password';

# 권한 부여
GRANT ALL PRIVILEGES ON DATABASE qrscanner TO qrscanner_user;

# 종료
\q
```

## 3. 스키마 생성

```bash
# 데이터베이스에 접속
psql -U qrscanner_user -d qrscanner -h localhost

# schema.sql 실행
\i schema.sql
```

또는 직접 실행:

```bash
psql -U qrscanner_user -d qrscanner -h localhost -f schema.sql
```

## 4. 환경 변수 설정

`.env.local` 파일 생성:

```bash
# PostgreSQL 연결 정보
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=qrscanner
POSTGRES_USER=qrscanner_user
POSTGRES_PASSWORD=your_secure_password

# JWT 인증
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 서버 설정
NODE_ENV=production
HOSTNAME=0.0.0.0
PORT=3000
```

## 5. 원격 연결 설정 (필요한 경우)

### pg_hba.conf 수정

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

다음 줄 추가:
```
host    qrscanner       qrscanner_user  0.0.0.0/0       md5
```

### postgresql.conf 수정

```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```

다음 설정 변경:
```
listen_addresses = '*'
```

### PostgreSQL 재시작

```bash
sudo systemctl restart postgresql
```

## 6. 연결 테스트

```bash
# 로컬 연결 테스트
psql -U qrscanner_user -d qrscanner -h localhost

# 서버 실행
npm run dev

# 로그 확인
✅ PostgreSQL DB 연결 풀 생성 성공
> Ready on http://0.0.0.0:3000
```

## 7. 문제 해결

### 연결 실패 시

```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U qrscanner_user -d qrscanner -h localhost

# 로그 확인
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 일반적인 오류

**FATAL: password authentication failed**
- 비밀번호 확인
- pg_hba.conf 설정 확인

**FATAL: database "qrscanner" does not exist**
- 데이터베이스 생성 확인
- 데이터베이스 이름 확인

**Connection refused**
- PostgreSQL 서비스 실행 여부 확인
- 포트 번호 확인 (기본: 5432)
- 방화벽 설정 확인

## 8. 보안 권장사항

1. **.env.local 파일 보호**
   ```bash
   chmod 600 .env.local
   ```

2. **Git에서 제외**
   - `.env.local`은 `.gitignore`에 포함됨
   - 절대 커밋하지 말 것!

3. **프로덕션 환경**
   - 환경 변수는 서버 설정에서 관리
   - 강력한 비밀번호 사용
   - SSL 연결 사용 권장

## 9. 데이터베이스 관리

### 세션 정리 (오래된 세션 삭제)
```sql
DELETE FROM sessions WHERE last_activity < NOW() - INTERVAL '1 day';
```

### 백업
```bash
# 전체 백업
pg_dump -U qrscanner_user -d qrscanner > backup.sql

# 복원
psql -U qrscanner_user -d qrscanner < backup.sql
```

### 데이터베이스 상태 확인
```sql
-- 테이블 목록
\dt

-- 세션 수
SELECT COUNT(*) FROM sessions;

-- 스캔 데이터 수
SELECT COUNT(*) FROM scan_data;

-- 사용자 수
SELECT COUNT(*) FROM users;
```

## 10. npm 패키지 설치

```bash
npm install
```

필요한 패키지:
- `pg`: PostgreSQL 클라이언트
- `@types/pg`: TypeScript 타입 정의
