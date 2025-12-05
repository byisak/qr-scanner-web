# QR Scanner Web

Next.js 14 기반 실시간 바코드 스캔 데이터 모니터링 웹 애플리케이션

## 🚀 기술 스택

- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Real-time**: Socket.IO
- **Language**: TypeScript
- **Database**: Oracle Cloud (준비됨, 현재 메모리 사용)

## 📁 프로젝트 구조

```
qr-scanner-web/
├── app/
│   ├── api/
│   │   └── sessions/          # REST API
│   ├── dashboard/             # 대시보드 페이지
│   ├── session/[sessionId]/   # 세션 상세 페이지
│   └── page.tsx               # 홈 페이지
├── components/
│   └── ui/                    # shadcn/ui 컴포넌트
├── hooks/
│   └── use-socket.ts          # Socket.IO 클라이언트 훅
├── lib/
│   └── utils.ts               # 유틸리티 함수
├── types/
│   └── index.ts               # TypeScript 타입 정의
└── server.ts                  # Custom Next.js 서버 (Socket.IO)
```

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가:

```env
# Oracle Cloud Autonomous DB
ORACLE_USER=your_user
ORACLE_PASSWORD=your_password
ORACLE_CONNECTION_STRING=your_connection_string

# 서버 설정
PORT=3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

## 📱 모바일 앱 연동

### 앱에서 세션 생성
모바일 앱(React Native)에서 세션 URL을 생성하면 자동으로 Socket.IO 세션이 생성됩니다.

### 웹에서 모니터링
1. 웹 대시보드에서 활성 세션 확인
2. 세션을 클릭하여 실시간 스캔 데이터 모니터링
3. 스캔된 바코드가 실시간으로 테이블에 표시됨

## 🔌 Socket.IO 이벤트

### 클라이언트 → 서버
- `create-session`: 새 세션 생성
- `join-session`: 기존 세션 참가
- `scan-data`: 바코드 스캔 데이터 전송

### 서버 → 클라이언트
- `session-created`: 세션 생성 완료
- `session-joined`: 세션 참가 완료
- `new-scan`: 새로운 스캔 데이터 브로드캐스트
- `scan-received`: 스캔 데이터 수신 확인

## 📡 REST API

### GET /api/sessions
활성 세션 목록 조회

**응답:**
```json
[
  {
    "session_id": "abc123",
    "created_at": "2025-01-01T00:00:00.000Z",
    "last_activity": "2025-01-01T00:00:00.000Z",
    "status": "ACTIVE",
    "scan_count": 5
  }
]
```

### GET /api/sessions/:sessionId/scans
특정 세션의 스캔 데이터 조회

**응답:**
```json
[
  {
    "id": 1234567890,
    "sessionId": "abc123",
    "code": "1234567890123",
    "scan_timestamp": 1234567890000,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

## 🎨 shadcn/ui 컴포넌트

프로젝트에 포함된 컴포넌트:
- Button
- Card (Card, CardHeader, CardTitle, CardDescription, CardContent)
- Table (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
- Badge
- Separator

## 🗄️ 데이터베이스 연동 (준비됨)

현재는 메모리 기반 저장소를 사용하지만, Oracle DB 연동을 위한 설정이 준비되어 있습니다.

`lib/db.ts` 파일을 생성하여 DB 연결 로직을 추가하고, `server.ts`에서 메모리 Map을 DB 쿼리로 교체하면 됩니다.

## 📝 라이선스

Private

## 👨‍💻 개발자

byisak
