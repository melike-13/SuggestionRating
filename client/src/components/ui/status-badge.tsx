import { Badge } from "@/components/ui/badge";
import { Status, statusLabels } from "@shared/schema";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants: Record<Status, "success" | "warning" | "info" | "danger" | "secondary"> = {
    new: "secondary",
    under_review: "warning",
    approved: "success",
    implemented: "info",
    rejected: "danger",
  };

  return (
    <Badge variant={variants[status]} className={className}>
      {statusLabels[status]}
    </Badge>
  );
}
