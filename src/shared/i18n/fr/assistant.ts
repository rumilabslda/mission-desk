import type { Translation } from '../types';
import type { assistant as en } from '../en/assistant';

export const assistant: Translation<typeof en> = {
  'assistant.title': 'Assistant',
  'assistant.closeShortcut': 'Fermer (⌘J)',
  'assistant.copy': 'Copier',
  'assistant.copied': 'Copié',
  'assistant.stop': 'Arrêter',

  // Models and effort (the menus under the chat and in Settings)
  'assistant.model.default': 'Par défaut (Claude Code)',
  'assistant.effort.low': 'faible',
  'assistant.effort.medium': 'moyen',
  'assistant.effort.high': 'élevé',
  'assistant.effort.xhigh': 'très élevé',
  'assistant.effort.max': 'max',

  // The "/" menu
  'assistant.command.brief': 'Votre journée dans tous vos comptes',
  'assistant.command.waiting': 'Qui attend une réponse de votre part',
  'assistant.command.prep': 'Préparer votre prochaine réunion',
  'assistant.command.schedule': 'Trouver un créneau et le réserver',
  'assistant.command.reply': 'Rédiger une réponse à la conversation ouverte',
  'assistant.command.summarize': 'Résumer ce qui est à l’écran',
  'assistant.command.catchup': 'Ce qui s’est passé dans un compte',

  // Tool steps in an answer
  'assistant.tool.currentContext': 'Examen de votre écran',
  'assistant.tool.listAccounts': 'Liste des comptes',
  'assistant.tool.readPage': 'Lecture de {account}',
  'assistant.tool.readPageTab': 'Lecture de {account} · {tab}',
  'assistant.tool.readPageAny': 'Lecture d’une page',
  'assistant.tool.readPageAnyTab': 'Lecture d’une page · {tab}',
  'assistant.tool.getElements': 'Examen de {account}',
  'assistant.tool.getElementsAny': 'Examen de la page',
  'assistant.tool.screenshot': 'Capture d’écran de {account}',
  'assistant.tool.screenshotAny': 'Capture d’écran de la page',
  'assistant.tool.openUrl': 'Ouverture d’une page dans {account}',
  'assistant.tool.openUrlAny': 'Ouverture d’une page dans un compte',
  'assistant.tool.click': 'Clic dans {account}',
  'assistant.tool.clickAny': 'Clic dans un compte',
  'assistant.tool.type': 'Saisie dans {account}',
  'assistant.tool.typeAny': 'Saisie dans un compte',
  'assistant.tool.press': 'Appui sur {key}',
  'assistant.tool.pressAny': 'Appui sur une touche',
  'assistant.tool.calendarEvents': 'Consultation des calendriers',
  'assistant.tool.findFreeTime': 'Recherche d’un créneau libre',
  'assistant.tool.createEvent': 'En attente de votre accord pour créer l’événement',
  'assistant.tool.unreadCounts': 'Comptage des non lus',

  // The chat panel
  'assistant.panel.scopeTitle': 'Espace pour lequel travaille cet assistant',
  'assistant.panel.history': 'Historique',
  'assistant.panel.newChat': 'Nouvelle discussion',
  'assistant.history.title': '{scope} · historique',
  'assistant.history.empty': 'Aucune conversation pour l’instant.',
  'assistant.history.deleteLabel': 'Supprimer {title}',
  'assistant.empty.off': 'L’assistant est désactivé pour <b>{scope}</b>.',
  'assistant.empty.openSettings': 'Ouvrir Réglages → Assistant',
  'assistant.empty.noAccount': 'Aucun compte de <b>{scope}</b> n’est encore activé pour l’assistant.',
  'assistant.empty.chooseInSettings': 'Choisir dans Réglages → Assistant',
  'assistant.empty.askAll': 'Posez n’importe quelle question sur <b>tous vos comptes</b>, ou commencez par :',
  'assistant.empty.askScope': 'Posez n’importe quelle question sur <b>{scope}</b>, ou commencez par :',
  'assistant.empty.seesAll': 'Il voit chaque compte partagé.',
  'assistant.empty.seesScope': 'Il ne voit que les comptes de {scope} : {accounts}.',
  'assistant.empty.tip': 'Tapez / pour les commandes, @ pour un compte. Rien n’est envoyé à votre place.',
  'assistant.working': 'En cours…',
  'assistant.problem.signedOut': '<b>Claude Code ne peut pas répondre : vous devez vous reconnecter.</b> Ouvrez Terminal et exécutez <code>claude auth login</code>, puis réessayez.',
  'assistant.problem.failed': 'Un problème est survenu.',
  'assistant.problem.retry': 'Réessayer',
  'assistant.compose.placeholderOff': 'L’assistant est désactivé pour cet espace',
  'assistant.compose.placeholder': 'Posez une question, ou tapez / pour les commandes…',
  'assistant.compose.placeholderNoAccount': 'Activez d’abord un compte (Réglages → Assistant)',
  'assistant.compose.model': 'Modèle',
  'assistant.compose.changeEngine': 'Modifier dans Réglages → Assistant',
  'assistant.compose.effort': 'Effort (intensité de la réflexion)',
  'assistant.compose.send': 'Envoyer',

  // The chat window before the chat (an engine that isn't connected)
  'assistant.window.notConnected': 'Cet espace utilise <b>{engine}</b>, qui n’est pas encore connecté.',
  'assistant.window.connect': 'Le connecter dans Réglages → Intégrations',
  'assistant.window.chooseAnother': 'Ou choisissez un autre assistant pour cet espace dans <link>Réglages → Assistant</link>.',

  // The floating button
  'assistant.fab.closeTitle': 'Fermer l’assistant  (⌘J)',
  'assistant.fab.close': 'Fermer l’assistant',
  'assistant.fab.actionsTitle': 'Actions rapides · faites glisser pour déplacer',
  'assistant.fab.actions': 'Actions rapides',

  // Setup steps
  'assistant.setup.intro':
    'L’assistant lit vos comptes et répond à vos questions, rédige des réponses et trouve des créneaux pour vos réunions. Il fonctionne avec <b>Claude Code</b> et votre propre abonnement Claude. Deux étapes pour commencer :',
  'assistant.setup.connectClaude': 'Connecter Claude',
  'assistant.setup.checking': 'Vérification…',
  'assistant.setup.notInstalled': 'Claude Code n’est pas encore installé sur ce Mac. Ouvrez Terminal, collez ceci et appuyez sur Retour :',
  'assistant.setup.needsPlan': 'Un abonnement Claude Pro ou Max (ou un compte Anthropic Console) est nécessaire.',
  'assistant.setup.installed': 'Je l’ai installé',
  'assistant.setup.signInIntro': 'Connectez-vous avec votre compte Claude. Votre navigateur s’ouvre ; revenez ici lorsqu’il indique que vous êtes connecté.',
  'assistant.setup.waiting': 'En attente de la fin de l’opération dans le navigateur…',
  'assistant.setup.slow': 'Ça prend du temps ? Ouvrez Terminal et exécutez <code>claude auth login</code>, puis <link>vérifiez à nouveau</link>.',
  'assistant.setup.signIn': 'Se connecter à Claude',
  'assistant.setup.signInFailed': 'Pas encore connecté. Vous pouvez aussi ouvrir Terminal et exécuter <code>claude auth login</code>, puis <link>vérifier à nouveau</link>.',
  'assistant.setup.chooseAccounts': 'Choisir ce qu’il peut lire',
  'assistant.setup.accountsIntro': 'Seuls ces comptes lui sont visibles. Il n’envoie jamais rien à votre place ; pour cliquer ou saisir, il vous demande d’abord.',
  'assistant.setup.changeLater': 'Vous pourrez modifier cela plus tard dans Réglages → Assistant.',

  // Connect Claude (Claude Code / Claude Desktop on this Mac)
  'assistant.connect.title': 'Connecter Claude',
  'assistant.connect.hint': 'Autorisez Claude Code ou Claude Desktop sur ce Mac à lire et à travailler dans les comptes de votre choix. Rien ne quitte votre Mac, sauf par l’intermédiaire de Claude lui-même.',
  'assistant.connect.allow': 'Autoriser Claude à se connecter',
  'assistant.connect.claudeCode': 'Claude Code — à exécuter dans Terminal',
  'assistant.connect.claudeDesktop': 'Claude Desktop — à ajouter à claude_desktop_config.json',
  'assistant.connect.accessHint':
    'Donnez ensuite un accès à chaque compte (Réglages → Comptes, ou clic droit dessus → <b>Accès de Claude</b>) : Lire, ou Lire et agir. Claude doit vous demander avant de cliquer ou de saisir, et vous pouvez l’arrêter à tout moment avec ⌘.',

  // The banner while Claude acts in an account
  'assistant.banner.working': 'Claude travaille dans <b>{name}</b>',
  'assistant.banner.thisAccount': 'ce compte',

  // Conversations
  'assistant.conversation.newTitle': 'Nouvelle discussion',
  'assistant.startedFresh': '(Le contexte précédent de cette conversation n’était plus disponible, j’ai donc repris de zéro.)',

  // Errors shown in the chat
  'assistant.error.claudeNotInstalled': 'Claude Code n’est pas installé.',
  'assistant.error.claudeReported': 'Claude Code a signalé une erreur.',
  'assistant.error.claudeStopped': 'Claude Code s’est arrêté de manière inattendue.',
  'assistant.error.defaultModel':
    'Le modèle par défaut de Claude Code ne peut pas être utilisé ici (message : « {message} »). Choisissez un modèle pour cet espace, comme Sonnet ou Opus, dans le menu sous la discussion ou dans Réglages → Assistant. Ou corrigez le « model » dans vos réglages Claude Code (~/.claude/settings.json).',
  'assistant.error.codexNotInstalled': 'OpenAI Codex n’est pas installé.',
  'assistant.error.codexCouldNotAnswer': 'Codex n’a pas pu répondre.',
  'assistant.error.codexReported': 'Codex a signalé une erreur.',
  'assistant.error.codexStopped': 'Codex s’est arrêté de manière inattendue.',
  'assistant.error.codexForbiddenServer': 'Codex a tenté d’utiliser un outil de « {server} », ce que Mission Desk n’autorise pas ; la réponse a donc été interrompue.',
  'assistant.error.codexForbiddenOtherServer': 'Codex a tenté d’utiliser un outil d’« un autre serveur », ce que Mission Desk n’autorise pas ; la réponse a donc été interrompue.',
  'assistant.error.codexForbiddenCommand': 'Codex a tenté d’utiliser une commande sur le Mac, ce que Mission Desk n’autorise pas ; la réponse a donc été interrompue.',
  'assistant.error.codexForbiddenBuiltIn': 'Codex a tenté d’utiliser son outil intégré « {tool} », ce que Mission Desk n’autorise pas ; la réponse a donc été interrompue.',
  'assistant.error.openRouterStatus': 'OpenRouter a répondu {status}.',
  'assistant.error.openRouterConnect': 'Connectez OpenRouter dans Réglages → Intégrations.',
  'assistant.error.tooManySteps': '(Interrompu : trop d’étapes pour une seule réponse.)',
  'assistant.error.modelError': 'Le modèle a renvoyé une erreur.',
  'assistant.error.modelStopped': 'Le modèle s’est arrêté sur une erreur.',

  // Connecting OpenRouter
  'assistant.openRouter.keyRejected': 'OpenRouter n’a pas accepté cette clé.',
  'assistant.openRouter.statusRetry': 'OpenRouter a répondu {status}. Réessayez.',
  'assistant.openRouter.unreachable': 'Impossible de joindre OpenRouter. Vérifiez la connexion.',
  'assistant.keychainUnavailable': 'Le trousseau macOS n’est pas disponible ; la clé n’a donc pas été enregistrée.',
  "assistant.error.claudeAccountMissing": "Le compte Claude de cet espace a été supprimé. Choisissez son compte Claude dans Réglages → Assistant.",
};
