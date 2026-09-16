# Cleisson Barber App

CLEISSON BARBER CLUB — MVP FASE 1

1. OBJETIVO DO PROJETO

Crie um SaaS/PWA profissional chamado Cleisson Barber Club, desenvolvido exclusivamente para uso em smartphones.

O sistema será utilizado por uma barbearia real para:

Permitir que clientes façam agendamentos online.

Permitir que clientes comuns agendem serviços normalmente.

Permitir que assinantes utilizem os benefícios do plano contratado.

Permitir que o barbeiro gerencie agenda, clientes, atendimentos e assinaturas.

Controlar automaticamente a utilização dos benefícios das assinaturas.

Permitir instalação do sistema na tela inicial do celular como um aplicativo PWA.

O projeto deve ser construído com arquitetura limpa, componentes reutilizáveis, banco de dados estruturado, validações no frontend e backend, controle de concorrência nos agendamentos e tratamento adequado de estados de erro/loading/vazio.

NÃO criar funcionalidades fora do escopo da Fase 1 sem necessidade.

2. REGRA PRINCIPAL: MOBILE ONLY

O sistema foi projetado exclusivamente para smartphones.

Prioridades:

Interface vertical.

Navegação confortável com uma mão.

Botões grandes e fáceis de tocar.

Tipografia altamente legível.

Espaçamento adequado para touch.

Sem tabelas horizontais difíceis de usar.

Sem layouts desktop complexos.

Não tentar transformar a interface em um dashboard desktop.

A interface deve funcionar muito bem em celulares Android modernos.

O sistema deve ser responsivo dentro do universo mobile, mas o foco absoluto é smartphone.

3. PWA / INSTALAÇÃO

O projeto deve funcionar como uma Progressive Web App (PWA).

Configurar:

manifest.webmanifest.

Ícone do aplicativo.

Nome: Cleisson Barber Club.

Tema visual preto/dourado.

Splash/loading coerente com a marca.

Service worker quando apropriado.

Possibilidade de adicionar à tela inicial.

Experiência semelhante a aplicativo instalado.

Não criar APK nativo nesta fase.

O ícone do aplicativo deve utilizar a logo oficial fornecida pelo usuário, especificamente o símbolo CB + coroa quando disponível.

NÃO recriar a logo usando texto ou IA.

4. IDENTIDADE VISUAL

A identidade visual oficial é:

Cores

Fundo principal: preto quase absoluto.

Fundo secundário: preto/cinza muito escuro.

Textura extremamente sutil de mármore/pedra preta quando apropriado.

Dourado principal: dourado metálico/champagne.

Dourado secundário: dourado mais escuro.

Texto principal: branco/off-white.

Texto secundário: cinza claro.

Predominância:

PRETO + DOURADO + BRANCO

Estilo

A interface deve transmitir:

luxo;

elegância;

sofisticação;

modernidade;

exclusividade;

profissionalismo;

confiança.

Evitar:

gradientes exagerados;

excesso de brilho;

excesso de ícones;

visual genérico de template;

aparência de aplicativo infantil;

excesso de elementos dourados;

cards desnecessariamente grandes.

O dourado deve ser usado estrategicamente para ações importantes, preços, títulos, bordas e destaques.

Logo

Utilizar a logo oficial anexada pelo usuário.

Não redesenhar, alterar ou gerar uma versão alternativa da logo.

Na interface:

logo completa pode aparecer na tela inicial/login;

símbolo CB + coroa pode ser usado como ícone do app;

manter proporções originais;

não distorcer;

não modificar as cores da logo oficial.

5. TIPOGRAFIA

Utilizar:

títulos: serifada elegante/premium;

textos: sans-serif limpa e extremamente legível;

preços: grandes e destacados;

botões: fonte limpa e forte;

espaçamento de letras elegante em títulos.

Priorizar legibilidade em telas pequenas.

6. ARQUITETURA DE USUÁRIOS

Existem dois tipos principais:

CLIENTE

Pode:

visualizar serviços;

agendar;

visualizar seus agendamentos;

visualizar sua assinatura;

visualizar utilização dos benefícios;

cancelar seus próprios agendamentos conforme regras configuradas.

BARBEIRO / ADMIN

Pode:

visualizar agenda;

criar agendamento manual;

cancelar agendamento;

concluir atendimento;

visualizar clientes;

visualizar histórico;

visualizar assinaturas;

cadastrar/editar clientes;

bloquear horários;

visualizar informações dos planos.

Criar autenticação segura e controle de permissões.

Um cliente NUNCA deve conseguir acessar dados administrativos.

7. SERVIÇOS

Cadastrar inicialmente:

CABELO

R$ 30,00

BARBA

R$ 20,00

CABELO + BARBA

R$ 50,00

PÉZINHO

R$ 10,00

SOBRANCELHA

R$ 10,00

Os serviços devem ficar armazenados no banco de dados, e não hardcoded apenas no frontend.

8. HORÁRIO DE FUNCIONAMENTO

Segunda a sexta

09:00 até 19:00.

Sábado e domingo

09:00 até 19:30.

Os horários de agendamento devem funcionar em intervalos de 30 minutos.

Exemplo:

09:00
09:30
10:00
10:30
11:00
...

De segunda a sexta, o último intervalo começa às 18:30 e termina às 19:00.

Sábado e domingo, o último intervalo começa às 19:00 e termina às 19:30.

O sistema deve gerar os horários automaticamente com base nas configurações da barbearia.

Não duplicar horários manualmente.

9. REGRA CRÍTICA DE AGENDAMENTO

Nunca permitir dois agendamentos confirmados no mesmo horário.

Essa regra deve ser protegida:

no frontend;

no backend;

no banco de dados quando possível.

O frontend sozinho NÃO é suficiente para impedir conflito.

Criar uma restrição/validação adequada para impedir double booking em condições de concorrência.

Exemplo:

Cliente A escolhe 14:30.

Cliente B também escolhe 14:30 praticamente ao mesmo tempo.

Somente um deve conseguir confirmar.

O outro deve receber uma mensagem clara:

"Esse horário acabou de ser reservado. Escolha outro horário."

Nunca criar dois agendamentos para o mesmo horário.

10. FLUXO DO CLIENTE

Tela inicial

Mostrar:

Logo Cleisson Barber Club.

Mensagem:

AGENDE SEU HORÁRIO

Texto curto:

"Escolha seu serviço, data e horário."

Botão principal:

AGENDAR HORÁRIO

Também permitir acesso à área do cliente quando autenticado.

11. FLUXO DE AGENDAMENTO

Fluxo:

ETAPA 1 — SERVIÇO

Mostrar:

Cabelo — R$30

Barba — R$20

Cabelo + Barba — R$50

Pezinho — R$10

Sobrancelha — R$10

O cliente seleciona um.

ETAPA 2 — DATA

Mostrar calendário mobile.

Permitir seleção de data válida.

Não permitir selecionar datas passadas.

ETAPA 3 — HORÁRIO

Mostrar somente horários disponíveis.

Exemplo:

14:00 14:30 15:00 15:30

Horários ocupados:

não podem ser selecionados;

devem ter aparência visual diferente;

não devem permitir clique.

ETAPA 4 — DADOS

Solicitar:

Nome completo.

WhatsApp.

Se usuário estiver autenticado, preencher automaticamente.

ETAPA 5 — CONFIRMAÇÃO

Mostrar resumo:

Seu agendamento

Serviço: Cabelo

Data: 15/08/2026

Horário: 14:30 — 15:00

Valor: R$30,00

Botão:

CONFIRMAR AGENDAMENTO

12. CONFIRMAÇÃO

Após confirmar:

Mostrar uma tela elegante:

AGENDAMENTO CONFIRMADO

✓ Serviço
✓ Data
✓ Horário

Mensagem:

"Seu horário foi reservado com sucesso."

Botão:

VER MEU AGENDAMENTO

E opção para voltar ao início.

13. ASSINATURAS

Criar os seguintes planos exatamente:

PLANO BÁSICO

CORTE

R$100,00

4 cortes mensais.

Regra: Máximo de 4 cortes dentro do período da assinatura.

BARBA

R$70,00

4 barbas mensais.

Regra: Máximo de 4 barbas dentro do período da assinatura.

COMBO BÁSICO

R$160,00

4 cortes + 4 barbas.

Regra: Máximo de 4 cortes e máximo de 4 barbas dentro do período da assinatura.

14. PLANO PREMIUM

CORTE PREMIUM

R$180,00

Corte ilimitado.

Validade: 30 dias.

BARBA PREMIUM

R$120,00

Barba ilimitada.

Validade: 30 dias.

CORTE + BARBA ILIMITADOS

R$260,00

Corte e barba ilimitados.

Validade: 30 dias.

Marcar visualmente como:

MAIS VANTAJOSO ★★★

15. IMPORTANTE SOBRE ASSINATURAS

Não criar contador genérico.

Cada plano possui benefícios específicos.

Exemplo:

Cliente com plano CORTE:

Pode utilizar: ✓ Cabelo

Não pode utilizar a assinatura para: ✗ Barba ✗ Cabelo + Barba

Cliente com plano BARBA:

Pode utilizar: ✓ Barba

Cliente com COMBO:

Pode utilizar: ✓ Cabelo ✓ Barba ✓ Cabelo + Barba, respeitando a disponibilidade dos dois benefícios.

Cliente com CORTE PREMIUM:

Pode utilizar: ✓ Cabelo

Ilimitado durante a validade.

Cliente com BARBA PREMIUM:

Pode utilizar: ✓ Barba

Ilimitado durante a validade.

Cliente com CORTE + BARBA PREMIUM:

Pode utilizar: ✓ Cabelo ✓ Barba ✓ Cabelo + Barba

Ilimitado durante a validade.

16. CONSUMO DO BENEFÍCIO

REGRA MUITO IMPORTANTE:

Agendar NÃO consome o benefício.

O benefício só deve ser consumido quando o barbeiro clicar:

CONCLUIR ATENDIMENTO

Fluxo:

Agendado: não consome.

Cancelado: não consome.

Atendimento concluído: consome.

Isso evita perda de benefício em cancelamentos.

17. VALIDADE DAS ASSINATURAS

Cada assinatura deve possuir:

data de início;

data de término;

plano;

status;

benefícios utilizados.

Para planos Premium:

validade = 30 dias.

Para planos Básicos:

utilizar o período mensal definido para a assinatura.

Não permitir utilização de benefícios de uma assinatura expirada.

Mostrar claramente:

ATIVA

ou

EXPIRADA

18. ÁREA DO ASSINANTE

Criar uma tela:

MINHA ASSINATURA

Mostrar:

Nome do plano.

Status:

ATIVA

Data de início.

Data de renovação/expiração.

Benefícios.

Exemplo:

COMBO BÁSICO

Cortes:

2 / 4 utilizados

Barbas:

1 / 4 utilizadas

Mostrar barras de progresso elegantes.

Para Premium:

Cortes ilimitados

Mostrar:

"Plano válido até 15/09/2026."

19. AGENDAMENTO DO ASSINANTE

Quando um assinante fizer login:

mostrar claramente:

Você possui uma assinatura ativa.

Ao escolher um serviço compatível, permitir:

USAR BENEFÍCIO DA ASSINATURA

O sistema deve verificar no backend:

assinatura ativa;

validade;

serviço permitido;

quantidade disponível, se o plano possuir limite.

Se qualquer condição falhar, não permitir utilizar o benefício.

20. PAINEL DO BARBEIRO

Criar um dashboard mobile profissional.

Tela inicial:

HOJE

Mostrar indicadores:

Agendamentos de hoje

Assinantes

Atendimentos concluídos

Próximo horário

Depois:

AGENDA DE HOJE

Timeline:

09:00 Cliente Serviço Status

09:30 Cliente Serviço Status

etc.

Cards fáceis de tocar.

21. CARD DO AGENDAMENTO

Exemplo:

14:30

João Silva

✂️ Cabelo

⭐ Assinante

Combo Básico

Status:

AGENDADO

Ações:

CONCLUIR

CANCELAR

VER CLIENTE

22. CONCLUIR ATENDIMENTO

Ao clicar em concluir:

mostrar confirmação:

Concluir atendimento?

Cliente: João Silva

Serviço: Cabelo

Se assinatura:

"Este atendimento consumirá 1 benefício de corte."

Botões:

CONFIRMAR

VOLTAR

Depois de confirmar:

status = concluído.

Registrar histórico.

Se assinatura:

incrementar o benefício utilizado.

Nunca permitir concluir duas vezes o mesmo atendimento e consumir duas vezes o mesmo benefício.

23. CANCELAR ATENDIMENTO

Ao cancelar:

pedir confirmação.

Depois:

status = cancelado.

Não consumir benefício.

Liberar o horário para novos agendamentos.

24. CLIENTES

Criar área:

CLIENTES

Lista pesquisável.

Cada cliente deve possuir:

nome;

WhatsApp;

tipo: comum/assinante;

plano;

status da assinatura;

histórico;

próximo agendamento.

Ao abrir:

PERFIL DO CLIENTE

Mostrar informações completas.

25. HISTÓRICO

Mostrar:

Data.

Serviço.

Horário.

Valor.

Tipo:

Normal / Assinatura.

Status:

Concluído / Cancelado.

Para assinantes, mostrar consumo do benefício relacionado.

26. BLOQUEIO DE HORÁRIOS

O barbeiro deve conseguir bloquear um horário.

Exemplo:

15:00 — BLOQUEADO

Motivo opcional:

"Compromisso pessoal."

Cliente não poderá reservar aquele horário.

O horário bloqueado deve aparecer diferente na agenda administrativa.

27. AGENDAMENTO MANUAL PELO BARBEIRO

O barbeiro deve conseguir criar um agendamento manual.

Fluxo:

Cliente.

Serviço.

Data.

Horário.

Normal ou assinatura.

Confirmar.

Também deve respeitar:

horário de funcionamento;

disponibilidade;

conflitos;

regras da assinatura.

28. STATUS DE AGENDAMENTO

Utilizar estados claros:

agendado;

confirmado;

concluído;

cancelado.

Evitar estados redundantes.

O sistema deve ter uma máquina de estados coerente para não permitir transições inválidas.

Exemplo:

Cancelado → não pode ser concluído.

Concluído → não pode ser concluído novamente.

29. BANCO DE DADOS

Criar estrutura organizada para pelo menos:

users

id
nome
email
telefone
role
created_at

services

id
nome
preço
ativo
created_at

business_hours

id
dia_semana
hora_abertura
hora_fechamento
ativo

appointments

id
cliente_id
servico_id
data
hora_inicio
hora_fim
status
tipo_atendimento
subscription_id nullable
created_at

subscription_plans

id
nome
tipo
preco
duracao_dias
ilimitado
ativo

subscriptions

id
cliente_id
plano_id
data_inicio
data_fim
status
created_at

subscription_usage

id
subscription_id
tipo_beneficio
appointment_id
quantidade
created_at

blocked_slots

id
data
hora_inicio
hora_fim
motivo
created_at

appointment_history

id
appointment_id
status_anterior
status_novo
created_at

Adaptar a estrutura se necessário, mas manter separação clara entre entidades.

30. SEGURANÇA

Não confiar apenas no frontend.

Validar no backend:

permissões;

disponibilidade;

assinatura;

validade;

benefício;

conflitos;

alteração de status.

Clientes só podem acessar seus próprios dados.

Admin/barbeiro possui permissões administrativas.

Nunca expor dados de outros clientes.

Nunca permitir que o cliente altere manualmente:

preço;

status;

plano;

benefício utilizado;

data de validade.

31. TRATAMENTO DE ERROS

Toda ação deve possuir estados:

loading;

sucesso;

erro;

vazio.

Mensagens devem ser humanas.

Exemplo:

Em vez de:

"500 INTERNAL SERVER ERROR"

usar:

"Não foi possível concluir o agendamento. Tente novamente."

Se um horário ficar ocupado durante a confirmação:

"Esse horário acabou de ser reservado. Escolha outro horário."

32. EXPERIÊNCIA MOBILE

Utilizar:

bottom navigation quando fizer sentido;

botões grandes;

áreas de toque confortáveis;

cards compactos;

animações suaves;

skeleton loading;

feedback visual após ações;

modais/bottom sheets apropriados para mobile.

Evitar:

menus complicados;

excesso de páginas;

formulários longos;

informações desnecessárias.

33. NAVEGAÇÃO DO CLIENTE

Criar navegação simples:

Início

Agendar

Meus horários

Assinatura

Perfil

Não mostrar área administrativa para cliente.

34. NAVEGAÇÃO DO BARBEIRO

Criar:

Hoje

Agenda

Clientes

Assinaturas

Mais

A tela "Hoje" deve ser a principal.

35. DESIGN DOS CARDS

Cards:

fundo preto/cinza muito escuro;

borda dourada extremamente sutil;

raio moderado;

sombra suave;

espaço interno adequado.

Não transformar cada elemento em um card.

Manter hierarquia visual.

36. DASHBOARD

No topo:

Logo CB.

"Bom dia, Cleisson."

Depois:

HOJE

8 agendamentos

3 assinantes

5 clientes normais

Depois:

PRÓXIMO ATENDIMENTO

14:30

João Silva

Cabelo

[VER]

Depois:

AGENDA

Lista dos próximos atendimentos.

37. CONFIGURAÇÕES ADMINISTRATIVAS

Criar área para o barbeiro configurar:

horário de funcionamento;

serviços;

preços;

bloqueios;

informações da barbearia.

Porém, manter a Fase 1 simples.

Não criar painel financeiro avançado.

38. NÃO IMPLEMENTAR NESTA FASE

Não adicionar:

pagamentos online;

marketplace;

multi-barbearias;

sistema de afiliados;

IA;

chat;

programa de pontos;

avaliações;

estoque;

emissão fiscal;

contabilidade;

campanhas de marketing;

notificações complexas;

aplicativo nativo;

funcionalidades desktop específicas.

Esses recursos podem existir futuramente.

39. PRINCÍPIOS DE DESENVOLVIMENTO

Priorizar:

funcionamento correto;

segurança;

consistência dos dados;

experiência mobile;

simplicidade;

velocidade;

estética premium.

Não sacrificar lógica de negócio para criar animações.

Não criar funcionalidades falsas ou botões sem função.

Todos os botões principais devem funcionar.

Não usar dados mockados na versão funcional final.

40. DADOS INICIAIS

Criar os serviços e planos oficiais já cadastrados no banco.

Serviços:

Cabelo — 30
Barba — 20
Cabelo + Barba — 50
Pezinho — 10
Sobrancelha — 10

Planos:

Corte — 100 — 4 cortes
Barba — 70 — 4 barbas
Combo Básico — 160 — 4 cortes + 4 barbas
Corte Premium — 180 — corte ilimitado — 30 dias
Barba Premium — 120 — barba ilimitada — 30 dias
Corte + Barba Ilimitados — 260 — corte + barba ilimitados — 30 dias

41. CRITÉRIOS DE ACEITAÇÃO

Considerar a Fase 1 pronta somente quando:

AGENDAMENTO

[ ] Cliente consegue agendar.

[ ] Cliente consegue escolher serviço.

[ ] Cliente consegue escolher data.

[ ] Cliente consegue escolher horário.

[ ] Horários ocupados ficam indisponíveis.

[ ] Não existe double booking.

[ ] Cliente recebe confirmação.

BARBEIRO

[ ] Barbeiro consegue visualizar agenda.

[ ] Barbeiro consegue criar agendamento.

[ ] Barbeiro consegue cancelar.

[ ] Barbeiro consegue concluir.

[ ] Barbeiro consegue visualizar clientes.

[ ] Barbeiro consegue visualizar histórico.

ASSINATURAS

[ ] Todos os 6 planos estão cadastrados.

[ ] Sistema identifica plano do cliente.

[ ] Sistema valida benefícios.

[ ] Plano limitado respeita quantidade.

[ ] Plano ilimitado respeita validade.

[ ] Agendamento não consome benefício.

[ ] Atendimento concluído consome benefício.

[ ] Cancelamento não consome benefício.

[ ] Benefício não pode ser consumido duas vezes.

[ ] Assinatura expirada não pode ser utilizada.

PWA

[ ] Manifest configurado.

[ ] Ícone oficial configurado.

[ ] Nome Cleisson Barber Club.

[ ] Pode ser instalado na tela inicial.

[ ] Interface funciona corretamente em smartphone.

42. TESTES OBRIGATÓRIOS

Antes de considerar pronto, testar pelo menos:

Cliente comum agendando cabelo.

Cliente comum agendando barba.

Cliente comum agendando cabelo + barba.

Dois clientes tentando reservar o mesmo horário.

Cliente cancelando.

Barbeiro cancelando.

Barbeiro concluindo atendimento.

Cliente com Corte Básico usando o primeiro corte.

Cliente com Corte Básico tentando usar o quinto corte.

Cliente com Barba Básica usando benefício.

Cliente com Combo usando corte.

Cliente com Combo usando barba.

Cliente Premium fazendo vários cortes.

Cliente Premium com assinatura expirada.

Tentativa de usar assinatura para serviço incompatível.

Atendimento concluído duas vezes.

Horário bloqueado.

Agendamento fora do horário de funcionamento.

Data passada.

Cliente tentando acessar dados administrativos.

Barbeiro visualizando histórico.

Instalação PWA em Android.

Corrigir todos os problemas encontrados antes de considerar a implementação concluída.

43. REGRA FINAL

Não invente regras comerciais.

Quando uma regra não estiver especificada, não assuma silenciosamente.

Estruture o código de forma que regras futuras possam ser adicionadas sem reescrever todo o sistema.

O objetivo é criar uma base profissional, estável e escalável, mas manter a experiência da Fase 1 extremamente simples.

O produto final deve parecer um aplicativo premium criado especificamente para a Cleisson Barber Club.

Nome do aplicativo:

CLEISSON BARBER CLUB

Foco:

📱 Mobile Only
📲 PWA instalável
💈 Agendamento
⭐ Assinaturas
👤 Clientes
📅 Agenda
📊 Gestão básica
🖤 Dourado + preto + branco
👑 Identidade oficial da Cleisson Barber Club

Comece pela arquitetura do projeto, banco de dados, autenticação, regras de negócio e estrutura das telas. Depois implemente a interface mobile e conecte todas as ações ao backend real.

Não finalize apenas com protótipos visuais. O resultado deve ser funcional.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cleisson-barber-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6513fd76-f272-46c6-a42f-a10362fea081).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
