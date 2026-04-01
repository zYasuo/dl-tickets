import type { Metadata } from "next";
import { StatesListView } from "@/features/locations/components/states-list-view";

export const metadata: Metadata = {
  title: "Estados | DL System",
  description: "Lista de estados (cadastro).",
};

export default function ClientesEstadosPage() {
  return <StatesListView />;
}
