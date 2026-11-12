# Checklist de configuração — Portal do Capítulo nº 559

## Já funciona (implementado e testado com dados simulados)
- [x] Página inicial, menu mobile, tema claro/escuro, acessibilidade por teclado
- [x] Calendário próprio: mês, "Hoje", dia atual, dias com atividades, seleção de data
- [x] Cartões do dia selecionado; sem seleção, mostra os próximos eventos
- [x] Detalhes do evento (data, horário, local, descrição) e botão "Abrir no Google"
- [x] Eventos de dia inteiro e de vários dias; fuso America/Bahia
- [x] Cache no aparelho, modo offline, indicador de última atualização, aviso de atraso
- [x] Estados vazios e mensagens de erro
- [x] Formulário próprio, com anti-spam simples e link para o Google Forms
- [x] Sem rolagem horizontal; sem erros de JavaScript nos testes

## Depende de você configurar
- [ ] Repositório público no GitHub e Pages ativado (README > Publicar)
- [ ] Agenda do Google **pública** (somente leitura)
- [x] Calendário próprio: Apps Script (Opção A) já preenchido em `config.js` (confirmar com eventos reais após publicar)
- [ ] Evento de teste criado, editado e apagado no Google, conferido no site
- [ ] Forms: login, e-mail e "1 resposta" **desligados**
- [ ] `formEntries` preenchido com os 3 códigos `entry`
- [ ] Envio de teste pelo site conferido em Respostas (e depois apagado)
- [ ] Testado em um Android e em um iPhone reais
- [ ] Contas institucionais e e-mails de recuperação atualizados
- [ ] (Opcional) `og:image` para a prévia no WhatsApp
