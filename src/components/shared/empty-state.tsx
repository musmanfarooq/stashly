import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
