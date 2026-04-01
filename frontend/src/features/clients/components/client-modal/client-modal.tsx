"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { FormProvider, useForm, useFormState } from "react-hook-form";
import { toast } from "sonner";

import type { ClientPublic } from "@/features/clients/actions";
import { ClientModalShell } from "@/features/clients/components/client-modal/client-modal-shell";
import {
  CLIENT_MODAL_TABS,
} from "@/features/clients/components/client-modal/client-modal-constants";
import { ClientModalTabsBar } from "@/features/clients/components/client-modal/client-modal-tabs";
import { ClientTabClientePanel } from "@/features/clients/components/client-modal/panels/client-tab-cliente-panel";
import { useCreateClient } from "@/features/clients/hooks/use-create-client";
import { useClientDetail } from "@/features/clients/hooks/use-client-detail";
import { useDeleteClient } from "@/features/clients/hooks/use-delete-client";
import {
  clientModalValuesToCreateBody,
  clientPublicToFormValues,
  getClientModalDefaultValues,
} from "@/features/clients/lib/client-form-mappers";
import {
  clientModalFormSchema,
  type ClientModalFormValues,
} from "@/features/clients/schemas/client-modal.schema";
import { ErrorAlert } from "@/shared/components/error-alert";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs } from "@/shared/components/ui/tabs";

const ClientTabEnderecoPanel = dynamic(
  () =>
    import(
      "@/features/clients/components/client-modal/panels/client-tab-endereco-panel"
    ).then((m) => ({ default: m.ClientTabEnderecoPanel })),
  { loading: () => <Skeleton className="h-40 w-full" />, ssr: false },
);

const ClientModalTabsPlaceholder = dynamic(
  () =>
    import(
      "@/features/clients/components/client-modal/panels/client-modal-tabs-placeholder"
    ).then((m) => ({ default: m.ClientModalTabsPlaceholder })),
  { ssr: false },
);

const PLACEHOLDER_TAB_IDS = new Set([
  "contato",
  "crm",
  "outros",
  "inf",
  "contratos",
  "logins",
  "financeiro",
  "atendimentos",
  "os",
  "vendas",
  "contatos_extra",
  "negociacoes",
  "arquivos",
  "emails",
  "sms",
  "ref",
  "obs",
]);

type ClientModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string | null;
  onSaved?: (client: ClientPublic) => void;
};

export function ClientModal({
  open,
  onOpenChange,
  clientId = null,
  onSaved,
}: ClientModalProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("cliente");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const mode = clientId ? "edit" : "create";
  const detailQuery = useClientDetail(clientId ?? "", open && !!clientId);
  const createMutation = useCreateClient();
  const deleteMutation = useDeleteClient();

  const form = useForm<ClientModalFormValues>({
    resolver: zodResolver(clientModalFormSchema),
    defaultValues: getClientModalDefaultValues(),
    shouldUnregister: false,
    mode: "onTouched",
  });

  const { isDirty, isSubmitting } = useFormState({
    control: form.control,
  });

  useEffect(() => {
    if (!open) return;
    if (clientId) {
      if (detailQuery.data) {
        form.reset(clientPublicToFormValues(detailQuery.data));
      }
    } else {
      form.reset(getClientModalDefaultValues());
    }
  }, [open, clientId, detailQuery.data, form]);

  const tryCloseParent = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleRootOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        onOpenChange(true);
        return;
      }
      if (isDirty) {
        setDiscardOpen(true);
        return;
      }
      tryCloseParent();
    },
    [isDirty, onOpenChange, tryCloseParent],
  );

  const requestClose = useCallback(() => {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    tryCloseParent();
  }, [isDirty, tryCloseParent]);

  const confirmDiscard = useCallback(() => {
    form.reset(getClientModalDefaultValues());
    setDiscardOpen(false);
    tryCloseParent();
  }, [form, tryCloseParent]);

  const handleNew = useCallback(() => {
    form.reset(getClientModalDefaultValues());
    setActiveTab("cliente");
    toast.message("Novo rascunho — preencha os dados do cliente.");
  }, [form]);

  const handleSave = form.handleSubmit(
    (values) => {
      if (mode === "edit") {
        toast.error("Guardar edição indisponível — API em evolução.");
        return;
      }
      const body = clientModalValuesToCreateBody(values);
      createMutation.mutate(body, {
        onSuccess: (client) => {
          toast.success("Cliente criado");
          form.reset(clientPublicToFormValues(client));
          onSaved?.(client);
          tryCloseParent();
        },
        onError: (e) => {
          toast.error(e instanceof Error ? e.message : "Erro ao criar cliente");
        },
      });
    },
    () => {
      toast.message("Corrija os campos destacados antes de salvar.");
    },
  );

  const handleCancel = useCallback(() => {
    requestClose();
  }, [requestClose]);

  const handleDeleteConfirm = useCallback(() => {
    if (!clientId) return;
    deleteMutation.mutate(clientId, {
      onError: (e) => {
        toast.error(e instanceof Error ? e.message : "Não foi possível eliminar");
      },
      onSettled: () => setDeleteOpen(false),
    });
  }, [clientId, deleteMutation]);

  const editBlocked = mode === "edit";
  const showDetailLoader =
    open && !!clientId && detailQuery.isPending && !detailQuery.data;
  const showDetailError = open && !!clientId && detailQuery.isError;
  const showNotFound =
    open &&
    !!clientId &&
    !detailQuery.isPending &&
    !detailQuery.isError &&
    detailQuery.data === null;

  return (
    <>
      <ClientModalShell
        open={open}
        onOpenChange={handleRootOpenChange}
        expanded={expanded}
        onToggleExpand={() => setExpanded((e) => !e)}
        onRequestClose={requestClose}
        alert={
          mode === "edit"
            ? {
                title: "Alerta do cliente",
                description:
                  "Dados carregados para consulta e alteração local. Persistência de edição depende da API.",
              }
            : null
        }
        toolbar={{
          mode,
          isSubmitting: isSubmitting || createMutation.isPending,
          saveDisabled: editBlocked,
          deleteDisabled: editBlocked || !clientId,
          onNew: handleNew,
          onSave: () => void handleSave(),
          onCancel: handleCancel,
          onDelete: () => setDeleteOpen(true),
        }}
      >
        <FormProvider {...form}>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(String(v))}
            className="flex min-h-0 flex-1 flex-col"
          >
            <ClientModalTabsBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1">
              {showDetailLoader ? (
                <div className="space-y-3 py-6">
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : showDetailError ? (
                <ErrorAlert
                  title="Não foi possível carregar o cliente"
                  error={detailQuery.error}
                />
              ) : showNotFound ? (
                <p className="py-8 text-sm text-muted-foreground">
                  Cliente não encontrado.
                </p>
              ) : (
                <>
                  <ClientTabClientePanel />
                  <ClientTabEnderecoPanel />
                  {CLIENT_MODAL_TABS.filter((t) =>
                    PLACEHOLDER_TAB_IDS.has(t.id),
                  ).map((t) => (
                    <ClientModalTabsPlaceholder
                      key={t.id}
                      value={t.id}
                      label={t.label}
                    />
                  ))}
                </>
              )}
            </div>
          </Tabs>
        </FormProvider>
      </ClientModalShell>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent className="max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
            <DialogDescription>
              As alterações não guardadas serão perdidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDiscardOpen(false)}
            >
              Continuar a editar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDiscard}>
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Esta acção não pode ser anulada. A API de eliminação ainda não está
              disponível — verá uma mensagem de erro até ser implementada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
