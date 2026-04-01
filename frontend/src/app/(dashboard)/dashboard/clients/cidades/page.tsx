import type { Metadata } from "next";
import { CitiesListView } from "@/features/locations/components/cities-list-view";

export const metadata: Metadata = {
  title: "Cidades | DL System",
  description: "Lista de cidades por estado (cadastro).",
};

export default function ClientesCidadesPage() {
  return <CitiesListView />;
}
