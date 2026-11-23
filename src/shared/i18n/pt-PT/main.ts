import type { Translation } from '../types';
import type { main as en } from '../en/main';

export const main: Translation<typeof en> = {
  // The app menu (Mission Desk). {app} is the app's name.
  'main.menu.about': 'Acerca de {app}',
  'main.menu.services': 'Serviços',
  'main.menu.hide': 'Ocultar {app}',
  'main.menu.hideOthers': 'Ocultar outras',
  'main.menu.showAll': 'Mostrar todas',
  'main.menu.quit': 'Sair de {app}',
  'main.menu.checkForUpdates': 'Procurar atualizações…',
  'main.menu.settings': 'Definições…',
  'main.menu.assistant': 'Assistente',
  'main.menu.connectClaude': 'Ligar o Claude…',
  // Edit
  'main.menu.edit': 'Edição',
  'main.menu.undo': 'Desfazer',
  'main.menu.redo': 'Refazer',
  'main.menu.cut': 'Cortar',
  'main.menu.copy': 'Copiar',
  'main.menu.paste': 'Colar',
  'main.menu.pasteAndMatchStyle': 'Colar e igualar estilo',
  'main.menu.selectAll': 'Selecionar tudo',
  'main.menu.speech': 'Fala',
  'main.menu.startSpeaking': 'Iniciar fala',
  'main.menu.stopSpeaking': 'Parar fala',
  // View
  'main.menu.view': 'Visualização',
  'main.menu.reload': 'Recarregar',
  'main.menu.forward': 'Avançar',
  'main.menu.sidebarStyle': 'Estilo da barra lateral',
  'main.menu.sidebarFolders': 'Pastas',
  'main.menu.sidebarPanel': 'Pastas com painel',
  'main.menu.sidebarSections': 'Secções',
  'main.menu.devTools': 'Ferramentas de programador para esta conta',
  'main.menu.toggleFullScreen': 'Ativar/desativar ecrã completo',
  // Accounts
  'main.menu.accounts': 'Contas',
  'main.menu.home': 'Início',
  'main.menu.allCalendars': 'Todos os calendários',
  'main.menu.copyMeetLink': 'Copiar link do Meet',
  'main.menu.newEvent': 'Novo evento',
  'main.menu.newTodo': 'Nova tarefa',
  'main.menu.account': 'Conta {n}',
  'main.menu.stopClaude': 'Parar o Claude',
  // Window
  'main.menu.window': 'Janela',
  'main.menu.minimize': 'Minimizar',
  'main.menu.zoom': 'Zoom',
  'main.menu.front': 'Passar tudo para a frente',
  // Help
  'main.menu.help': 'Ajuda',
  'main.menu.siteMissionDesk': 'Site do Mission Desk',
  'main.menu.siteRumiLabs': 'Site da Rumi Labs',

  // An account's right-click menu.
  'main.account.edit': 'Editar…',
  'main.account.muteNotifications': 'Silenciar notificações',
  'main.account.hibernate': 'Hibernar quando não estiver em uso',
  'main.account.icon': 'Ícone',
  'main.account.claudeAccess': 'Acesso do Claude',
  'main.account.accessRead': 'Ler',
  'main.account.accessAct': 'Ler e agir',
  'main.account.moveToSpace': 'Mover para o espaço',
  'main.account.newSpace': 'Novo espaço…',
  'main.account.moveUp': 'Mover para cima',
  'main.account.moveDown': 'Mover para baixo',
  'main.account.remove': 'Remover…',
  'main.account.removeTitle': 'Remover {name}?',
  'main.account.removeDetail': 'Isto termina a sessão e apaga os respetivos dados neste Mac.',

  // An account's icon (right-click → Icon).
  'main.icon.sameAs': 'Igual a {name}',
  'main.icon.auto': 'Logótipo da empresa ou fotografia',
  'main.icon.service': 'Logótipo do serviço',
  'main.icon.letter': 'Letra',
  'main.icon.chooseImage': 'Escolher imagem…',
  'main.icon.chooseTitle': 'Escolha uma imagem para {name}',
  'main.icon.imagesFilter': 'Imagens',
  'main.icon.openFailed': 'Não foi possível abrir essa imagem.',
  'main.icon.openFailedDetail': 'Experimente um ficheiro PNG ou JPEG.',

  // A space's right-click menu, and the + menu.
  'main.space.rename': 'Mudar o nome…',
  'main.space.alwaysOpen': 'Sempre aberto',
  'main.space.shareGoogle': 'Partilhar a sessão Google',
  'main.space.googleFrom': 'Sessão Google de',
  'main.space.ungroup': 'Desagrupar',
  'main.add.app': 'Adicionar app…',
  'main.add.space': 'Adicionar espaço…',

  // Quick actions (the ⚡ button's menu).
  'main.quick.title': 'Ações rápidas',
  'main.quick.titleFor': 'Ações rápidas · {name}',
  'main.quick.noGoogleInSpace': 'Adicione uma conta Google a este espaço',
  'main.quick.needGoogle': 'Adicione primeiro uma conta Google',
  'main.quick.askAssistant': 'Perguntar ao assistente',

  // Copy Meet Link.
  'main.meet.noLink': 'Sem link de reunião',
  'main.meet.noGoogle': 'Este espaço não tem nenhuma conta Google. Adicione uma para criar links do Meet.',
  'main.meet.creating': 'A criar um link de reunião…',
  'main.meet.copied': 'Link da reunião copiado',
  /** {link}: the link without https://; {keys}: ⌘V or Ctrl+V. */
  'main.meet.copiedDetail': '{link} · {keys} para colar',
  'main.meet.copiedBody': '{url} — cole-o com {keys}.',
  'main.meet.errorSignedOut': 'Inicie sessão no Google neste espaço e tente novamente.',
  'main.meet.errorOffline': 'O Mission Desk está sem Internet. Verifique a ligação e tente novamente.',
  'main.meet.errorForbidden': 'A Google recusou criar uma reunião para esta conta.',
  'main.meet.errorUnsupported': 'A Google não conseguiu criar uma reunião para esta conta.',
  'main.meet.errorGeneric': 'A Google não conseguiu criar uma reunião. Tente novamente daqui a pouco.',
  /** The title of the event Copy Meet Link creates in the user's Google Agenda. */
  'main.meet.quickCallTitle': 'Chamada rápida',

  // The assistant asks before it keeps a note, saves a skill or creates an event. {where}: a space's name.
  'main.assistant.thisSpace': 'este espaço',
  'main.assistant.rememberTitle': 'Memorizar isto para {where}?',
  'main.assistant.forgetTitle': 'Esquecer esta nota em {where}?',
  'main.assistant.rememberDetail':
    '{note}\n\nPedido pelo assistente. Só o assistente de {where} a vai ver. Pode ver e alterar todas as notas em Definições → Assistente.',
  'main.assistant.forgetDetail': '{note}\n\nPedido pelo assistente. Pode ver e alterar todas as notas em Definições → Assistente.',
  'main.assistant.remember': 'Memorizar',
  'main.assistant.forget': 'Esquecer',
  'main.assistant.saveSkillTitle': 'Guardar a skill “{name}” para {where}?',
  'main.assistant.saveSkillDetailAlways':
    'Sempre ativa: {description}\n\n{instructions}\n\nEscrita pelo assistente. Só vai estar ativa em {where}; pode alterá-la ou removê-la em Definições → Skills.',
  'main.assistant.saveSkillDetailFits':
    'Usada quando fizer sentido: {description}\n\n{instructions}\n\nEscrita pelo assistente. Só vai estar ativa em {where}; pode alterá-la ou removê-la em Definições → Skills.',
  'main.assistant.createEventTitle': 'Criar este evento?',
  'main.assistant.createEventDetail': '{event}\n\nPedido pelo assistente. Verifique os convidados e a descrição antes de criar.',
  'main.assistant.emailGuests': 'Enviar convites por e-mail aos convidados',

  // The assistant's scopes in per-space mode use common.allSpaces / common.noSpace.
  'main.scope.everything': 'Tudo',

  // Claude acting in an account.
  'main.claude.consentTitle': 'Permitir que o Claude atue em {name} durante 30 minutos?',
  'main.claude.consentDetail': 'O Claude vai poder clicar e escrever nesta conta. Pode pará-lo a qualquer momento com o botão Parar ou com ⌘.',
  'main.claude.allow': 'Permitir',
  'main.claude.deny': 'Recusar',
  'main.claude.socketError': 'Não foi possível abrir a ligação: {error}',

  // Adding a skill by link (Settings → Skills).
  'main.skills.fetchBadLink': 'Use um link https para um ficheiro SKILL.md (também serve um link do GitHub para o ficheiro ou para a pasta).',
  'main.skills.fetchNotFound': 'Não há nenhum SKILL.md nesse link.',
  'main.skills.fetchStatus': 'O link respondeu {status}.',
  'main.skills.fetchNotHttps': 'O link foi redirecionado para um endereço que não é https.',
  'main.skills.fetchWebPage': 'Isso é uma página web, não um ficheiro SKILL.md. Use o link do próprio ficheiro.',
  'main.skills.fetchTooBig': 'Esse ficheiro é demasiado grande para uma skill.',
  'main.skills.fetchNotText': 'Isso não é um ficheiro de texto.',
  'main.skills.fetchEmpty': 'Esse ficheiro está vazio.',
  'main.skills.fetchTooLong': 'Essa skill é mais longa do que o Mission Desk permite ({max} caracteres).',
  'main.skills.fetchFailed': 'Não foi possível obter esse link. Verifique o endereço e a ligação.',
  'main.skills.fetchNotAllowed': 'Não permitido.',
  'main.openRouter.badKey': 'Isso não parece uma chave do OpenRouter.',

  // Updates.
  'main.updates.readyTitle': 'O Mission Desk {version} está pronto',
  'main.updates.readyBody': 'Reinicie o Mission Desk para concluir, ou a atualização é instalada da próxima vez que sair.',
  'main.updates.checkFailed': 'Não foi possível contactar o GitHub para verificar. Verifique a ligação e tente novamente.',
  'main.updates.checkFailedOther': 'Não foi possível procurar uma versão nova neste momento. Tente mais tarde.',
  'main.updates.downloadFailed': 'Não foi possível transferir a atualização. Tente novamente daqui a pouco.',
  'main.updates.installFailed': 'Não foi possível instalar a atualização. Em alternativa, transfira a versão nova a partir do site.',

  // Other windows and pages.
  'main.popup.signIn': 'Iniciar sessão',
  'main.errorPage.title': 'Sem ligação',
  'main.errorPage.message': 'Não é possível aceder a esta página. Verifique a ligação.',
  'main.errorPage.retry': 'Tentar novamente',
  'main.store.loadWarning': 'Não foi possível ler as contas guardadas, por isso o Mission Desk começou vazio. Foi guardada uma cópia como accounts.json.bak.',
  'main.calendar.noTitle': '(Sem título)',

  // About. {site}: the website without https://; {license}: the license's name (kept in English).
  'main.about.credits': '{site}\n{license}. Gratuito e de código aberto.',
  'main.about.licenseSummary':
    'Gratuito e de código aberto. Qualquer pessoa ou empresa o pode usar para qualquer fim, incluindo no trabalho, bem como alterá-lo e partilhá-lo. Quem partilhar o Mission Desk ou uma versão alterada tem de partilhar o código-fonte com a mesma licença, para que nunca se possa tornar um produto fechado.',
  "main.space.memory": "Memória…",
};
