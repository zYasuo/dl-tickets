export type ClientModalTabDef = { id: string; label: string };

export const CLIENT_MODAL_TABS: ClientModalTabDef[] = [
  { id: "cliente", label: "Cliente" },
  { id: "endereco", label: "Endereço" },
  { id: "contato", label: "Contato" },
  { id: "crm", label: "CRM" },
  { id: "outros", label: "Outros" },
  { id: "inf", label: "Inf." },
  { id: "contratos", label: "Contratos" },
  { id: "logins", label: "Logins" },
  { id: "financeiro", label: "Financeiro" },
  { id: "atendimentos", label: "Atendimentos" },
  { id: "os", label: "OS" },
  { id: "vendas", label: "Vendas" },
  { id: "contatos_extra", label: "Contatos" },
  { id: "negociacoes", label: "Negociações" },
  { id: "arquivos", label: "Arquivos" },
  { id: "emails", label: "E-mails enviados" },
  { id: "sms", label: "SMS enviados" },
  { id: "ref", label: "Ref." },
  { id: "obs", label: "Obs." },
];

export const CLIENT_MODAL_INLINE_TAB_COUNT = 10;

export const DEMO_LOOKUP_TIPO_CLIENTE = [
  { code: "PF", label: "Pessoa física — retalho" },
  { code: "PJ", label: "Pessoa jurídica — empresa" },
  { code: "VIP", label: "Cliente prioritário" },
];

export const DEMO_LOOKUP_CANAL = [
  { code: "LOJA", label: "Loja física" },
  { code: "WEB", label: "Site" },
  { code: "TEL", label: "Telefone" },
];

export const DEMO_LOOKUP_FILIAL = [
  { code: "001", label: "Matriz" },
  { code: "002", label: "Filial Sul" },
  { code: "003", label: "Filial Norte" },
];
