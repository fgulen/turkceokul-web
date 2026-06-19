'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { HelpCircle, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChatMessages, type Message } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useAuthStore } from '@/stores/auth';

const API_URL =
  typeof window !== 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5221');

const SESSION_KEY = 'helpChat';
const SEEN_KEY = 'helpChatSeen';

function loadMessages(): Message[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function HelpChat() {
  const [open, setOpen] = useState(false);
  const [showBalon, setShowBalon] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY);
    if (!seen) {
      const t = setTimeout(() => setShowBalon(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
    }, 300);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [messages]);

  const handleOpen = () => {
    setOpen(true);
    setShowBalon(false);
    localStorage.setItem(SEEN_KEY, '1');
  };

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = { rol: 'user', icerik: text };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setStreaming(true);

      const placeholderIdx = nextMessages.length;
      setMessages((prev) => [...prev, { rol: 'assistant', icerik: '' }]);

      try {
        const { accessToken } = useAuthStore.getState();
        const response = await fetch(`${API_URL}/api/ai/yardim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ mesajlar: nextMessages }),
        });

        if (!response.ok || !response.body) {
          throw new Error('API yanıt hatası');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const token: string = JSON.parse(line.slice(6));
              accumulated += token;
              setMessages((prev) => {
                const updated = [...prev];
                updated[placeholderIdx] = { rol: 'assistant', icerik: accumulated };
                return updated;
              });
            } catch {
              /* skip malformed */
            }
          }
        }
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          updated[placeholderIdx] = {
            rol: 'assistant',
            icerik: 'Bir hata oluştu. Lütfen tekrar deneyin.',
          };
          return updated;
        });
      } finally {
        setStreaming(false);
      }
    },
    [messages]
  );

  return (
    <>
      {showBalon && !open && (
        <div className="fixed bottom-20 right-5 z-50 bg-popover border rounded-xl shadow-lg px-4 py-3 text-sm max-w-[220px] animate-in slide-in-from-bottom-2">
          <button
            className="absolute -top-2 -right-2 bg-muted rounded-full p-0.5"
            onClick={() => {
              setShowBalon(false);
              localStorage.setItem(SEEN_KEY, '1');
            }}
            aria-label="Kapat"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="font-medium mb-1">Merhaba! 👋</p>
          <p className="text-muted-foreground">
            Nasıl kullanacağınızı sormak ister misiniz?
          </p>
          <button
            className="mt-2 text-primary underline underline-offset-2 text-xs"
            onClick={handleOpen}
          >
            Evet, sormak istiyorum →
          </button>
        </div>
      )}

      <Button
        size="icon"
        variant="secondary"
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg"
        onClick={handleOpen}
        aria-label="Yardım chat'ini aç"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[380px] sm:w-[420px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <SheetTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              AI Stüdyo Yardım
            </SheetTitle>
          </SheetHeader>

          <ChatMessages messages={messages} />
          <ChatInput onSend={handleSend} disabled={streaming} />
        </SheetContent>
      </Sheet>
    </>
  );
}
