'use client';

import { createContext, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetCtx {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = createContext<SheetCtx>({ open: false, onOpenChange: () => {} });

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onOpenChange(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {createPortal(
        <>
          <div
            className={cn(
              'fixed inset-0 z-50 bg-black/80 transition-opacity duration-300',
              open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          {children}
        </>,
        document.body
      )}
    </SheetContext.Provider>
  );
}

interface SheetContentProps {
  side?: 'right' | 'left' | 'top' | 'bottom';
  className?: string;
  children: React.ReactNode;
}

function SheetContent({ side = 'right', className, children }: SheetContentProps) {
  const { open, onOpenChange } = useContext(SheetContext);

  const slideClass = {
    right: open ? 'translate-x-0' : 'translate-x-full',
    left: open ? 'translate-x-0' : '-translate-x-full',
    top: open ? 'translate-y-0' : '-translate-y-full',
    bottom: open ? 'translate-y-0' : 'translate-y-full',
  }[side];

  const posClass = {
    right: 'inset-y-0 right-0 h-full border-l',
    left: 'inset-y-0 left-0 h-full border-r',
    top: 'inset-x-0 top-0 border-b',
    bottom: 'inset-x-0 bottom-0 border-t',
  }[side];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed z-50 bg-background shadow-lg transition-transform duration-300 ease-in-out',
        posClass,
        slideClass,
        className
      )}
    >
      <button
        onClick={() => onOpenChange(false)}
        className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring z-10"
        aria-label="Kapat"
      >
        <X className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5', className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription };
