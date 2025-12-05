'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  name: string;
}

interface AppSidebarProps {
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
}

export function AppSidebar({ currentSessionId, onSessionSelect }: AppSidebarProps) {
  const [sessionInput, setSessionInput] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionInput.trim()) {
      const newSession: Session = {
        id: sessionInput.trim(),
        name: sessionInput.trim(),
      };

      // 중복 체크
      if (!sessions.find(s => s.id === newSession.id)) {
        setSessions([...sessions, newSession]);
      }

      setSessionInput('');
      onSessionSelect(newSession.id);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">QR Scanner</h2>
      </div>

      {/* Session Input */}
      <div className="border-b p-4">
        <form onSubmit={handleAddSession} className="space-y-2">
          <Input
            placeholder="세션 ID 입력..."
            value={sessionInput}
            onChange={(e) => setSessionInput(e.target.value)}
          />
          <Button type="submit" className="w-full" size="sm">
            세션 추가
          </Button>
        </form>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              세션을 추가하세요
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  currentSessionId === session.id && "bg-accent text-accent-foreground"
                )}
              >
                <div className="font-medium">{session.name}</div>
                <div className="text-xs text-muted-foreground">ID: {session.id}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
