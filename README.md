# Portal do Capítulo Caetiteense nº 559 — Ordem DeMolay

Site estático (HTML, CSS e JavaScript puro) para o GitHub Pages. Sem instalação, sem servidor, sem custo.
Só duas funções: **Calendário** e **Fale com a Gestão**. Tudo que a gestão edita fica em `js/config.js`.

> Veja também o **CHECKLIST.md**: o que já funciona e o que ainda depende de configuração.

## Estrutura
```
index.html            página única
css/styles.css        visual (cores no topo do arquivo)
js/config.js          ÚNICO arquivo que a gestão edita
js/calendar.js        calendário próprio (lê o Google Agenda)
js/form.js            formulário próprio (envia ao Google Forms)
js/main.js            menu, tema claro/escuro e escolha entre modo próprio ou padrão do Google
assets/images/logo.png        brasão (não alterar a proporção)
assets/icons/                 favicon e ícone para a tela inicial do iPhone
```

## Publicar (GitHub Pages)
1. Crie uma conta GitHub **institucional** (e-mail do Capítulo) e um repositório **público** chamado `portal-capitulo-559`.
2. **Add file > Upload files**: envie o **conteúdo** desta pasta (não o .zip) e clique em **Commit changes**. Confirme que os arquivos `.nojekyll` e `.gitignore` subiram.
3. **Settings > Pages > Deploy from a branch > main /(root) > Save**.
4. Em 1 a 3 minutos o site abre em `https://SEU-USUARIO.github.io/portal-capitulo-559/`.

Todos os caminhos do site são relativos, então funcionam nesse endereço de "repositório de projeto".

## Publicar atualizações
Para mudar textos, links ou categorias: abra `js/config.js` no GitHub, clique no lápis, edite e **Commit changes**. O site atualiza em poucos minutos (se não mudar, recarregue forçando: Ctrl+F5, ou limpe o cache no celular).
**Os eventos não precisam disso:** eles vêm do Google Agenda.

## Calendário (Google Agenda)
O Google Agenda é a fonte oficial. A gestão cria, edita e apaga eventos **no Google**, e o site mostra sozinho.
- O site consulta o Google ao abrir a página e a cada `refreshMinutes` (padrão: 5 min) com a página aberta. **Não é instantâneo:** pode levar alguns minutos, e o site avisa isso.
- Guarda os últimos dados no aparelho. Sem internet, mostra o que tinha salvo e informa o horário.
- A agenda precisa estar **pública**: Configurações da agenda > Permissões de acesso > *Disponibilizar publicamente*.
- Vale o fuso `timezone` do `config.js` (padrão `America/Bahia`). Eventos recorrentes e de dia inteiro são suportados.
- **Cores e legenda:** o Google Agenda não permite criar legendas próprias, mas cada evento pode ter uma das 11 cores padrão (botão da cor, ao editar o evento). O **nome** de cada categoria e a cor exibida no site ficam em `categories` no `config.js`. Padrão já configurado: vermelho (Tomate) = Reunião/Cerimônia, amarelo (Banana) = Filantropias, azul-escuro (Mirtilo) = Palestra/Evento, verde (Manjericão) = Priorado, laranja (Tangerina) = Fundos, azul-claro (Pavão) = Entretenimento. Se o evento não tiver cor, o site tenta pelas palavras do título (ex.: "Reunião ritualística").
- **Salvar imagem:** o botão no calendário gera um PNG do mês (grade + lista de eventos por categoria). No celular abre o menu de compartilhar (WhatsApp etc.); no computador baixa o arquivo.

O navegador não consegue ler o iCal público do Google (bloqueio de segurança), por isso há duas opções. Escolha **uma**:

**Opção A (recomendada) — Google Apps Script, sem chave de API**
*(Versão atualizada: esconde eventos marcados como "Privado" e guarda respostas por 2 minutos. Quem já implantou a versão antiga deve colar este código e usar Implantar > Gerenciar implantações > Editar > Nova versão.)*
1. Entre em script.google.com com a **mesma conta dona da agenda** e clique em **Novo projeto**.
2. Apague o código e cole:
```js
function doGet(e) {
  var p = (e && e.parameter) || {};
  var from = p.from ? new Date(p.from) : new Date();
  var to = p.to ? new Date(p.to) : new Date(Date.now() + 90 * 864e5);
  if (isNaN(from) || isNaN(to) || to - from > 400 * 864e5) return saida("[]");
  var cache = CacheService.getScriptCache();
  var chave = "ev" + from.getTime() + "_" + to.getTime();
  var guardado = cache.get(chave);
  if (guardado) return saida(guardado);          // respostas repetidas ficam 2 minutos no cache do Google

  var cal = CalendarApp.getCalendarById("392370902585d36add482d235cc7dd35e470ee275405b4e0a935f009a26653c4@group.calendar.google.com");
  var tz = cal.getTimeZone();
  var evs = cal.getEvents(from, to).filter(function (ev) {
    var v = ev.getVisibility();                  // eventos marcados como Privados NUNCA vão para o site
    return v !== CalendarApp.Visibility.PRIVATE && v !== CalendarApp.Visibility.CONFIDENTIAL;
  }).map(function (ev) {
    var ad = ev.isAllDayEvent();
    return {
      title: ev.getTitle(), allDay: ad, colorId: ev.getColor(),
      start: ev.getStartTime().toISOString(), end: ev.getEndTime().toISOString(),
      startDate: ad ? Utilities.formatDate(ev.getAllDayStartDate(), tz, "yyyy-MM-dd") : "",
      endDate: ad ? Utilities.formatDate(ev.getAllDayEndDate(), tz, "yyyy-MM-dd") : "",
      location: ev.getLocation(), description: ev.getDescription()
    };
  });
  var json = JSON.stringify(evs);
  try { cache.put(chave, json, 120); } catch (err) {}
  return saida(json);
}
function saida(t) {
  return ContentService.createTextOutput(t).setMimeType(ContentService.MimeType.JSON);
}
```
3. **Implantar > Nova implantação > Tipo: App da Web**. Executar como: **Eu**. Quem tem acesso: **Qualquer pessoa**. Autorize quando o Google pedir (em "app não verificado", clique em Avançado > Acessar projeto).
4. Copie o endereço que termina em `/exec` e cole em `calendarFeedUrl` no `js/config.js`.
5. Se mudar o código do script depois, use **Implantar > Gerenciar implantações > Editar > Nova versão**, senão o endereço continua com a versão antiga.

**Opção B — chave de API:** no console.cloud.google.com, crie um projeto, ative a *Google Calendar API*, crie uma **chave de API**, restrinja-a à Calendar API e ao endereço do site (referenciadores HTTP) e cole em `calendarApiKey`. A chave aparece no código do site; por isso a restrição é obrigatória.

Se nenhuma opção for configurada, o site mostra o calendário padrão do Google (`calendarEmbedUrl`), sem a interface própria.

## Fale com a Gestão (Google Forms)
As respostas chegam na aba **Respostas** do seu Google Forms.
1. No Forms, em **Configurações**, deixe **desligado**: exigir login, coletar e-mails e limitar a 1 resposta. Com qualquer um ligado, o envio pelo site falha.
2. Para o formulário próprio do site, descubra os códigos dos campos: no editor, três pontinhos > **Obter link pré-preenchido**. Preencha cada pergunta com AAA, BBB, CCC e clique em **Obter link**. O link terá algo como `entry.1234567890=AAA&entry.9876543210=BBB&entry.1357924680=CCC`.
3. No `js/config.js`, em `formEntries`, coloque cada número no campo certo: `suggestion` (sugestão), `question` (dúvida) e `complaint` (reclamação), na ordem das perguntas do Forms.
4. Faça um envio de teste pelo site e confira em Respostas. Depois apague o teste.

- **Com `formEntries` preenchido:** formulário próprio do site, com um link "Abrir no Google Forms" abaixo.
- **Com `formEntries` vazio:** botão "Abrir formulário em nova aba" e o formulário do Google incorporado.

O formulário próprio envia sem poder confirmar o recebimento (limitação do Google): por isso o teste do passo 4 é importante. O site não pede nome, mas **não garantimos anonimato absoluto**.

## Alterar links e textos
Tudo em `js/config.js`: nome, número, cidade, texto de apresentação (`site`), links do Google Agenda e do Forms, categorias e intervalo de atualização. Os textos de acessibilidade (descrição do brasão) e a descrição para buscadores estão no `index.html`.

## Brasão
Substitua `assets/images/logo.png` por outro PNG **com o mesmo nome** e proporção parecida (hoje 640 × 491). O arquivo atual pesa cerca de 300 KB e foi mantido sem compressão para preservar o brasão original. Para trocar o ícone do navegador, substitua `assets/icons/favicon.png` (64 × 64) e `assets/icons/apple-touch-icon.png` (180 × 180).
*(Opcional)* Para a prévia do link no WhatsApp, adicione no `<head>` do `index.html`, já com o endereço real do site:
`<meta property="og:image" content="https://SEU-USUARIO.github.io/portal-capitulo-559/assets/images/logo.png">`

## Administrar o repositório e trocar de gestão
- GitHub: Settings > Collaborators (ou transfira o repositório para uma organização do Capítulo). Use e-mail institucional e ative a verificação em duas etapas.
- Google Agenda e Forms: compartilhe com permissão de **proprietário/editor** para o novo responsável. O Apps Script (Opção A) pertence à conta que o criou: recriar na conta nova e trocar o endereço em `calendarFeedUrl`.
- Nunca coloque senhas ou tokens no repositório. Atualize os e-mails de recuperação das contas.
- A lista de responsáveis e acessos deve ficar registrada na ata de transição.

## Estado desta versão
Calendário: `calendarEmbedUrl` (ID da agenda) e `calendarFeedUrl` (Apps Script) já estão preenchidos. O botão "Abrir no Google" e o link "Ver no Google Agenda" dos eventos são montados sozinhos a partir do ID da agenda (`calendarPublicUrl` fica vazio).
Testado em navegador (celular e computador) com eventos simulados: grade, seleção, detalhes, cache, fuso, tema claro/escuro e a imagem "Salvar imagem", que reproduz o visual do site no tema em uso.
**Ainda depende de confirmação com a agenda real:** abrir o site publicado e conferir se os eventos aparecem. **Fale com a Gestão:** Google Forms ainda não configurado (links vazios no `config.js`).
