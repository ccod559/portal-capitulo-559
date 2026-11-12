/* CONFIGURAÇÃO DO PORTAL — Capítulo Caetiteense nº 559
   Único arquivo que a gestão precisa editar. Campo vazio ("") mostra um aviso no site.
   Aspas e vírgulas importam: edite só o que está entre aspas. */
const SITE_CONFIG = {
  /* ---------- Identificação (aparece no topo, na página inicial e no rodapé) ---------- */
  site: {
    name: "Capítulo Caetiteense",
    number: "559",
    order: "Ordem DeMolay",
    city: "Caetité",
    state: "Bahia",
    intro: "Bem-vindo ao portal do Capítulo. Acompanhe as atividades no calendário e fale diretamente com a gestão. Assim, ninguém é pego de surpresa por uma reunião ou evento em cima da hora."
  },

  /* ---------- Calendário ---------- */
  timezone: "America/Bahia",   // fuso usado para mostrar datas e horários
  refreshMinutes: 3,           // de quantos em quantos minutos o site consulta o Google Agenda (com a página aberta)

  // Calendário padrão do Google: só aparece se nenhuma das duas opções abaixo estiver preenchida.
  calendarEmbedUrl: "https://calendar.google.com/calendar/embed?src=392370902585d36add482d235cc7dd35e470ee275405b4e0a935f009a26653c4%40group.calendar.google.com&ctz=America%2FBahia",
  // Botão "Abrir no Google": deixe vazio. O site monta o link sozinho a partir do ID do calendário acima.
  calendarPublicUrl: "",

  // CALENDÁRIO PRÓPRIO (escolha UMA opção; veja o README). Sem nenhuma, o site mostra o calendário padrão acima.
  calendarFeedUrl: "https://script.google.com/macros/s/AKfycbzy28MMATrihwwm4pclZPOPsCkUHzJyna4B0ww1LpInEmvNwBDvJ8KatBFxKjHygLM/exec",  // Opção A (recomendada): endereço do Google Apps Script (termina em /exec)
  calendarApiKey: "",   // Opção B: chave de API do Google Calendar (restrita ao seu site)

  // Categorias (legenda do site). Um evento entra numa categoria de duas formas:
  //  1) pela COR que você escolhe no Google Agenda ("colorIds": ver tabela no README); ou
  //  2) por uma palavra no TÍTULO ("keys"). A cor escolhida no Google tem prioridade.
  categories: [
    { name: "Reunião/Cerimônia", colorIds: ["11"], keys: ["reunião", "reuniao", "cerimônia", "cerimonia", "iniciação", "iniciacao", "instalação", "instalacao", "elevação", "elevacao"], color: "#e0201b" },
    { name: "Filantropias", colorIds: ["5"], keys: ["filantropia", "cesta", "solidária", "solidaria", "abrigo", "campanha"], color: "#f2c200" },
    { name: "Palestra/Evento", colorIds: ["9"], keys: ["palestra", "evento", "oficina"], color: "#1b2170" },
    { name: "Priorado", colorIds: ["10"], keys: ["priorado", "convocação", "convocacao"], color: "#1a9a2a" },
    { name: "Fundos", colorIds: ["6"], keys: ["feijoada", "fundos", "rifa"], color: "#f58220" },
    { name: "Entretenimento", colorIds: ["7"], keys: ["entretenimento"], color: "#1ea7f2" },
    { name: "Outros", colorIds: [], keys: [], color: "#718096" }
  ],

  /* ---------- Fale com a Gestão ---------- */
  googleFormsUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeaKL_CTHhWCWj7jnx_FiPWFLRpEdabMhPjO6gVc9UHv9Rtbw/viewform?usp=publish-editor",
  googleFormsEmbedUrl: "",
  // FORMULÁRIO PRÓPRIO: códigos dos campos do seu Google Forms (veja o README).
  // Vazio = o site mostra o formulário padrão do Google (botão + formulário incorporado).
  formEntries: { suggestion: "AAA", question: "BBB", complaint: "CCC" }
};
