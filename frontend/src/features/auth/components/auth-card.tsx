import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/shared/components/ui/card";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  header: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function AuthCard({ header, children, footer, className }: AuthCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>{header}</CardHeader>
      {children != null ? <CardContent>{children}</CardContent> : null}
      {footer ? <CardFooter className="flex-col gap-2">{footer}</CardFooter> : null}
    </Card>
  );
}
