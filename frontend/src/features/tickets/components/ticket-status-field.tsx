"use client";

import { useMemo, type ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { ticketStatusLabel } from "@/features/tickets/lib/status-label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { TicketPublic } from "@/lib/api/tickets-api";

type TicketStatus = TicketPublic["status"];

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "OPEN", label: ticketStatusLabel("OPEN") },
  { value: "IN_PROGRESS", label: ticketStatusLabel("IN_PROGRESS") },
  { value: "DONE", label: ticketStatusLabel("DONE") },
];

type TicketStatusFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  id: string;
  disabled?: boolean;
};

export function TicketStatusField<T extends FieldValues>({
  control,
  name,
  id,
  disabled,
}: TicketStatusFieldProps<T>) {
  const items = useMemo(
    (): Record<string, ReactNode> =>
      Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label])),
    [],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          items={items}
          value={field.value as string}
          onValueChange={field.onChange}
          disabled={disabled}
          modal={false}
        >
          <SelectTrigger id={id} className="h-8 w-full min-w-0" size="default">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent side="bottom" align="start">
            <SelectGroup>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    />
  );
}
