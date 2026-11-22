import type { Translation } from '../types';
import type { assistant as en } from '../en/assistant';

export const assistant: Translation<typeof en> = {
  'assistant.title': 'Assistente',
  'assistant.closeShortcut': 'Fechar (⌘J)',
  'assistant.copy': 'Copiar',
  'assistant.copied': 'Copiado',
  'assistant.stop': 'Parar',

  // Models and effort (the menus under the chat and in Settings)
  'assistant.model.default': 'Predefinido (Claude Code)',
  'assistant.effort.low': 'baixo',
  'assistant.effort.medium': 'médio',
  'assistant.effort.high': 'alto',
  'assistant.effort.xhigh': 'muito alto',
  'assistant.effort.max': 'máximo',

  // The "/" menu
  'assistant.command.brief': 'O seu dia em todas as contas',
  'assistant.command.waiting': 'Quem está à sua espera',
  'assistant.command.prep': 'Preparar a próxima reunião',
  'assistant.command.schedule': 'Encontrar uma hora e marcar',
  'assistant.command.reply': 'Redigir uma resposta à conversa aberta',
  'assistant.command.summarize': 'Resumir o que está no ecrã',
  'assistant.command.catchup': 'O que aconteceu numa conta',

  // Tool steps in an answer
  'assistant.tool.currentContext': 'A ver o seu ecrã',
  'assistant.tool.listAccounts': 'A listar as contas',
  'assistant.tool.readPage': 'A ler {account}',
  'assistant.tool.readPageTab': 'A ler {account} · {tab}',
  'assistant.tool.readPageAny': 'A ler uma página',
  'assistant.tool.readPageAnyTab': 'A ler uma página · {tab}',
  'assistant.tool.getElements': 'A analisar {account}',
  'assistant.tool.getElementsAny': 'A analisar a página',
  'assistant.tool.screenshot': 'Captura de ecrã de {account}',
  'assistant.tool.screenshotAny': 'Captura de ecrã da página',
  'assistant.tool.openUrl': 'A abrir uma página em {account}',
  'assistant.tool.openUrlAny': 'A abrir uma página numa conta',
  'assistant.tool.click': 'A clicar em {account}',
  'assistant.tool.clickAny': 'A clicar numa conta',
  'assistant.tool.type': 'A escrever em {account}',
  'assistant.tool.typeAny': 'A escrever numa conta',
  'assistant.tool.press': 'A premir {key}',
  'assistant.tool.pressAny': 'A premir uma tecla',
  'assistant.tool.calendarEvents': 'A consultar os calendários',
  'assistant.tool.findFreeTime': 'A procurar tempo livre',
  'assistant.tool.createEvent': 'À espera da sua confirmação para criar o evento',
  'assistant.tool.unreadCounts': 'A contar as não lidas',

  // The chat panel
  'assistant.panel.scopeTitle': 'Para que espaço trabalha este assistente',
  'assistant.panel.history': 'Histórico',
  'assistant.panel.newChat': 'Nova conversa',
  'assistant.history.title': '{scope} · histórico',
  'assistant.history.empty': 'Ainda não há conversas.',
  'assistant.history.deleteLabel': 'Apagar {title}',
  'assistant.empty.off': 'O assistente está desativado em <b>{scope}</b>.',
  'assistant.empty.openSettings': 'Abrir Definições → Assistente',
  'assistant.empty.noAccount': 'Ainda não há nenhuma conta em <b>{scope}</b> ativada para o assistente.',
  'assistant.empty.chooseInSettings': 'Escolher em Definições → Assistente',
  'assistant.empty.askAll': 'Pergunte o que quiser sobre <b>todas as suas contas</b>, ou comece por:',
  'assistant.empty.askScope': 'Pergunte o que quiser sobre <b>{scope}</b>, ou comece por:',
  'assistant.empty.seesAll': 'Vê todas as contas partilhadas.',
  'assistant.empty.seesScope': 'Só vê as contas de {scope}: {accounts}.',
  'assistant.empty.tip': 'Escreva / para comandos e @ para uma conta. Nada é enviado por si.',
  'assistant.working': 'A trabalhar…',
  'assistant.problem.signedOut': '<b>O Claude Code não consegue responder: precisa que inicie sessão novamente.</b> Abra o Terminal, execute <code>claude auth login</code> e tente novamente.',
  'assistant.problem.failed': 'Algo correu mal.',
  'assistant.problem.retry': 'Tentar novamente',
  'assistant.compose.placeholderOff': 'O assistente está desativado neste espaço',
  'assistant.compose.placeholder': 'Pergunte ou escreva / para comandos…',
  'assistant.compose.placeholderNoAccount': 'Ative primeiro uma conta (Definições → Assistente)',
  'assistant.compose.model': 'Modelo',
  'assistant.compose.changeEngine': 'Alterar em Definições → Assistente',
  'assistant.compose.effort': 'Esforço (quanto pensa)',
  'assistant.compose.send': 'Enviar',

  // The chat window before the chat (an engine that isn't connected)
  'assistant.window.notConnected': 'Este espaço usa <b>{engine}</b>, que ainda não está ligado.',
  'assistant.window.connect': 'Ligue-o em Definições → Integrações',
  'assistant.window.chooseAnother': 'Ou escolha outro assistente para este espaço em <link>Definições → Assistente</link>.',

  // The floating button
  'assistant.fab.closeTitle': 'Fechar o assistente  (⌘J)',
  'assistant.fab.close': 'Fechar o assistente',
  'assistant.fab.actionsTitle': 'Ações rápidas · arraste para mover',
  'assistant.fab.actions': 'Ações rápidas',

  // Setup steps
  'assistant.setup.intro':
    'O assistente lê as suas contas e responde a perguntas, redige respostas e encontra horários para reuniões. Funciona com o <b>Claude Code</b> e com o seu próprio plano Claude. Dois passos para começar:',
  'assistant.setup.connectClaude': 'Ligar o Claude',
  'assistant.setup.checking': 'A verificar…',
  'assistant.setup.notInstalled': 'O Claude Code ainda não está neste Mac. Abra o Terminal, cole isto e prima Return:',
  'assistant.setup.needsPlan': 'Precisa de um plano Claude Pro ou Max (ou de uma conta da Anthropic Console).',
  'assistant.setup.installed': 'Já instalei',
  'assistant.setup.signInIntro': 'Inicie sessão com a sua conta Claude. O navegador abre; volte aqui quando indicar que a sessão foi iniciada.',
  'assistant.setup.waiting': 'À espera que termine no navegador…',
  'assistant.setup.slow': 'Está a demorar? Abra o Terminal, execute <code>claude auth login</code> e depois <link>verifique novamente</link>.',
  'assistant.setup.signIn': 'Iniciar sessão no Claude',
  'assistant.setup.signInFailed': 'Ainda sem sessão iniciada. Também pode abrir o Terminal, executar <code>claude auth login</code> e depois <link>verificar novamente</link>.',
  'assistant.setup.chooseAccounts': 'Escolha o que pode ler',
  'assistant.setup.accountsIntro': 'Só estas contas lhe ficam visíveis. Nunca envia nada por si; para clicar ou escrever, pergunta primeiro.',
  'assistant.setup.changeLater': 'Pode alterar isto mais tarde em Definições → Assistente.',

  // Connect Claude (Claude Code / Claude Desktop on this Mac)
  'assistant.connect.title': 'Ligar o Claude',
  'assistant.connect.hint': 'Permita que o Claude Code ou o Claude Desktop neste Mac leiam e trabalhem nas contas que escolher. Nada sai do seu Mac a não ser através do próprio Claude.',
  'assistant.connect.allow': 'Permitir a ligação do Claude',
  'assistant.connect.claudeCode': 'Claude Code — executar no Terminal',
  'assistant.connect.claudeDesktop': 'Claude Desktop — adicionar a claude_desktop_config.json',
  'assistant.connect.accessHint':
    'Depois, dê acesso a cada conta (Definições → Contas, ou clique na conta com o botão direito → <b>Acesso do Claude</b>): Ler, ou Ler e agir. O Claude tem de lhe perguntar antes de clicar ou escrever, e pode pará-lo a qualquer momento com ⌘.',

  // The banner while Claude acts in an account
  'assistant.banner.working': 'O Claude está a trabalhar em <b>{name}</b>',
  'assistant.banner.thisAccount': 'esta conta',

  // Conversations
  'assistant.conversation.newTitle': 'Nova conversa',
  'assistant.startedFresh': '(O contexto anterior desta conversa já não estava disponível, por isso recomecei do zero.)',

  // Errors shown in the chat
  'assistant.error.claudeNotInstalled': 'O Claude Code não está instalado.',
  'assistant.error.claudeReported': 'O Claude Code comunicou um erro.',
  'assistant.error.claudeStopped': 'O Claude Code parou inesperadamente.',
  'assistant.error.defaultModel':
    'O modelo predefinido do próprio Claude Code não pode ser usado aqui (a mensagem foi: “{message}”). Escolha um modelo para este espaço, como o Sonnet ou o Opus, no menu por baixo da conversa ou em Definições → Assistente. Ou corrija o “model” nas definições do Claude Code (~/.claude/settings.json).',
  'assistant.error.codexNotInstalled': 'O OpenAI Codex não está instalado.',
  'assistant.error.codexCouldNotAnswer': 'O Codex não conseguiu responder.',
  'assistant.error.codexReported': 'O Codex comunicou um erro.',
  'assistant.error.codexStopped': 'O Codex parou inesperadamente.',
  'assistant.error.codexForbiddenServer': 'O Codex tentou usar uma ferramenta de “{server}”, o que o Mission Desk não permite, por isso a resposta foi interrompida.',
  'assistant.error.codexForbiddenOtherServer': 'O Codex tentou usar uma ferramenta de “outro servidor”, o que o Mission Desk não permite, por isso a resposta foi interrompida.',
  'assistant.error.codexForbiddenCommand': 'O Codex tentou usar um comando no Mac, o que o Mission Desk não permite, por isso a resposta foi interrompida.',
  'assistant.error.codexForbiddenBuiltIn': 'O Codex tentou usar a sua ferramenta integrada “{tool}”, o que o Mission Desk não permite, por isso a resposta foi interrompida.',
  'assistant.error.openRouterStatus': 'O OpenRouter respondeu {status}.',
  'assistant.error.openRouterConnect': 'Ligue o OpenRouter em Definições → Integrações.',
  'assistant.error.tooManySteps': '(Interrompido: demasiados passos para uma só resposta.)',
  'assistant.error.modelError': 'O modelo devolveu um erro.',
  'assistant.error.modelStopped': 'O modelo parou com um erro.',

  // Connecting OpenRouter
  'assistant.openRouter.keyRejected': 'O OpenRouter não aceitou esta chave.',
  'assistant.openRouter.statusRetry': 'O OpenRouter respondeu {status}. Tente novamente.',
  'assistant.openRouter.unreachable': 'Não foi possível contactar o OpenRouter. Verifique a ligação.',
  'assistant.keychainUnavailable': 'O Porta-chaves do macOS não está disponível, por isso a chave não foi guardada.',
  "assistant.error.claudeAccountMissing": "A conta Claude deste espaço foi removida. Escolha a conta Claude dele em Definições → Assistente.",
};
