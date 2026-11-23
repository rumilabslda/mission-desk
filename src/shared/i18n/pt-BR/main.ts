import type { Translation } from '../types';
import type { main as en } from '../en/main';

export const main: Translation<typeof en> = {
  // The app menu (Mission Desk). {app} is the app's name.
  'main.menu.about': 'Sobre o {app}',
  'main.menu.services': 'Serviços',
  'main.menu.hide': 'Ocultar {app}',
  'main.menu.hideOthers': 'Ocultar Outros',
  'main.menu.showAll': 'Mostrar Tudo',
  'main.menu.quit': 'Encerrar {app}',
  'main.menu.checkForUpdates': 'Buscar Atualizações…',
  'main.menu.settings': 'Ajustes…',
  'main.menu.assistant': 'Assistente',
  'main.menu.connectClaude': 'Conectar o Claude…',
  // Edit
  'main.menu.edit': 'Editar',
  'main.menu.undo': 'Desfazer',
  'main.menu.redo': 'Refazer',
  'main.menu.cut': 'Cortar',
  'main.menu.copy': 'Copiar',
  'main.menu.paste': 'Colar',
  'main.menu.pasteAndMatchStyle': 'Colar com o Mesmo Estilo',
  'main.menu.selectAll': 'Selecionar Tudo',
  'main.menu.speech': 'Fala',
  'main.menu.startSpeaking': 'Iniciar Fala',
  'main.menu.stopSpeaking': 'Parar Fala',
  // View
  'main.menu.view': 'Visualizar',
  'main.menu.reload': 'Recarregar',
  'main.menu.forward': 'Avançar',
  'main.menu.sidebarStyle': 'Estilo da barra lateral',
  'main.menu.sidebarFolders': 'Pastas',
  'main.menu.sidebarPanel': 'Pastas com painel',
  'main.menu.sidebarSections': 'Seções',
  'main.menu.devTools': 'Ferramentas de Desenvolvedor desta Conta',
  'main.menu.toggleFullScreen': 'Entrar/Sair da Tela Cheia',
  // Accounts
  'main.menu.accounts': 'Contas',
  'main.menu.home': 'Início',
  'main.menu.allCalendars': 'Todos os Calendários',
  'main.menu.copyMeetLink': 'Copiar Link do Meet',
  'main.menu.newEvent': 'Novo Evento',
  'main.menu.newTodo': 'Nova Tarefa',
  'main.menu.account': 'Conta {n}',
  'main.menu.stopClaude': 'Parar o Claude',
  // Window
  'main.menu.window': 'Janela',
  'main.menu.minimize': 'Minimizar',
  'main.menu.zoom': 'Zoom',
  'main.menu.front': 'Trazer Todas para a Frente',
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
  'main.account.moveUp': 'Mover para Cima',
  'main.account.moveDown': 'Mover para Baixo',
  'main.account.remove': 'Remover…',
  'main.account.removeTitle': 'Remover {name}?',
  'main.account.removeDetail': 'Isso encerra a sessão e apaga os dados dela neste Mac.',

  // An account's icon (right-click → Icon).
  'main.icon.sameAs': 'Igual a {name}',
  'main.icon.auto': 'Logo da empresa ou foto',
  'main.icon.service': 'Logo do serviço',
  'main.icon.letter': 'Letra',
  'main.icon.chooseImage': 'Escolher Imagem…',
  'main.icon.chooseTitle': 'Escolha uma imagem para {name}',
  'main.icon.imagesFilter': 'Imagens',
  'main.icon.openFailed': 'Não foi possível abrir essa imagem.',
  'main.icon.openFailedDetail': 'Tente um arquivo PNG ou JPEG.',

  // A space's right-click menu, and the + menu.
  'main.space.rename': 'Renomear…',
  'main.space.alwaysOpen': 'Sempre aberto',
  'main.space.shareGoogle': 'Compartilhar login do Google',
  'main.space.googleFrom': 'Login do Google de',
  'main.space.ungroup': 'Desagrupar',
  'main.add.app': 'Adicionar App…',
  'main.add.space': 'Adicionar Espaço…',

  // Quick actions (the ⚡ button's menu).
  'main.quick.title': 'Ações rápidas',
  'main.quick.titleFor': 'Ações rápidas · {name}',
  'main.quick.noGoogleInSpace': 'Adicione uma conta do Google a este espaço',
  'main.quick.needGoogle': 'Adicione uma conta do Google primeiro',
  'main.quick.askAssistant': 'Perguntar ao Assistente',

  // Copy Meet Link.
  'main.meet.noLink': 'Nenhum link de reunião',
  'main.meet.noGoogle': 'Este espaço não tem conta do Google. Adicione uma para criar links do Meet.',
  'main.meet.creating': 'Criando um link de reunião…',
  'main.meet.copied': 'Link da reunião copiado',
  /** {link}: the link without https://; {keys}: ⌘V or Ctrl+V. */
  'main.meet.copiedDetail': '{link} · {keys} para colar',
  'main.meet.copiedBody': '{url} — cole com {keys}.',
  'main.meet.errorSignedOut': 'Faça login no Google neste espaço e tente novamente.',
  'main.meet.errorOffline': 'O Mission Desk está offline. Verifique sua conexão e tente novamente.',
  'main.meet.errorForbidden': 'O Google se recusou a criar uma reunião para esta conta.',
  'main.meet.errorUnsupported': 'O Google não conseguiu criar uma reunião para esta conta.',
  'main.meet.errorGeneric': 'O Google não conseguiu criar uma reunião. Tente novamente em instantes.',
  /** The title of the event Copy Meet Link creates in the user's Google Agenda. */
  'main.meet.quickCallTitle': 'Chamada rápida',

  // The assistant asks before it keeps a note, saves a skill or creates an event. {where}: a space's name.
  'main.assistant.thisSpace': 'este espaço',
  'main.assistant.rememberTitle': 'Lembrar isto em {where}?',
  'main.assistant.forgetTitle': 'Esquecer esta nota em {where}?',
  'main.assistant.rememberDetail':
    '{note}\n\nPedido pelo assistente. Só o assistente de {where} vai vê-la. Você pode ver e alterar todas as notas em Ajustes → Assistente.',
  'main.assistant.forgetDetail': '{note}\n\nPedido pelo assistente. Você pode ver e alterar todas as notas em Ajustes → Assistente.',
  'main.assistant.remember': 'Lembrar',
  'main.assistant.forget': 'Esquecer',
  'main.assistant.saveSkillTitle': 'Salvar a skill “{name}” em {where}?',
  'main.assistant.saveSkillDetailAlways':
    'Sempre ativada: {description}\n\n{instructions}\n\nEscrita pelo assistente. Ela só ficará ativada em {where}; você pode alterá-la ou removê-la em Ajustes → Skills.',
  'main.assistant.saveSkillDetailFits':
    'Usada quando se encaixar: {description}\n\n{instructions}\n\nEscrita pelo assistente. Ela só ficará ativada em {where}; você pode alterá-la ou removê-la em Ajustes → Skills.',
  'main.assistant.createEventTitle': 'Criar este evento?',
  'main.assistant.createEventDetail': '{event}\n\nPedido pelo assistente. Confira os convidados e a descrição antes de criar.',
  'main.assistant.emailGuests': 'Enviar convites por e-mail aos convidados',

  // The assistant's scopes in per-space mode use common.allSpaces / common.noSpace.
  'main.scope.everything': 'Tudo',

  // Claude acting in an account.
  'main.claude.consentTitle': 'Permitir que o Claude aja em {name} por 30 minutos?',
  'main.claude.consentDetail': 'O Claude vai poder clicar e digitar nesta conta. Pare-o a qualquer momento com o botão Parar ou ⌘.',
  'main.claude.allow': 'Permitir',
  'main.claude.deny': 'Negar',
  'main.claude.socketError': 'Não foi possível abrir a conexão: {error}',

  // Adding a skill by link (Settings → Skills).
  'main.skills.fetchBadLink': 'Use um link https para um arquivo SKILL.md (um link do GitHub para o arquivo ou para a pasta dele também funciona).',
  'main.skills.fetchNotFound': 'Não há SKILL.md nesse link.',
  'main.skills.fetchStatus': 'O link respondeu {status}.',
  'main.skills.fetchNotHttps': 'O link redirecionou para um endereço que não é https.',
  'main.skills.fetchWebPage': 'Isso é uma página web, não um arquivo SKILL.md. Use o link do próprio arquivo.',
  'main.skills.fetchTooBig': 'Esse arquivo é grande demais para uma skill.',
  'main.skills.fetchNotText': 'Esse não é um arquivo de texto.',
  'main.skills.fetchEmpty': 'Esse arquivo está vazio.',
  'main.skills.fetchTooLong': 'Essa skill é mais longa do que o Mission Desk permite ({max} caracteres).',
  'main.skills.fetchFailed': 'Não foi possível buscar esse link. Confira o endereço e sua conexão.',
  'main.skills.fetchNotAllowed': 'Não permitido.',
  'main.openRouter.badKey': 'Isso não parece uma chave do OpenRouter.',

  // Updates.
  'main.updates.readyTitle': 'O Mission Desk {version} está pronto',
  'main.updates.readyBody': 'Reinicie o Mission Desk para concluir, ou a atualização será instalada na próxima vez que você o encerrar.',
  'main.updates.checkFailed': 'Não foi possível acessar o GitHub para verificar. Verifique sua conexão e tente novamente.',
  'main.updates.checkFailedOther': 'Não foi possível buscar uma versão nova agora. Tente novamente mais tarde.',
  'main.updates.downloadFailed': 'Não foi possível baixar a atualização. Tente novamente em instantes.',
  'main.updates.installFailed': 'Não foi possível instalar a atualização. Baixe a versão nova no site.',

  // Other windows and pages.
  'main.popup.signIn': 'Fazer login',
  'main.errorPage.title': 'Offline',
  'main.errorPage.message': 'Não foi possível acessar esta página. Verifique sua conexão.',
  'main.errorPage.retry': 'Tentar Novamente',
  'main.store.loadWarning': 'Não foi possível ler suas contas salvas, então o Mission Desk começou vazio. Uma cópia foi mantida como accounts.json.bak.',
  'main.calendar.noTitle': '(Sem título)',

  // About. {site}: the website without https://; {license}: the license's name (kept in English).
  'main.about.credits': '{site}\n{license}. Gratuito e de código aberto.',
  'main.about.licenseSummary':
    'Gratuito e de código aberto. Qualquer pessoa ou empresa pode usá-lo para qualquer fim, inclusive trabalho, além de alterá-lo e compartilhá-lo. Quem compartilhar o Mission Desk ou uma versão alterada deve compartilhar o código-fonte sob a mesma licença, para que ele nunca se torne um produto fechado.',
  "main.space.memory": "Memória…",
};
