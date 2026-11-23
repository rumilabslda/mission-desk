import type { Translation } from '../types';
import type { assistant as en } from '../en/assistant';

export const assistant: Translation<typeof en> = {
  'assistant.title': 'Assistente',
  'assistant.closeShortcut': 'Fechar (⌘J)',
  'assistant.copy': 'Copiar',
  'assistant.copied': 'Copiado',
  'assistant.stop': 'Parar',

  // Models and effort (the menus under the chat and in Settings)
  'assistant.model.default': 'Padrão (Claude Code)',
  'assistant.effort.low': 'baixo',
  'assistant.effort.medium': 'médio',
  'assistant.effort.high': 'alto',
  'assistant.effort.xhigh': 'muito alto',
  'assistant.effort.max': 'máximo',

  // The "/" menu
  'assistant.command.brief': 'Seu dia em todas as contas',
  'assistant.command.waiting': 'Quem está esperando por você',
  'assistant.command.prep': 'Preparar sua próxima reunião',
  'assistant.command.schedule': 'Encontrar um horário e agendar',
  'assistant.command.reply': 'Rascunhar uma resposta à conversa aberta',
  'assistant.command.summarize': 'Resumir o que está na tela',
  'assistant.command.catchup': 'O que aconteceu em uma conta',

  // Tool steps in an answer
  'assistant.tool.currentContext': 'Olhando sua tela',
  'assistant.tool.listAccounts': 'Listando contas',
  'assistant.tool.readPage': 'Lendo {account}',
  'assistant.tool.readPageTab': 'Lendo {account} · {tab}',
  'assistant.tool.readPageAny': 'Lendo uma página',
  'assistant.tool.readPageAnyTab': 'Lendo uma página · {tab}',
  'assistant.tool.getElements': 'Olhando {account}',
  'assistant.tool.getElementsAny': 'Olhando a página',
  'assistant.tool.screenshot': 'Captura de tela de {account}',
  'assistant.tool.screenshotAny': 'Captura de tela da página',
  'assistant.tool.openUrl': 'Abrindo uma página em {account}',
  'assistant.tool.openUrlAny': 'Abrindo uma página em uma conta',
  'assistant.tool.click': 'Clicando em {account}',
  'assistant.tool.clickAny': 'Clicando em uma conta',
  'assistant.tool.type': 'Digitando em {account}',
  'assistant.tool.typeAny': 'Digitando em uma conta',
  'assistant.tool.press': 'Pressionando {key}',
  'assistant.tool.pressAny': 'Pressionando uma tecla',
  'assistant.tool.calendarEvents': 'Verificando calendários',
  'assistant.tool.findFreeTime': 'Procurando horários livres',
  'assistant.tool.createEvent': 'Aguardando seu OK para criar o evento',
  'assistant.tool.unreadCounts': 'Contando não lidas',

  // The chat panel
  'assistant.panel.scopeTitle': 'Para qual espaço este assistente trabalha',
  'assistant.panel.history': 'Histórico',
  'assistant.panel.newChat': 'Novo chat',
  'assistant.history.title': '{scope} · histórico',
  'assistant.history.empty': 'Nenhuma conversa ainda.',
  'assistant.history.deleteLabel': 'Apagar {title}',
  'assistant.empty.off': 'O assistente está desativado em <b>{scope}</b>.',
  'assistant.empty.openSettings': 'Abrir Ajustes → Assistente',
  'assistant.empty.noAccount': 'Nenhuma conta em <b>{scope}</b> está ativada para o assistente ainda.',
  'assistant.empty.chooseInSettings': 'Escolha em Ajustes → Assistente',
  'assistant.empty.askAll': 'Pergunte qualquer coisa sobre <b>todas as suas contas</b>, ou comece com:',
  'assistant.empty.askScope': 'Pergunte qualquer coisa sobre <b>{scope}</b>, ou comece com:',
  'assistant.empty.seesAll': 'Ele vê todas as contas compartilhadas.',
  'assistant.empty.seesScope': 'Ele só vê as contas de {scope}: {accounts}.',
  'assistant.empty.tip': 'Digite / para comandos, @ para uma conta. Nada é enviado em seu nome.',
  'assistant.working': 'Trabalhando…',
  'assistant.problem.signedOut': '<b>O Claude Code não pode responder: você precisa fazer login novamente.</b> Abra o Terminal e execute <code>claude auth login</code>, depois tente novamente.',
  'assistant.problem.failed': 'Algo deu errado.',
  'assistant.problem.retry': 'Tentar novamente',
  'assistant.compose.placeholderOff': 'O assistente está desativado neste espaço',
  'assistant.compose.placeholder': 'Pergunte, ou digite / para comandos…',
  'assistant.compose.placeholderNoAccount': 'Ative uma conta primeiro (Ajustes → Assistente)',
  'assistant.compose.model': 'Modelo',
  'assistant.compose.changeEngine': 'Altere em Ajustes → Assistente',
  'assistant.compose.effort': 'Esforço (o quanto ele pensa)',
  'assistant.compose.send': 'Enviar',

  // The chat window before the chat (an engine that isn't connected)
  'assistant.window.notConnected': 'Este espaço usa o <b>{engine}</b>, que ainda não está conectado.',
  'assistant.window.connect': 'Conecte em Ajustes → Integrações',
  'assistant.window.chooseAnother': 'Ou escolha outro assistente para este espaço em <link>Ajustes → Assistente</link>.',

  // The floating button
  'assistant.fab.closeTitle': 'Fechar o assistente  (⌘J)',
  'assistant.fab.close': 'Fechar o assistente',
  'assistant.fab.actionsTitle': 'Ações rápidas · arraste para mover',
  'assistant.fab.actions': 'Ações rápidas',

  // Setup steps
  'assistant.setup.intro':
    'O assistente lê suas contas e responde perguntas, rascunha respostas e encontra horários para reuniões. Ele funciona com o <b>Claude Code</b>, no seu próprio plano do Claude. Duas etapas para começar:',
  'assistant.setup.connectClaude': 'Conectar o Claude',
  'assistant.setup.checking': 'Verificando…',
  'assistant.setup.notInstalled': 'O Claude Code ainda não está neste Mac. Abra o Terminal, cole isto e pressione Return:',
  'assistant.setup.needsPlan': 'É preciso um plano Claude Pro ou Max (ou uma conta do Anthropic Console).',
  'assistant.setup.installed': 'Já instalei',
  'assistant.setup.signInIntro': 'Faça login com sua conta do Claude. O navegador vai abrir; volte aqui quando ele disser que o login foi feito.',
  'assistant.setup.waiting': 'Aguardando você concluir no navegador…',
  'assistant.setup.slow': 'Está demorando? Abra o Terminal e execute <code>claude auth login</code>, depois <link>verifique de novo</link>.',
  'assistant.setup.signIn': 'Fazer login no Claude',
  'assistant.setup.signInFailed': 'O login ainda não foi feito. Você também pode abrir o Terminal e executar <code>claude auth login</code>, depois <link>verificar de novo</link>.',
  'assistant.setup.chooseAccounts': 'Escolha o que ele pode ler',
  'assistant.setup.accountsIntro': 'Só estas contas ficam visíveis para ele. Ele nunca envia nada em seu nome; para clicar ou digitar, ele pergunta antes.',
  'assistant.setup.changeLater': 'Você pode mudar isso depois em Ajustes → Assistente.',

  // Connect Claude (Claude Code / Claude Desktop on this Mac)
  'assistant.connect.title': 'Conectar o Claude',
  'assistant.connect.hint': 'Permita que o Claude Code ou o Claude Desktop neste Mac leiam e trabalhem nas contas que você escolher. Nada sai do seu Mac, a não ser pelo próprio Claude.',
  'assistant.connect.allow': 'Permitir que o Claude se conecte',
  'assistant.connect.claudeCode': 'Claude Code — execute no Terminal',
  'assistant.connect.claudeDesktop': 'Claude Desktop — adicione ao claude_desktop_config.json',
  'assistant.connect.accessHint':
    'Depois, dê acesso a cada conta (Ajustes → Contas, ou clique nela com o botão direito → <b>Acesso do Claude</b>): Ler, ou Ler e agir. O Claude precisa perguntar a você antes de clicar ou digitar, e você pode pará-lo a qualquer momento com ⌘.',

  // The banner while Claude acts in an account
  'assistant.banner.working': 'O Claude está trabalhando em <b>{name}</b>',
  'assistant.banner.thisAccount': 'esta conta',

  // Conversations
  'assistant.conversation.newTitle': 'Novo chat',
  'assistant.startedFresh': '(O contexto anterior desta conversa não estava mais disponível, então recomecei do zero.)',

  // Errors shown in the chat
  'assistant.error.claudeNotInstalled': 'O Claude Code não está instalado.',
  'assistant.error.claudeReported': 'O Claude Code informou um erro.',
  'assistant.error.claudeStopped': 'O Claude Code parou inesperadamente.',
  'assistant.error.defaultModel':
    'O modelo padrão do próprio Claude Code não pode ser usado aqui (a mensagem foi: “{message}”). Escolha um modelo para este espaço, como Sonnet ou Opus, no menu abaixo do chat ou em Ajustes → Assistente. Ou corrija o "model" nos seus ajustes do Claude Code (~/.claude/settings.json).',
  'assistant.error.codexNotInstalled': 'O OpenAI Codex não está instalado.',
  'assistant.error.codexCouldNotAnswer': 'O Codex não conseguiu responder.',
  'assistant.error.codexReported': 'O Codex informou um erro.',
  'assistant.error.codexStopped': 'O Codex parou inesperadamente.',
  'assistant.error.codexForbiddenServer': 'O Codex tentou usar uma ferramenta de “{server}”, o que o Mission Desk não permite, então a resposta foi interrompida.',
  'assistant.error.codexForbiddenOtherServer': 'O Codex tentou usar uma ferramenta de “outro servidor”, o que o Mission Desk não permite, então a resposta foi interrompida.',
  'assistant.error.codexForbiddenCommand': 'O Codex tentou usar um comando no Mac, o que o Mission Desk não permite, então a resposta foi interrompida.',
  'assistant.error.codexForbiddenBuiltIn': 'O Codex tentou usar a ferramenta integrada “{tool}”, o que o Mission Desk não permite, então a resposta foi interrompida.',
  'assistant.error.openRouterStatus': 'O OpenRouter respondeu {status}.',
  'assistant.error.openRouterConnect': 'Conecte o OpenRouter em Ajustes → Integrações.',
  'assistant.error.tooManySteps': '(Interrompido: etapas demais para uma resposta.)',
  'assistant.error.modelError': 'O modelo retornou um erro.',
  'assistant.error.modelStopped': 'O modelo parou com um erro.',

  // Connecting OpenRouter
  'assistant.openRouter.keyRejected': 'O OpenRouter não aceitou esta chave.',
  'assistant.openRouter.statusRetry': 'O OpenRouter respondeu {status}. Tente novamente.',
  'assistant.openRouter.unreachable': 'Não foi possível acessar o OpenRouter. Verifique a conexão.',
  'assistant.keychainUnavailable': 'As Chaves do macOS não estão disponíveis, então a chave não foi salva.',
  "assistant.error.claudeAccountMissing": "A conta Claude deste espaço foi removida. Escolha a conta Claude dele em Ajustes → Assistente.",
  "assistant.panel.memory": "Memória: o que o assistente deste espaço sabe",
};
