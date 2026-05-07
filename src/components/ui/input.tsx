import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none",
        "focus:border-ring focus:ring-2 focus:ring-ring/30",
        "placeholder:text-muted-foreground transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}
