"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { makeQueryClient } from "@/lib/query/query-client";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

type ProvidersProps = {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
};

export function Providers({ children, locale, messages }: ProvidersProps) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            {children}
            <Toaster richColors theme="dark" position="top-center" />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
