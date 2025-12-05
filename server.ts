import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const dev = process.env.NODE_ENV !== 'production';
// 0.0.0.0: 모든 네트워크 인터페이스에서 접속 허용 (원격 접속 가능)
// localhost: 로컬 접속만 허용
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// 세션 및 스캔 데이터 저장소 (메모리)
const activeSessions = new Map();
const scanDataStore = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.IO 서버 초기화
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('클라이언트 연결:', socket.id);

    // 세션 생성
    socket.on('create-session', async (data) => {
      try {
        const sessionId = data?.sessionId || uuidv4();

        activeSessions.set(sessionId, {
          socketId: socket.id,
          createdAt: new Date(),
          lastActivity: new Date(),
        });

        scanDataStore.set(sessionId, []);

        socket.join(sessionId);

        socket.emit('session-created', {
          sessionId,
          message: '세션이 생성되었습니다.',
        });

        console.log('새 세션 생성:', sessionId);
      } catch (err) {
        console.error('세션 생성 실패:', err);
        socket.emit('error', { message: '세션 생성 실패' });
      }
    });

    // 세션 참가
    socket.on('join-session', async (sessionId) => {
      try {
        if (!activeSessions.has(sessionId)) {
          socket.emit('error', { message: '세션을 찾을 수 없습니다.' });
          return;
        }

        socket.join(sessionId);

        const existingScans = scanDataStore.get(sessionId) || [];

        socket.emit('session-joined', {
          sessionId,
          existingData: existingScans,
        });

        console.log('클라이언트 세션 참가:', sessionId);
      } catch (err) {
        console.error('세션 참가 실패:', err);
        socket.emit('error', { message: '세션 참가 실패' });
      }
    });

    // 스캔 데이터 수신
    socket.on('scan-data', async (payload) => {
      try {
        const { sessionId, code, timestamp } = payload;

        if (!sessionId || !code) {
          socket.emit('error', { message: '잘못된 데이터 형식' });
          return;
        }

        if (activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId);
          session.lastActivity = new Date();
          activeSessions.set(sessionId, session);
        }

        const scanRecord = {
          id: Date.now(),
          sessionId,
          code,
          scan_timestamp: timestamp || Date.now(),
          createdAt: new Date().toISOString(),
        };

        if (!scanDataStore.has(sessionId)) {
          scanDataStore.set(sessionId, []);
        }
        const scans = scanDataStore.get(sessionId);
        scans.push(scanRecord);
        scanDataStore.set(sessionId, scans);

        // 모든 클라이언트에게 브로드캐스트
        io.to(sessionId).emit('new-scan', scanRecord);

        socket.emit('scan-received', {
          success: true,
          code,
        });

        const dateObject = new Date(timestamp);
        const kstDate = dateObject.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

        console.log('새 스캔 데이터:', '스캔값:', code, '세션ID:', sessionId, '스캔시간:', kstDate);
      } catch (err) {
        console.error('스캔 데이터 저장 실패:', err);
        socket.emit('error', { message: '데이터 저장 실패' });
      }
    });

    socket.on('disconnect', () => {
      console.log('클라이언트 연결 해제:', socket.id);
    });
  });

  // 전역으로 세션 데이터 접근 가능하도록 설정
  (global as any).activeSessions = activeSessions;
  (global as any).scanDataStore = scanDataStore;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
