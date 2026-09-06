# Redesign completo — Cleisson Barber Club

## Objetivo
Transformar o aplicativo atual em uma experiência mobile original, premium e coerente, mantendo a logo oficial, os dados reais, as regras de agendamento e os planos existentes. A direção aprovada é “Modern noir elegance”: Ônix & Ouro, Instrument Serif + Work Sans e jornada focada em uma decisão por tela.

## O que será construído
- Refazer o sistema visual global com preto quase absoluto, superfícies carvão quente, dourado moderado, off-white, bordas finas, sombras discretas e no máximo 8 px de raio nos cards.
- Criar uma estrutura de aplicativo consistente: cabeçalhos de marca, títulos editoriais, ações primárias, estados vazios/carregamento, indicadores de etapa e navegação inferior.
- Redesenhar a tela inicial com a logo oficial em destaque, chamada principal, acesso à conta, serviços e funcionamento, deixando a próxima seção visível na primeira tela.
- Reestruturar o agendamento em cinco etapas claras: serviço, calendário, horário, dados e confirmação; manter intervalos e disponibilidade vindos das regras atuais.
- Redesenhar login/cadastro, área do cliente, histórico, assinatura, benefícios, perfil e painel do barbeiro com a mesma linguagem visual.
- Destacar planos Premium com “MAIS VANTAJOSO ★★★”, sem alterar preços ou benefícios.
- Preservar o manifesto e a instalação no celular, atualizando apenas a apresentação coerente com a marca.

## Experiência no celular
- Áreas de toque confortáveis, conteúdo sem corte horizontal e ações principais fáceis de alcançar.
- Calendário mensal próprio da marca, com data selecionada em dourado, dias indisponíveis discretos e horários em grade.
- Navegação inferior compacta e segura para telas pequenas, com rótulos legíveis.
- Estados de seleção, indisponibilidade, carregamento, erro e confirmação visualmente consistentes.

## Limites
- Não alterar banco de dados, autenticação, preços, benefícios, horários de funcionamento ou regras de conflito.
- Não copiar cores, logo ou identidade do aplicativo de referência.
- Não recriar nem modificar a logo oficial da Cleisson.
- Não adicionar pagamentos ou outras regras não solicitadas.

## Detalhes técnicos
- Centralizar tokens e estilos globais, carregar Instrument Serif e Work Sans no cabeçalho do app e criar componentes visuais reutilizáveis.
- Usar os dados e funções existentes para serviços, planos, conta, disponibilidade e administração.
- Completar os metadados únicos de cada tela com título, descrição e compartilhamento social.
- Validar compilação e navegar pelos fluxos públicos e autenticados em viewport de 411 × 770, corrigindo overflow, contraste, alinhamento e estados.
