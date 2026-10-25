import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 rounded-md font-display text-lg font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-foreground">
        <Trophy className="size-4" aria-hidden />
      </span>
      Arena
    </Link>
  );
}
