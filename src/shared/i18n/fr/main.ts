import type { Translation } from '../types';
import type { main as en } from '../en/main';

export const main: Translation<typeof en> = {
  // The app menu (Mission Desk). {app} is the app's name.
  'main.menu.about': 'À propos de {app}',
  'main.menu.services': 'Services',
  'main.menu.hide': 'Masquer {app}',
  'main.menu.hideOthers': 'Masquer les autres',
  'main.menu.showAll': 'Tout afficher',
  'main.menu.quit': 'Quitter {app}',
  'main.menu.checkForUpdates': 'Rechercher les mises à jour…',
  'main.menu.settings': 'Réglages…',
  'main.menu.assistant': 'Assistant',
  'main.menu.connectClaude': 'Connecter Claude…',
  // Edit
  'main.menu.edit': 'Édition',
  'main.menu.undo': 'Annuler',
  'main.menu.redo': 'Rétablir',
  'main.menu.cut': 'Couper',
  'main.menu.copy': 'Copier',
  'main.menu.paste': 'Coller',
  'main.menu.pasteAndMatchStyle': 'Coller et adapter le style',
  'main.menu.selectAll': 'Tout sélectionner',
  'main.menu.speech': 'Parole',
  'main.menu.startSpeaking': 'Commencer la lecture',
  'main.menu.stopSpeaking': 'Arrêter la lecture',
  // View
  'main.menu.view': 'Présentation',
  'main.menu.reload': 'Recharger',
  'main.menu.forward': 'Suivant',
  'main.menu.sidebarStyle': 'Style de la barre latérale',
  'main.menu.sidebarFolders': 'Dossiers',
  'main.menu.sidebarPanel': 'Dossiers avec panneau',
  'main.menu.sidebarSections': 'Sections',
  'main.menu.devTools': 'Outils de développement pour ce compte',
  'main.menu.toggleFullScreen': 'Activer/désactiver le plein écran',
  // Accounts
  'main.menu.accounts': 'Comptes',
  'main.menu.home': 'Accueil',
  'main.menu.allCalendars': 'Tous les calendriers',
  'main.menu.copyMeetLink': 'Copier le lien Meet',
  'main.menu.newEvent': 'Nouvel événement',
  'main.menu.newTodo': 'Nouvelle tâche',
  'main.menu.account': 'Compte {n}',
  'main.menu.stopClaude': 'Arrêter Claude',
  // Window
  'main.menu.window': 'Fenêtre',
  'main.menu.minimize': 'Réduire',
  'main.menu.zoom': 'Réduire/agrandir',
  'main.menu.front': 'Tout ramener au premier plan',
  // Help
  'main.menu.help': 'Aide',
  'main.menu.siteMissionDesk': 'Site web de Mission Desk',
  'main.menu.siteRumiLabs': 'Site web de Rumi Labs',

  // An account's right-click menu.
  'main.account.edit': 'Modifier…',
  'main.account.muteNotifications': 'Couper les notifications',
  'main.account.hibernate': 'Mettre en veille si inutilisée',
  'main.account.icon': 'Icône',
  'main.account.claudeAccess': 'Accès de Claude',
  'main.account.accessRead': 'Lire',
  'main.account.accessAct': 'Lire et agir',
  'main.account.moveToSpace': 'Déplacer vers l’espace',
  'main.account.newSpace': 'Nouvel espace…',
  'main.account.moveUp': 'Déplacer vers le haut',
  'main.account.moveDown': 'Déplacer vers le bas',
  'main.account.remove': 'Supprimer…',
  'main.account.removeTitle': 'Supprimer {name} ?',
  'main.account.removeDetail': 'Cela vous déconnecte et supprime ses données sur ce Mac.',

  // An account's icon (right-click → Icon).
  'main.icon.sameAs': 'Comme {name}',
  'main.icon.auto': 'Logo de l’entreprise ou photo',
  'main.icon.service': 'Logo du service',
  'main.icon.letter': 'Lettre',
  'main.icon.chooseImage': 'Choisir une image…',
  'main.icon.chooseTitle': 'Choisir une image pour {name}',
  'main.icon.imagesFilter': 'Images',
  'main.icon.openFailed': 'Impossible d’ouvrir cette image.',
  'main.icon.openFailedDetail': 'Essayez un fichier PNG ou JPEG.',

  // A space's right-click menu, and the + menu.
  'main.space.rename': 'Renommer…',
  'main.space.alwaysOpen': 'Toujours ouvert',
  'main.space.shareGoogle': 'Partager la connexion Google',
  'main.space.googleFrom': 'Connexion Google depuis',
  'main.space.ungroup': 'Dissocier',
  'main.add.app': 'Ajouter une app…',
  'main.add.space': 'Ajouter un espace…',

  // Quick actions (the ⚡ button's menu).
  'main.quick.title': 'Actions rapides',
  'main.quick.titleFor': 'Actions rapides · {name}',
  'main.quick.noGoogleInSpace': 'Ajouter un compte Google à cet espace',
  'main.quick.needGoogle': 'Ajoutez d’abord un compte Google',
  'main.quick.askAssistant': 'Demander à l’assistant',

  // Copy Meet Link.
  'main.meet.noLink': 'Aucun lien de réunion',
  'main.meet.noGoogle': 'Cet espace n’a pas de compte Google. Ajoutez-en un pour créer des liens Meet.',
  'main.meet.creating': 'Création d’un lien de réunion…',
  'main.meet.copied': 'Lien de réunion copié',
  /** {link}: the link without https://; {keys}: ⌘V or Ctrl+V. */
  'main.meet.copiedDetail': '{link} · {keys} pour coller',
  'main.meet.copiedBody': '{url} — collez-le avec {keys}.',
  'main.meet.errorSignedOut': 'Connectez-vous à Google dans cet espace, puis réessayez.',
  'main.meet.errorOffline': 'Mission Desk est hors ligne. Vérifiez votre connexion et réessayez.',
  'main.meet.errorForbidden': 'Google a refusé de créer une réunion pour ce compte.',
  'main.meet.errorUnsupported': 'Google n’a pas pu créer de réunion pour ce compte.',
  'main.meet.errorGeneric': 'Google n’a pas pu créer de réunion. Réessayez dans un instant.',
  /** The title of the event Copy Meet Link creates in the user's Google Agenda. */
  'main.meet.quickCallTitle': 'Appel rapide',

  // The assistant asks before it keeps a note, saves a skill or creates an event. {where}: a space's name.
  'main.assistant.thisSpace': 'cet espace',
  'main.assistant.rememberTitle': 'Mémoriser ceci pour {where} ?',
  'main.assistant.forgetTitle': 'Oublier cette note dans {where} ?',
  'main.assistant.rememberDetail':
    '{note}\n\nDemandé par l’assistant. Seul l’assistant de {where} la verra. Vous pouvez consulter et modifier chaque note dans Réglages → Assistant.',
  'main.assistant.forgetDetail': '{note}\n\nDemandé par l’assistant. Vous pouvez consulter et modifier chaque note dans Réglages → Assistant.',
  'main.assistant.remember': 'Mémoriser',
  'main.assistant.forget': 'Oublier',
  'main.assistant.saveSkillTitle': 'Enregistrer la skill « {name} » pour {where} ?',
  'main.assistant.saveSkillDetailAlways':
    'Toujours activée : {description}\n\n{instructions}\n\nRédigée par l’assistant. Elle sera activée uniquement dans {where} ; vous pouvez la modifier ou la supprimer dans Réglages → Skills.',
  'main.assistant.saveSkillDetailFits':
    'Utilisée si pertinente : {description}\n\n{instructions}\n\nRédigée par l’assistant. Elle sera activée uniquement dans {where} ; vous pouvez la modifier ou la supprimer dans Réglages → Skills.',
  'main.assistant.createEventTitle': 'Créer cet événement ?',
  'main.assistant.createEventDetail': '{event}\n\nDemandé par l’assistant. Vérifiez les invités et la description avant de le créer.',
  'main.assistant.emailGuests': 'Envoyer les invitations par e-mail aux invités',

  // The assistant's scopes in per-space mode use common.allSpaces / common.noSpace.
  'main.scope.everything': 'Tout',

  // Claude acting in an account.
  'main.claude.consentTitle': 'Autoriser Claude à agir dans {name} pendant 30 minutes ?',
  'main.claude.consentDetail': 'Claude pourra cliquer et saisir du texte dans ce compte. Arrêtez-le à tout moment avec le bouton Arrêter ou ⌘.',
  'main.claude.allow': 'Autoriser',
  'main.claude.deny': 'Refuser',
  'main.claude.socketError': 'Impossible d’ouvrir la connexion : {error}',

  // Adding a skill by link (Settings → Skills).
  'main.skills.fetchBadLink': 'Utilisez un lien https vers un fichier SKILL.md (un lien GitHub vers le fichier ou son dossier fonctionne aussi).',
  'main.skills.fetchNotFound': 'Aucun SKILL.md à ce lien.',
  'main.skills.fetchStatus': 'Le lien a répondu {status}.',
  'main.skills.fetchNotHttps': 'Le lien redirige vers une adresse qui n’est pas en https.',
  'main.skills.fetchWebPage': 'C’est une page web, pas un fichier SKILL.md. Indiquez un lien vers le fichier lui-même.',
  'main.skills.fetchTooBig': 'Ce fichier est trop volumineux pour une skill.',
  'main.skills.fetchNotText': 'Ce n’est pas un fichier texte.',
  'main.skills.fetchEmpty': 'Ce fichier est vide.',
  'main.skills.fetchTooLong': 'Cette skill dépasse la limite autorisée par Mission Desk ({max} caractères).',
  'main.skills.fetchFailed': 'Impossible de récupérer ce lien. Vérifiez l’adresse et votre connexion.',
  'main.skills.fetchNotAllowed': 'Non autorisé.',
  'main.openRouter.badKey': 'Cela ne ressemble pas à une clé OpenRouter.',

  // Updates.
  'main.updates.readyTitle': 'Mission Desk {version} est prêt',
  'main.updates.readyBody': 'Redémarrez Mission Desk pour terminer, sinon la mise à jour s’installera la prochaine fois que vous quitterez l’app.',
  'main.updates.checkFailed': 'Impossible de joindre GitHub pour vérifier. Vérifiez votre connexion et réessayez.',
  'main.updates.checkFailedOther': 'Impossible de rechercher une nouvelle version pour le moment. Réessayez plus tard.',
  'main.updates.downloadFailed': 'La mise à jour n’a pas pu être téléchargée. Réessayez dans un instant.',
  'main.updates.installFailed': 'La mise à jour n’a pas pu être installée. Téléchargez plutôt la nouvelle version depuis le site web.',

  // Other windows and pages.
  'main.popup.signIn': 'Se connecter',
  'main.errorPage.title': 'Hors ligne',
  'main.errorPage.message': 'Impossible d’accéder à cette page. Vérifiez votre connexion.',
  'main.errorPage.retry': 'Réessayer',
  'main.store.loadWarning': 'Vos comptes enregistrés n’ont pas pu être lus ; Mission Desk a donc démarré à vide. Une copie a été conservée sous accounts.json.bak.',
  'main.calendar.noTitle': '(Sans titre)',

  // About. {site}: the website without https://; {license}: the license's name (kept in English).
  'main.about.credits': '{site}\n{license}. Gratuit et open source.',
  'main.about.licenseSummary':
    'Gratuit et open source. Tout le monde, particuliers comme entreprises, peut l’utiliser pour n’importe quel usage, y compris professionnel, le modifier et le partager. Quiconque partage Mission Desk ou une version modifiée doit en partager le code source sous la même licence, afin qu’il ne puisse jamais devenir un produit fermé.',
};
