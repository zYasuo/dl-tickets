"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import type {
  Control,
  FieldPath,
  FieldValues,
  PathValue,
  UseFormSetValue,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { AFindCityById, AFindStateById } from "@/features/locations/actions";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import { cn } from "@/lib/utils";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
  LocationStackedDialogContent,
  LocationStackedDialogRoot,
} from "./location-stacked-dialog";

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LOOKUP_ROW_GRID =
  "grid w-full gap-3 sm:grid-cols-[minmax(10rem,12.5rem)_minmax(0,1fr)] sm:gap-x-4 sm:items-start sm:gap-y-0";

const lookupIdInputClass =
  "h-11 min-h-11 w-[7.5rem] shrink-0 rounded-none border-0 bg-transparent px-3 font-mono text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm";

const lookupDescInputClass =
  "h-11 min-h-11 min-w-0 flex-1 rounded-none border-0 border-s border-border/80 bg-muted/30 px-3.5 text-sm leading-normal shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 read-only:text-foreground md:text-[0.9375rem]";

const lookupSearchBtnClass =
  "inline-flex h-11 min-h-11 w-11 shrink-0 items-center justify-center rounded-none border-0 border-s border-border/80 bg-background text-foreground hover:bg-muted/60 disabled:opacity-50";

export type GeoOption = {
  id: string;
  name: string;
  code?: string | null;
};

type LocationLookupRowProps<T extends FieldValues> = {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  uuidField: FieldPath<T>;
  labelField: FieldPath<T>;
  mode: "state" | "city";
  countryUuid?: string;
  parentStateUuid?: string;
  options: GeoOption[];
  optionsLoading?: boolean;
  optionsError?: boolean;
  disabled?: boolean;
  formLabel: string;
  htmlForCode: string;
  htmlForLabel: string;
  required?: boolean;
  error?: string;
  searchDialogTitle: string;
  searchEmptyText?: string;
  stackLabel?: boolean;
};

function stateCode(opt: GeoOption): string | null {
  if (opt.code == null) return null;
  const c = String(opt.code).trim();
  return c.length > 0 ? c : null;
}

export function LocationLookupRow<T extends FieldValues>({
  control,
  setValue,
  uuidField,
  labelField,
  mode,
  countryUuid,
  parentStateUuid,
  options,
  optionsLoading,
  optionsError,
  disabled,
  formLabel,
  htmlForCode,
  htmlForLabel,
  required,
  error,
  searchDialogTitle,
  searchEmptyText = "Nenhum resultado.",
  stackLabel = false,
}: LocationLookupRowProps<T>) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [resolving, setResolving] = React.useState(false);
  const [hint, setHint] = React.useState<string | null>(null);

  const applySelection = React.useCallback(
    (id: string, label: string) => {
      setValue(uuidField, id as PathValue<T, FieldPath<T>>, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue(labelField, label as PathValue<T, FieldPath<T>>, {
        shouldValidate: false,
        shouldDirty: true,
      });
      setHint(null);
    },
    [setValue, uuidField, labelField],
  );

  const clearSelection = React.useCallback(() => {
    setValue(uuidField, "" as PathValue<T, FieldPath<T>>, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(labelField, "" as PathValue<T, FieldPath<T>>, {
      shouldValidate: false,
      shouldDirty: true,
    });
    setHint(null);
  }, [setValue, uuidField, labelField]);

  const resolveInput = React.useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        clearSelection();
        return;
      }

      if (mode === "state") {
        if (!countryUuid?.trim()) {
          setHint("Seleccione o país primeiro.");
          return;
        }
        if (trimmed.length === 2 && !UUID_V4_RE.test(trimmed)) {
          const uf = trimmed.toUpperCase();
          const matches = options.filter(
            (o) => stateCode(o)?.toUpperCase() === uf,
          );
          if (matches.length === 1) {
            applySelection(matches[0].id, matches[0].name);
            return;
          }
          if (matches.length === 0) {
            setHint("UF não encontrada neste país.");
            return;
          }
          setHint("UF ambígua — use o UUID ou a pesquisa.");
          return;
        }
      }

      if (!UUID_V4_RE.test(trimmed)) {
        setHint(
          mode === "state"
            ? "Indique um UUID válido ou a UF (2 letras)."
            : "Indique um UUID válido.",
        );
        return;
      }

      setResolving(true);
      setHint(null);
      try {
        if (mode === "state") {
          const row = await AFindStateById(trimmed);
          if (row.countryId !== countryUuid) {
            setHint("Este estado não pertence ao país seleccionado.");
            clearSelection();
            return;
          }
          applySelection(row.id, row.name);
          return;
        }
        if (!parentStateUuid?.trim()) {
          setHint("Seleccione o estado primeiro.");
          return;
        }
        const row = await AFindCityById(trimmed);
        if (row.stateId !== parentStateUuid) {
          setHint("Esta cidade não pertence ao estado seleccionado.");
          clearSelection();
          return;
        }
        applySelection(row.id, row.name);
      } catch {
        setHint("Registo não encontrado.");
        clearSelection();
      } finally {
        setResolving(false);
      }
    },
    [
      mode,
      countryUuid,
      parentStateUuid,
      options,
      applySelection,
      clearSelection,
    ],
  );

  const searchBlocked =
    disabled ||
    (mode === "state" && !countryUuid?.trim()) ||
    (mode === "city" && !parentStateUuid?.trim());

  const controlColumn = (
    <div className="flex w-full min-w-0 flex-col space-y-2.5">
      <div
        className={cn(
          "flex h-11 min-h-11 w-full min-w-0 flex-nowrap items-stretch overflow-hidden rounded-md border border-input bg-background shadow-sm transition-[color,box-shadow] outline-none",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/35",
          Boolean(error) &&
            "border-destructive focus-within:border-destructive focus-within:ring-destructive/25",
        )}
      >
        <Controller
          name={uuidField}
          control={control}
          render={({ field }) => (
            <Input
              id={htmlForCode}
              disabled={disabled || resolving}
              autoComplete="off"
              spellCheck={false}
              placeholder={mode === "state" ? "UF/ID" : "ID"}
              maxLength={36}
              aria-label={`${formLabel} — código ou UUID`}
              className={lookupIdInputClass}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={(e) => {
                field.onChange(e.target.value);
                setHint(null);
              }}
              onBlur={(e) => {
                field.onBlur();
                void resolveInput(e.target.value);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${htmlForCode}-err` : undefined}
            />
          )}
        />
        <Controller
          name={labelField}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id={htmlForLabel}
              readOnly
              tabIndex={-1}
              placeholder="Nome"
              aria-label={`${formLabel} — descrição`}
              className={lookupDescInputClass}
              value={typeof field.value === "string" ? field.value : ""}
            />
          )}
        />
        <button
          type="button"
          className={lookupSearchBtnClass}
          disabled={searchBlocked}
          title={
            searchBlocked
              ? mode === "city"
                ? "Seleccione o estado primeiro"
                : "Indisponível"
              : "Pesquisar"
          }
          onClick={() => setSearchOpen(true)}
        >
          <SearchIcon className="size-4 opacity-80" aria-hidden />
          <span className="sr-only">Abrir pesquisa</span>
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {optionsLoading ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            A carregar lista…
          </p>
        ) : null}
        {optionsError ? (
          <p className="text-xs leading-relaxed text-destructive">
            Não foi possível carregar a lista. Pode indicar o UUID à esquerda ou
            tentar a pesquisa.
          </p>
        ) : null}
        {hint ? (
          <p
            className="text-xs leading-relaxed text-amber-700 dark:text-amber-400"
            role="status"
          >
            {hint}
          </p>
        ) : null}
        {error ? (
          <p
            id={`${htmlForCode}-err`}
            className="text-sm leading-relaxed text-destructive"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      {stackLabel ? (
        <div className="grid w-full gap-2">
          <Label htmlFor={htmlForCode}>
            {formLabel}
            {required ? <span className="text-destructive"> *</span> : null}
          </Label>
          {controlColumn}
        </div>
      ) : (
        <div className={cn(LOOKUP_ROW_GRID)}>
          <div className="flex shrink-0 items-start pt-0.5 sm:pt-2.5">
            <label
              htmlFor={htmlForCode}
              className="text-sm font-medium leading-relaxed text-muted-foreground"
            >
              {formLabel}
              {required ? (
                <span className="text-destructive" aria-hidden>
                  {" "}
                  *
                </span>
              ) : null}
            </label>
          </div>
          {controlColumn}
        </div>
      )}

      <LocationStackedDialogRoot open={searchOpen} onOpenChange={setSearchOpen}>
        <LocationStackedDialogContent className="max-h-[min(92dvh,42rem)] w-[min(94vw,44rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-5 overflow-hidden sm:gap-6">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              {searchDialogTitle}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Escolha um registo. O formulário de cliente permanece aberto por
              baixo.
            </DialogDescription>
          </DialogHeader>
          <Command className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-muted/15 p-2.5 shadow-inner sm:p-3">
            <CommandInput
              variant="dialog"
              placeholder="Filtrar por nome, UF ou parte do UUID…"
            />
            <CommandList className="min-h-48 max-h-[min(58vh,30rem)] flex-1 overflow-y-auto">
              <CommandEmpty className="py-10 text-center text-sm text-muted-foreground">
                {searchEmptyText}
              </CommandEmpty>
              <CommandGroup className="p-1">
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={`${opt.id} ${opt.name} ${stateCode(opt) ?? ""}`}
                    onSelect={() => {
                      applySelection(opt.id, opt.name);
                      setSearchOpen(false);
                    }}
                    className="cursor-pointer rounded-md py-3 text-sm sm:py-3.5 sm:text-base"
                  >
                    {stateCode(opt) ? (
                      <span className="me-2 font-mono text-xs text-muted-foreground">
                        {stateCode(opt)}
                      </span>
                    ) : (
                      <span className="me-2 font-mono text-xs text-muted-foreground">
                        {opt.id.slice(0, 8)}…
                      </span>
                    )}
                    {opt.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </LocationStackedDialogContent>
      </LocationStackedDialogRoot>
    </>
  );
}
