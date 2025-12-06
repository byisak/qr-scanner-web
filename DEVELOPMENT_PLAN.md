# QR Scanner Web - 개발 계획

## 📋 목차
1. [현재 상태](#현재-상태)
2. [개발 방향](#개발-방향)
3. [Phase별 개발 계획](#phase별-개발-계획)
4. [기술 스택](#기술-스택)

---

## 현재 상태

### ✅ 완료된 기능
- **QR 스캔 앱 → 서버 전송** (Socket.IO)
- **웹에서 실시간 확인** (Socket.IO 실시간 업데이트)
- **Oracle Autonomous Database 연동** (데이터 영구 저장)
- **세션 기반 데이터 관리** (세션별 스캔 데이터 저장)
- **원격 접속 지원** (http://138.2.58.102:3000)
- **링크 공유** (http://138.2.58.102:3000/session/세션ID)
- **shadcn/ui 기반 UI** (사이드바, 대시보드)

### 📊 데이터 구조
```sql
sessions (세션 정보)
├── session_id (세션 ID)
├── socket_id (소켓 ID)
├── created_at (생성 시간)
├── last_activity (마지막 활동 시간)
└── status (상태: ACTIVE)

scan_data (스캔 데이터)
├── id (고유 ID)
├── session_id (세션 ID - FK)
├── code (QR 코드 값)
├── scan_timestamp (스캔 시간)
└── created_at (DB 저장 시간)
```

---

## 개발 방향

### 🎯 핵심 컨셉
**"간편한 시작, 필요시 확장"**
- 로그인 없이 즉시 사용 가능 (익명 링크 공유)
- 필요시 계정 생성하여 세션 관리
- 삭제된 데이터 복구 가능 (30일 보관)

### 🔄 데이터 흐름
```
앱(스캔) → Socket.IO → 서버 → Oracle DB
                          ↓
                      Socket.IO
                          ↓
                    웹(실시간 확인)
```

### 🗑️ 삭제 정책
- **Soft Delete**: 삭제 시 상태만 변경 (DELETED)
- **30일 보관**: 삭제 후 30일간 복구 가능
- **자동 정리**: 30일 후 완전 삭제
- **양방향 동기화**: 앱/웹 어디서든 삭제 가능

---

## Phase별 개발 계획

## Phase 1: 삭제 및 복구 시스템 (우선순위: 높음)

### 1.1 데이터베이스 스키마 확장
```sql
-- sessions 테이블 확장
ALTER TABLE sessions ADD (
  status VARCHAR2(50) DEFAULT 'ACTIVE',  -- ACTIVE, DELETED, EXPIRED
  deleted_at TIMESTAMP,                   -- 삭제 시간
  deleted_by VARCHAR2(255),               -- 삭제 주체 (app/web)
  user_id VARCHAR2(255)                   -- 소유자 ID (나중에 사용)
);

-- 인덱스 추가
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_deleted_at ON sessions(deleted_at);
```

### 1.2 API 엔드포인트 구현

#### DELETE /api/sessions/[sessionId]/route.ts
**기능**: 세션 Soft Delete
```typescript
- status = 'DELETED'
- deleted_at = CURRENT_TIMESTAMP
- deleted_by = 'web' or 'app'
- 연관된 scan_data는 유지 (복구 시 함께 복구)
```

#### POST /api/sessions/[sessionId]/restore/route.ts
**기능**: 세션 복구
```typescript
- status = 'ACTIVE'
- deleted_at = NULL
- deleted_by = NULL
```

#### GET /api/sessions/deleted/route.ts
**기능**: 삭제된 세션 목록 조회
```typescript
- status = 'DELETED'
- deleted_at > SYSDATE - 30 (30일 이내)
- 세션 정보 + 스캔 개수 반환
```

#### DELETE /api/sessions/[sessionId]/permanent/route.ts
**기능**: 영구 삭제
```typescript
- scan_data 먼저 삭제 (FK 제약)
- sessions 삭제
- 복구 불가
```

### 1.3 웹 UI 구현

#### 대시보드 탭 추가
```
[활성 세션] [삭제된 세션]
```

#### 삭제된 세션 목록 페이지
```
┌─────────────────────────────────────────────────────┐
│ 삭제된 세션                                          │
├─────────────┬────────────┬──────────┬───────────────┤
│ 세션 ID      │ 삭제 일시   │ 남은 기간 │ 작업          │
├─────────────┼────────────┼──────────┼───────────────┤
│ n6PhZ1SD    │ 3일 전     │ 27일     │ [복구] [삭제]  │
│ aBc123Xy    │ 10일 전    │ 20일     │ [복구] [삭제]  │
└─────────────┴────────────┴──────────┴───────────────┘
```

#### 삭제 확인 다이얼로그
```
┌──────────────────────────────────────┐
│ 세션 삭제                             │
│                                      │
│ 세션 "n6PhZ1SD"를 삭제하시겠습니까?    │
│ 30일 이내에 복구할 수 있습니다.        │
│                                      │
│           [취소]  [삭제]              │
└──────────────────────────────────────┘
```

### 1.4 앱 기능 추가 (나중에)
- 세션 삭제 API 호출
- 삭제된 세션 보관함
- 복구 기능

**예상 소요 시간**: 3-5일

---

## Phase 2: 세션 관리 기능 강화 (우선순위: 중간)

### 2.1 세션 메타데이터 추가
```sql
ALTER TABLE sessions ADD (
  session_name VARCHAR2(255),     -- 세션 이름 (사용자 지정)
  description VARCHAR2(1000),      -- 설명
  is_public NUMBER(1) DEFAULT 1,   -- 공개 여부 (1=공개, 0=비공개)
  expires_at TIMESTAMP,            -- 자동 만료 시간
  created_from VARCHAR2(50)        -- 생성 출처 (app/web)
);
```

### 2.2 기능 구현

#### 세션 이름 변경
- PUT /api/sessions/[sessionId]/route.ts
- session_name, description 업데이트

#### 세션 만료 설정
- 7일/30일/영구 선택
- Cron Job으로 만료된 세션 자동 정리

#### 링크 공유 기능
- 웹에서 "링크 복사" 버튼
- 클립보드에 복사
- QR 코드 생성 (선택사항)

#### 세션 통계
- 총 스캔 개수
- 마지막 스캔 시간
- 활동 그래프 (시간별 스캔 추이)

**예상 소요 시간**: 5-7일

---

## Phase 3: 사용자 인증 시스템 (우선순위: 낮음)

### 3.1 인증 방식 선택

#### 옵션 A: NextAuth.js (추천)
```typescript
providers: [
  GoogleProvider,
  CredentialsProvider (이메일/비밀번호)
]
```

#### 옵션 B: Clerk (간편함)
```typescript
import { ClerkProvider } from "@clerk/nextjs"
```

### 3.2 데이터베이스 스키마
```sql
-- 사용자 테이블
CREATE TABLE users (
  user_id VARCHAR2(255) PRIMARY KEY,
  email VARCHAR2(255) UNIQUE NOT NULL,
  name VARCHAR2(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- sessions 테이블에 user_id FK 추가
ALTER TABLE sessions ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id) REFERENCES users(user_id);
```

### 3.3 기능 구현

#### 앱 로그인
- 구글/애플 소셜 로그인
- 세션 생성 시 user_id 자동 연결

#### 웹 대시보드
- 로그인 후 내 모든 세션 보기
- 세션 검색/필터
- 세션 정렬 (최신순, 스캔 많은 순)

#### 세션 소유권 관리
```typescript
// 익명 세션을 내 계정에 추가
POST /api/sessions/:sessionId/claim
{
  sessionId: "n6PhZ1SD",
  userId: "user123"
}
```

**예상 소요 시간**: 7-10일

---

## Phase 4: 고급 기능 (우선순위: 낮음)

### 4.1 팀/그룹 기능
- 세션 공유 (팀원에게 권한 부여)
- 역할 기반 접근 제어 (관리자/뷰어)

### 4.2 데이터 분석
- 스캔 통계 대시보드
- CSV/Excel 내보내기
- 시간대별 활동 분석

### 4.3 알림 시스템
- 새 스캔 알림 (웹 푸시)
- 이메일 알림 (선택사항)
- 세션 만료 알림

### 4.4 모바일 최적화
- PWA (Progressive Web App)
- 오프라인 지원
- 모바일 반응형 UI 개선

**예상 소요 시간**: 각 기능별 3-5일

---

## 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: React Hooks (useState, useEffect)
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Next.js API Routes + Custom Server
- **Real-time**: Socket.IO Server
- **Database**: Oracle Autonomous Database (19c)
- **ORM**: oracledb (Native Driver)

### Infrastructure
- **Server**: Oracle Cloud (138.2.58.102)
- **Database**: Oracle Autonomous Database (qrcodedb)
- **Port**: 3000
- **Protocol**: WebSocket (Socket.IO) + HTTP

### Development Tools
- **Package Manager**: npm
- **Build Tool**: Next.js Turbopack
- **Type Checking**: TypeScript
- **Code Formatting**: ESLint
- **Version Control**: Git

---

## 다음 단계

### 즉시 시작 (이번 주)
1. ✅ Oracle DB ACL 설정 완료
2. ⏳ 데이터베이스 스키마 확장 (status, deleted_at 추가)
3. ⏳ 세션 삭제 API 구현
4. ⏳ 세션 복구 API 구현

### 다음 주
1. 삭제된 세션 목록 UI 구현
2. 세션 삭제 확인 다이얼로그 추가
3. 테스트 및 버그 수정

### 2주 후
1. 세션 이름 변경 기능
2. 링크 복사 기능
3. 세션 통계 표시

---

## 참고사항

### 데이터 보관 정책
- **활성 세션**: 무제한 보관
- **삭제된 세션**: 30일 보관 후 자동 삭제
- **만료된 세션**: 설정한 기간 후 자동 삭제

### 보안 고려사항
- 세션 ID는 UUID v4 (예측 불가능)
- Oracle DB는 TLS 암호화 연결
- ACL로 IP 주소 제한
- 향후 인증 추가 시 JWT 사용 예정

### 성능 최적화
- Oracle Connection Pool (poolMin: 2, poolMax: 10)
- 인덱스 활용 (session_id, status, deleted_at)
- Socket.IO Room 기반 메시지 전송
- Next.js 캐싱 활용

---

**작성일**: 2025-12-06
**버전**: 1.0
**작성자**: Claude (AI Assistant)
