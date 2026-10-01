import { cn } from "@/lib/cn";

export default function Skeleton({ className }: { className?: string }) {
    return <div className={cn("rounded-md bg-surface-2 animate-pulse", className)} aria-hidden="true" />;
}
