import type { ReactNode } from "react";

type AuthScreenHeaderProps = {
  title: string;
  description: ReactNode;
  adornment?: ReactNode;
};

export function AuthScreenHeader({
  title,
  description,
  adornment,
}: AuthScreenHeaderProps) {
  return (
    <div className="space-y-4">
      {adornment ? (
        <div className="flex justify-center sm:justify-start">{adornment}</div>
      ) : null}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
          {description}
        </p>
      </div>
    </div>
  );
}
