import type { Translation } from '../types';
import type { setup as en } from '../en/setup';

export const setup: Translation<typeof en> = {
  // Names the setup gives (src/shared/setup.ts)
  'setup.app.website': 'Site web',
  'setup.spaces.tooLong': 'Moins de {max} caractères, s’il vous plaît.',
  'setup.spaces.taken': '{name} existe déjà.',

  // What each service brings (the tiles)
  'setup.service.googleWhat': 'Gmail, Calendar, Drive',
  'setup.service.slackWhat': 'Un espace de travail',
  'setup.service.whatsappWhat': 'Vos discussions',
  'setup.service.telegramWhat': 'Vos discussions',
  'setup.service.linkedinWhat': 'Messages, fil d’actualité',
  'setup.service.discordWhat': 'Serveurs, messages privés',
  'setup.service.zoomWhat': 'Team Chat, réunions',
  'setup.service.notionWhat': 'Pages, wikis',
  'setup.service.protonWhat': 'E-mail privé',
  'setup.service.icloudWhat': 'E-mail Apple',
  'setup.service.fastmailWhat': 'E-mail, calendrier',

  // Example and suggested space names
  'setup.spaceName.personal': 'Perso',
  'setup.spaceName.work': 'Travail',
  'setup.spaceName.sideProject': 'Projet perso',

  // Progress and navigation
  'setup.stage.welcome': 'Bienvenue',
  'setup.stage.assistant': 'Assistant',
  'setup.stage.spaces': 'Espaces',
  'setup.stage.apps': 'Apps',
  'setup.stage.ready': 'Prêt',
  'setup.progressLabel': 'Étape {step} sur {total} : {stage}',
  'setup.skip': 'Passer la configuration',
  'setup.skipTitle': 'Vous pourrez relancer la configuration depuis Réglages → Général',
  'setup.nav.aboutAMinute': 'Cela prend environ une minute.',
  'setup.nav.needSpace': 'Ajoutez un espace, ou gardez tout ensemble.',
  'setup.nav.getStarted': 'Commencer',
  'setup.nav.settingUp': 'Configuration…',
  'setup.nav.startSigningIn': 'Commencer à se connecter',
  'setup.nav.openMissionDesk': 'Ouvrir Mission Desk',
  'setup.nav.continue': 'Continuer',
  'setup.finishError': 'Mission Desk n’a pas pu les ajouter. Revenez en arrière, vérifiez les noms des espaces et les adresses web, puis réessayez.',
  'setup.remove': 'Retirer {name}',

  // Welcome
  'setup.welcome.nameLabel': 'Votre nom (facultatif)',
  'setup.welcome.namePlaceholder': 'Comment vous appeler',
  'setup.stage.meetings': 'Réunions',
  'setup.meetings.title': 'Transcrire vos réunions ?',
  'setup.meetings.lede': 'Les appels Meet, Teams et Zoom que vous rejoignez dans Mission Desk, transcrits sur ce Mac : l’audio n’en sort jamais et seul le texte est gardé, dans l’espace de la réunion.',
  'setup.meetings.groupLabel': 'Transcription',
  'setup.meetings.askName': 'Demander à chaque réunion',
  'setup.meetings.askHint': 'Une barre au-dessus de l’appel demande avant de commencer. Recommandé.',
  'setup.meetings.alwaysName': 'Toujours, sans demander',
  'setup.meetings.alwaysHint': 'Commence dès que vous rejoignez un appel. Pensez à prévenir les autres.',
  'setup.meetings.offName': 'Non, merci',
  'setup.meetings.offHint': 'Rien n’est transcrit. Vous pourrez l’activer plus tard dans Réglages → Réunions.',
  'setup.meetings.perSpaceTitle': 'Choisir pour chaque espace',
  'setup.meetings.perSpaceText': 'Par exemple Toujours pour un client et Demander pour les autres.',
  'setup.meetings.spaceLabel': 'Transcription dans {name}',
  'setup.meetings.sameAsAbove': 'Comme au-dessus ({name})',
  'setup.meetings.engineTitle': 'Moteur de transcription',
  'setup.meetings.appleHint': 'Intégré à macOS 26 : rien à télécharger.',
  'setup.meetings.appleUnavailable': 'Nécessite macOS 26.',
  'setup.meetings.parakeetHint': 'Très rapide. 0,5 Go, téléchargé après la configuration.',
  'setup.meetings.whisperHint': 'Le plus précis. 1,6 Go, téléchargé après la configuration.',
  'setup.meetings.insightsTitle': 'Éclairages pendant les réunions',
  'setup.meetings.insightsText': 'Quand ce qui est dit rejoint ce qu’un espace sait, son assistant affiche une courte note avec sa source.',
  'setup.ready.meetings': 'Transcription : {mode}',
  'setup.welcome.title': 'Bienvenue dans Mission Desk',
  'setup.welcome.titleAgain': 'Configurer davantage Mission Desk',
  'setup.welcome.lede':
    'Toutes vos apps côte à côte, organisées en espaces, avec un seul Accueil pour votre journée et un assistant qui connaît chaque espace.',
  'setup.welcome.ledeAgain': 'Ajoutez des espaces et des apps comme la première fois. Ce que vous avez déjà reste tel quel.',
  'setup.welcome.accountsTitle': 'Chaque compte connecté séparément',
  'setup.welcome.accountsText': 'Deux comptes Google, trois espaces de travail Slack : chacun garde sa propre connexion.',
  'setup.welcome.homeTitle': 'Accueil montre ce qui vous attend',
  'setup.welcome.homeText': 'Vos réunions, vos tâches et vos messages non lus, et un clic pour rejoindre un appel.',
  'setup.welcome.assistantTitle': 'Un assistant qui reste dans son espace',
  'setup.welcome.assistantText': 'Il ne lit que les apps que vous partagez avec lui, et uniquement dans cet espace.',
  'setup.welcome.meetingsTitle': 'Réunions transcrites sur votre Mac',
  'setup.welcome.meetingsText': 'Dans Meet, Teams et Zoom, avec le résumé et vos tâches à la fin. L’audio ne quitte jamais votre Mac.',

  // Assistant
  'setup.assistant.title': 'Voulez-vous un assistant ?',
  'setup.assistant.lede':
    'Il vous fait le point sur votre journée, repère qui attend une réponse de votre part et prépare vos réunions, à partir des apps que vous partagez avec lui.',
  'setup.assistant.groupLabel': 'Assistant',
  'setup.assistant.claudeHint': 'Utilise votre abonnement Claude, via Claude Code sur ce Mac.',
  'setup.assistant.codexHint': 'Utilise votre abonnement ChatGPT, via Codex sur ce Mac.',
  'setup.assistant.openrouterHint': 'GPT, Gemini, Llama et bien d’autres, avec votre propre clé OpenRouter.',
  'setup.assistant.offName': 'Pas maintenant',
  'setup.assistant.offHint': 'Vous pourrez en ajouter un plus tard dans Réglages.',
  'setup.assistant.addAnother': '+ Ajouter un autre compte',
  'setup.assistant.perSpaceTitle': 'Choisir un assistant pour chaque espace',
  'setup.assistant.perSpaceText': 'Par exemple un autre compte Claude pour le travail. Un espace laissé tel quel utilise celui du dessus.',
  'setup.assistant.spaceLabel': 'Assistant de {name}',
  'setup.assistant.sameAsAbove': 'Comme au-dessus ({name})',
  'setup.assistant.meetings': 'Vos apps ont des appels : à la fin d’une réunion, l’assistant de l’espace peut en écrire le résumé et vos tâches.',
  'setup.assistant.readsTitle': 'Autoriser l’assistant à lire ces apps',
  'setup.assistant.signInAgain': '{name} n’est pas connecté.',

  // Connecting the assistant
  'setup.engine.checking': 'Vérification de {name}…',
  'setup.engine.readyOpenRouter': 'OpenRouter est connecté. {name} est prêt.',
  'setup.engine.readySignedIn': '{app} est connecté sur ce Mac. {name} est prêt.',
  'setup.engine.keyLabel': 'Votre clé OpenRouter',
  'setup.engine.checkingKey': 'Vérification…',
  'setup.engine.connect': 'Connecter',
  'setup.engine.keyRefused': 'OpenRouter a refusé cette clé. Vérifiez-la et réessayez.',
  'setup.engine.keyHelp':
    'Créez-en une sur <link>openrouter.ai/keys</link>. macOS la conserve chiffrée sur ce Mac ; OpenRouter facture ce que vous utilisez.',
  'setup.engine.finishInBrowser': 'Terminez la connexion dans votre navigateur…',
  'setup.engine.installed': '{app} est installé. Connectez-vous une fois, avec votre compte {account}.',
  'setup.engine.signIn': 'Se connecter',
  'setup.engine.installClaude': 'Claude a besoin de Claude Code sur ce Mac. Ouvrez Terminal, collez ceci et appuyez sur Retour :',
  'setup.engine.installCodex':
    'OpenAI Codex a besoin de l’outil en ligne de commande Codex sur ce Mac. Ouvrez Terminal, collez ceci et appuyez sur Retour :',
  'setup.engine.copy': 'Copier',
  'setup.engine.copied': 'Copié',
  'setup.engine.npmMissing': 'Si Terminal indique que npm est introuvable, installez d’abord Node.js depuis nodejs.org.',
  'setup.engine.installedIt': 'Je l’ai installé',
  'setup.engine.later': 'Vous pouvez aussi terminer plus tard, dans Réglages → Intégrations.',

  // Spaces
  'setup.spaces.title': 'Comment voulez-vous organiser votre travail ?',
  'setup.spaces.lede': 'Un espace pour chaque entreprise, projet ou partie de votre vie, comme Perso, Acme ou Projet perso.',
  'setup.spaces.listLabel': 'Vos espaces',
  'setup.spaces.placeholderFirst': 'Nommez un espace, comme Acme',
  'setup.spaces.placeholderMore': 'Un autre espace',
  'setup.spaces.nameLabel': 'Nom de l’espace',
  'setup.spaces.full': {
    one: 'Cela fait {count} espace, le maximum pour la configuration. Vous pourrez en ajouter d’autres plus tard.',
    other: 'Cela fait {count} espaces, le maximum pour la configuration. Vous pourrez en ajouter d’autres plus tard.',
  },
  'setup.spaces.ideas': 'Idées :',
  'setup.spaces.togetherTitle': 'Tout garder ensemble',
  'setup.spaces.togetherText': 'Toutes vos apps dans une seule liste, sans espaces. Vous pourrez créer des espaces plus tard.',

  // Apps
  'setup.apps.title': 'Quelles apps utilisez-vous ?',
  'setup.apps.titleSpace': 'Quelles apps mettre dans {name} ?',
  'setup.apps.lede': 'Choisissez-en autant que vous voulez. Vous vous connecterez à chacune à la fin.',
  'setup.apps.ledeSpace': 'Choisissez-en autant que vous voulez. {name} est l’espace {n} sur {total}. Vous vous connecterez à chacune à la fin.',
  'setup.apps.accounts': { one: '{count} compte', other: '{count} comptes' },
  'setup.apps.oneFewer': 'Un compte {name} de moins',
  'setup.apps.another': 'Un autre compte {name}',
  'setup.apps.anyWebsite': 'N’importe quel site web',
  'setup.apps.sitesAdded': { one: '{count} ajouté', other: '{count} ajoutés' },
  'setup.apps.badAddress': 'Cela ne ressemble pas à une adresse web. Essayez quelque chose comme notion.so.',
  'setup.apps.alreadyListed': 'Elle figure déjà dans la liste.',
  'setup.apps.addressPlaceholder': 'Adresse web, comme notion.so',
  'setup.apps.addressLabel': 'Adresse web',
  'setup.apps.full': {
    one: 'Cela fait {count} app, le maximum pour un espace ici. Vous pourrez en ajouter d’autres plus tard.',
    other: 'Cela fait {count} apps, le maximum pour un espace ici. Vous pourrez en ajouter d’autres plus tard.',
  },
  'setup.apps.needsOne': 'Un espace doit contenir au moins une app. Sans app, {name} est laissé de côté ; vous pourrez le créer plus tard.',

  // Ready
  'setup.ready.nothingTitle': 'Rien à ajouter pour l’instant',
  'setup.ready.nothingText':
    'Vous n’avez choisi aucune app. Revenez en arrière pour en choisir, ou ouvrez Mission Desk et ajoutez-les une par une avec le + de la barre latérale.',
  'setup.ready.title': 'Prêt à vous connecter',
  'setup.ready.lede': {
    one: 'Mission Desk ajoute votre app et ouvre {first} en premier. Connectez-vous une fois à chacune ; la session reste ouverte sur ce Mac.',
    other:
      'Mission Desk ajoute vos {count} apps et ouvre {first} en premier. Connectez-vous une fois à chacune ; la session reste ouverte sur ce Mac.',
  },
  'setup.ready.ledeSpaces':
    'Mission Desk ajoute vos {count} apps dans {spaces} espaces et ouvre {first} en premier. Connectez-vous une fois à chacune ; la session reste ouverte sur ce Mac.',
  'setup.ready.alreadyThere': 'Existe déjà : sera complété',
  'setup.ready.noAssistant': 'Sans assistant',
  'setup.ready.keepsAssistant': 'Garde son assistant',
  'setup.ready.readsText':
    'Pour qu’il puisse vous faire le point et repérer qui attend une réponse de votre part. Il ne peut ni saisir, ni cliquer, ni envoyer quoi que ce soit dans ces apps. Vous pouvez modifier cela pour chaque app dans Réglages.',

  // The sidebar preview
  'setup.dock.home': 'Accueil',
  'setup.dock.appsHere': 'Vos apps apparaîtront ici.',
  'setup.dock.spacesHere': 'Vos espaces apparaîtront ici.',
  'setup.dock.example': 'Un exemple. Le vôtre prend forme au fil de vos réponses.',
  'setup.dock.yours': 'Votre Mission Desk',
};
