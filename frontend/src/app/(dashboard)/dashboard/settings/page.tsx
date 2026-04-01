import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export const metadata: Metadata = {
  title: "Configurações | DL System",
  description: "Definições da conta e da aplicação.",
};

export default function SettingsPage() {
  return (
    <div className="flex w-full flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-4 md:px-5">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        Configurações
      </h1>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Conta</CardTitle>
          <CardDescription>
            Opções de perfil e preferências estarão disponíveis aqui em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Utiliza o menu lateral para navegar no painel.
        </CardContent>
      </Card>
    </div>
  );
}
