'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface Message {
  rol: 'user' | 'assistant';
  icerik: string;
}

interface Props {
  messages: Message[];
}

export function ChatMessages({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
        Merhaba! Platform hakkında aklınıza takılan her şeyi sorabilirsiniz.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={cn('flex', msg.rol === 'user' ? 'justify-end' : 'justify-start')}
        >
          <div
            className={cn(
              'max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
              msg.rol === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted rounded-bl-sm'
            )}
          >
            {msg.icerik}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
