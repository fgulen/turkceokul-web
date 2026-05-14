import { cn } from '@/lib/utils';

const sizes = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
};

export function Logo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={cn('inline-flex items-baseline font-bold leading-none select-none', sizes[size], className)}>
      <span className="text-primary font-black">[</span>
      <span className="text-foreground tracking-tight">TÜRKÇEOKULU</span>
      <span className="text-primary font-black">]</span>
    </span>
  );
}
