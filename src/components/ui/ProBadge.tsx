import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Kilitli (Kurumsal Pro gerektiren) buton/format/özelliklerin yanına eklenen küçük rozet. */
export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300',
        'text-amber-950 text-[10px] font-bold px-1.5 py-0.5 leading-none shrink-0',
        className,
      )}
    >
      <Star className="size-2.5 fill-current" />
      PRO
    </span>
  );
}
