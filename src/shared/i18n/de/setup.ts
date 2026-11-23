import type { Translation } from '../types';
import type { setup as en } from '../en/setup';

export const setup: Translation<typeof en> = {
  // Names the setup gives (src/shared/setup.ts)
  'setup.app.website': 'Website',
  'setup.spaces.tooLong': 'Bitte weniger als {max} Zeichen.',
  'setup.spaces.taken': '{name} gibt es bereits.',

  // What each service brings (the tiles)
  'setup.service.googleWhat': 'Gmail, Kalender, Drive',
  'setup.service.slackWhat': 'Ein Workspace',
  'setup.service.whatsappWhat': 'Deine Chats',
  'setup.service.telegramWhat': 'Deine Chats',
  'setup.service.linkedinWhat': 'Nachrichten, Feed',
  'setup.service.discordWhat': 'Server, Direktnachrichten',
  'setup.service.zoomWhat': 'Team Chat, Meetings',
  'setup.service.notionWhat': 'Seiten, Wikis',
  'setup.service.protonWhat': 'Private E-Mail',
  'setup.service.icloudWhat': 'E-Mail von Apple',
  'setup.service.fastmailWhat': 'E-Mail, Kalender',

  // Example and suggested space names
  'setup.spaceName.personal': 'Privat',
  'setup.spaceName.work': 'Arbeit',
  'setup.spaceName.sideProject': 'Nebenprojekt',

  // Progress and navigation
  'setup.stage.welcome': 'Willkommen',
  'setup.stage.assistant': 'Assistent',
  'setup.stage.spaces': 'Bereiche',
  'setup.stage.apps': 'Apps',
  'setup.stage.ready': 'Fertig',
  'setup.progressLabel': 'Schritt {step} von {total}: {stage}',
  'setup.skip': 'Einrichtung überspringen',
  'setup.skipTitle': 'Du kannst die Einrichtung unter „Einstellungen“ → „Allgemein“ erneut starten',
  'setup.nav.aboutAMinute': 'Dauert etwa eine Minute.',
  'setup.nav.needSpace': 'Füge einen Bereich hinzu oder behalte alles zusammen.',
  'setup.nav.getStarted': 'Los geht’s',
  'setup.nav.settingUp': 'Wird eingerichtet …',
  'setup.nav.startSigningIn': 'Mit der Anmeldung beginnen',
  'setup.nav.openMissionDesk': 'Mission Desk öffnen',
  'setup.nav.continue': 'Fortfahren',
  'setup.finishError': 'Mission Desk konnte sie nicht hinzufügen. Geh zurück, prüfe die Namen der Bereiche und die Webadressen und versuche es dann erneut.',
  'setup.remove': '{name} entfernen',

  // Welcome
  'setup.welcome.title': 'Willkommen bei Mission Desk',
  'setup.welcome.titleAgain': 'Mehr von Mission Desk einrichten',
  'setup.welcome.lede':
    'Alle deine Apps nebeneinander, in Bereichen geordnet, mit einer Startseite für deinen Tag und einem Assistenten, der jeden Bereich kennt.',
  'setup.welcome.ledeAgain': 'Füge Bereiche und Apps wie beim ersten Mal hinzu. Was du schon hast, bleibt, wie es ist.',
  'setup.welcome.accountsTitle': 'Jedes Konto für sich angemeldet',
  'setup.welcome.accountsText': 'Zwei Google-Konten, drei Slack-Workspaces: Jedes behält seine eigene Anmeldung.',
  'setup.welcome.homeTitle': 'Start zeigt, was als Nächstes kommt',
  'setup.welcome.homeText': 'Deine Meetings, Aufgaben und ungelesenen Nachrichten – und mit einem Klick in den Call.',
  'setup.welcome.assistantTitle': 'Ein Assistent, der in seinem Bereich bleibt',
  'setup.welcome.assistantText': 'Er liest nur die Apps, die du mit ihm teilst, und nur in diesem Bereich.',
  'setup.welcome.meetingsTitle': 'Meetings auf Ihrem Mac transkribiert',
  'setup.welcome.meetingsText': 'In Meet, Teams und Zoom, mit Zusammenfassung und Ihren Aufgaben am Ende. Der Ton verlässt Ihren Mac nie.',

  // Assistant
  'setup.assistant.title': 'Möchtest du einen Assistenten?',
  'setup.assistant.lede':
    'Er gibt dir einen Überblick über deinen Tag, findet, wer auf dich wartet, und bereitet deine Meetings vor – aus den Apps, die du mit ihm teilst.',
  'setup.assistant.groupLabel': 'Assistent',
  'setup.assistant.claudeHint': 'Nutzt dein Claude-Abo über Claude Code auf diesem Mac.',
  'setup.assistant.codexHint': 'Nutzt dein ChatGPT-Abo über Codex auf diesem Mac.',
  'setup.assistant.openrouterHint': 'GPT, Gemini, Llama und mehr, mit deinem eigenen OpenRouter-Schlüssel.',
  'setup.assistant.offName': 'Jetzt nicht',
  'setup.assistant.offHint': 'Du kannst später in den Einstellungen einen hinzufügen.',
  'setup.assistant.addAnother': '+ Weiteres Konto hinzufügen',
  'setup.assistant.perSpaceTitle': 'Für jeden Bereich einen Assistenten wählen',
  'setup.assistant.perSpaceText': 'Zum Beispiel ein anderes Claude-Konto für die Arbeit. Ein Bereich, den Sie so lassen, nutzt den oben.',
  'setup.assistant.spaceLabel': 'Assistent von {name}',
  'setup.assistant.sameAsAbove': 'Wie oben ({name})',
  'setup.assistant.meetings': 'Ihre Apps haben Anrufe: Nach einem Meeting kann der Assistent des Bereichs die Zusammenfassung und Ihre Aufgaben schreiben.',
  'setup.assistant.readsTitle': 'Den Assistenten diese Apps lesen lassen',
  'setup.assistant.signInAgain': '{name} ist nicht angemeldet.',

  // Connecting the assistant
  'setup.engine.checking': '{name} wird geprüft …',
  'setup.engine.readyOpenRouter': 'OpenRouter ist verbunden. {name} ist bereit.',
  'setup.engine.readySignedIn': '{app} ist auf diesem Mac angemeldet. {name} ist bereit.',
  'setup.engine.keyLabel': 'Dein OpenRouter-Schlüssel',
  'setup.engine.checkingKey': 'Wird geprüft …',
  'setup.engine.connect': 'Verbinden',
  'setup.engine.keyRefused': 'OpenRouter hat diesen Schlüssel abgelehnt. Prüfe ihn und versuche es erneut.',
  'setup.engine.keyHelp':
    'Erstelle einen unter <link>openrouter.ai/keys</link>. macOS bewahrt ihn verschlüsselt auf diesem Mac auf; OpenRouter rechnet ab, was du nutzt.',
  'setup.engine.finishInBrowser': 'Schließe die Anmeldung in deinem Browser ab …',
  'setup.engine.installed': '{app} ist installiert. Melde dich einmal mit deinem {account}-Konto an.',
  'setup.engine.signIn': 'Anmelden',
  'setup.engine.installClaude': 'Claude benötigt Claude Code auf diesem Mac. Öffne das Terminal, füge dies ein und drücke den Zeilenschalter:',
  'setup.engine.installCodex':
    'OpenAI Codex benötigt das Codex-Befehlszeilenwerkzeug auf diesem Mac. Öffne das Terminal, füge dies ein und drücke den Zeilenschalter:',
  'setup.engine.copy': 'Kopieren',
  'setup.engine.copied': 'Kopiert',
  'setup.engine.npmMissing': 'Wenn das Terminal meldet, dass npm nicht gefunden wird, installiere zuerst Node.js von nodejs.org.',
  'setup.engine.installedIt': 'Ich habe es installiert',
  'setup.engine.later': 'Du kannst das auch später unter „Einstellungen“ → „Integrationen“ abschließen.',

  // Spaces
  'setup.spaces.title': 'Wie möchtest du deine Arbeit ordnen?',
  'setup.spaces.lede': 'Ein Bereich für jedes Unternehmen, jedes Projekt oder jeden Teil deines Lebens, etwa Privat, Acme oder Nebenprojekt.',
  'setup.spaces.listLabel': 'Deine Bereiche',
  'setup.spaces.placeholderFirst': 'Bereich benennen, etwa Acme',
  'setup.spaces.placeholderMore': 'Weiterer Bereich',
  'setup.spaces.nameLabel': 'Name des Bereichs',
  'setup.spaces.full': {
    one: 'Das ist {count} Bereich, mehr legt die Einrichtung nicht an. Du kannst später weitere hinzufügen.',
    other: 'Das sind {count} Bereiche, mehr legt die Einrichtung nicht an. Du kannst später weitere hinzufügen.',
  },
  'setup.spaces.ideas': 'Ideen:',
  'setup.spaces.togetherTitle': 'Alles zusammen behalten',
  'setup.spaces.togetherText': 'Alle deine Apps in einer Liste, ohne Bereiche. Du kannst später Bereiche anlegen.',

  // Apps
  'setup.apps.title': 'Welche Apps nutzt du?',
  'setup.apps.titleSpace': 'Welche Apps gehören in {name}?',
  'setup.apps.lede': 'Wähle so viele, wie du möchtest. Am Ende meldest du dich bei jeder an.',
  'setup.apps.ledeSpace': 'Wähle so viele, wie du möchtest. {name} ist Bereich {n} von {total}. Am Ende meldest du dich bei jeder an.',
  'setup.apps.accounts': { one: '{count} Konto', other: '{count} Konten' },
  'setup.apps.oneFewer': 'Ein {name}-Konto weniger',
  'setup.apps.another': 'Weiteres {name}-Konto',
  'setup.apps.anyWebsite': 'Beliebige Website',
  'setup.apps.sitesAdded': { one: '{count} hinzugefügt', other: '{count} hinzugefügt' },
  'setup.apps.badAddress': 'Das sieht nicht wie eine Webadresse aus. Versuche etwas wie notion.so.',
  'setup.apps.alreadyListed': 'Sie ist bereits in der Liste.',
  'setup.apps.addressPlaceholder': 'Webadresse, etwa notion.so',
  'setup.apps.addressLabel': 'Webadresse',
  'setup.apps.full': {
    one: 'Das ist {count} App, mehr geht hier für einen Bereich nicht. Du kannst später weitere hinzufügen.',
    other: 'Das sind {count} Apps, mehr geht hier für einen Bereich nicht. Du kannst später weitere hinzufügen.',
  },
  'setup.apps.needsOne': 'Ein Bereich braucht mindestens eine App. Ohne App wird {name} ausgelassen; du kannst ihn später anlegen.',

  // Ready
  'setup.ready.nothingTitle': 'Noch nichts hinzuzufügen',
  'setup.ready.nothingText':
    'Du hast keine Apps ausgewählt. Geh zurück, um welche auszuwählen, oder öffne Mission Desk und füge sie einzeln mit dem + in der Seitenleiste hinzu.',
  'setup.ready.title': 'Bereit zur Anmeldung',
  'setup.ready.lede': {
    one: 'Mission Desk fügt deine App hinzu und öffnet zuerst {first}. Melde dich bei jeder einmal an; sie bleibt auf diesem Mac angemeldet.',
    other:
      'Mission Desk fügt deine {count} Apps hinzu und öffnet zuerst {first}. Melde dich bei jeder einmal an; sie bleibt auf diesem Mac angemeldet.',
  },
  'setup.ready.ledeSpaces':
    'Mission Desk fügt deine {count} Apps in {spaces} Bereichen hinzu und öffnet zuerst {first}. Melde dich bei jeder einmal an; sie bleibt auf diesem Mac angemeldet.',
  'setup.ready.alreadyThere': 'Schon vorhanden: wird ergänzt',
  'setup.ready.noAssistant': 'Kein Assistent',
  'setup.ready.keepsAssistant': 'Behält seinen Assistenten',
  'setup.ready.readsText':
    'Damit er dir einen Überblick geben und herausfinden kann, wer auf dich wartet. Er kann darin weder tippen, klicken noch senden. Du kannst das in den Einstellungen für jede App ändern.',

  // The sidebar preview
  'setup.dock.home': 'Start',
  'setup.dock.appsHere': 'Deine Apps erscheinen hier.',
  'setup.dock.spacesHere': 'Deine Bereiche erscheinen hier.',
  'setup.dock.example': 'Ein Beispiel. Deines nimmt Gestalt an, während du antwortest.',
  'setup.dock.yours': 'Dein Mission Desk',
};
