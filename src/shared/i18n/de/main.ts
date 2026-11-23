import type { Translation } from '../types';
import type { main as en } from '../en/main';

export const main: Translation<typeof en> = {
  // The app menu (Mission Desk). {app} is the app's name.
  'main.menu.about': 'Über {app}',
  'main.menu.services': 'Dienste',
  'main.menu.hide': '{app} ausblenden',
  'main.menu.hideOthers': 'Andere ausblenden',
  'main.menu.showAll': 'Alle einblenden',
  'main.menu.quit': '{app} beenden',
  'main.menu.checkForUpdates': 'Nach Updates suchen …',
  'main.menu.settings': 'Einstellungen …',
  'main.menu.assistant': 'Assistent',
  'main.menu.connectClaude': 'Claude verbinden …',
  // Edit
  'main.menu.edit': 'Bearbeiten',
  'main.menu.undo': 'Widerrufen',
  'main.menu.redo': 'Wiederholen',
  'main.menu.cut': 'Ausschneiden',
  'main.menu.copy': 'Kopieren',
  'main.menu.paste': 'Einsetzen',
  'main.menu.pasteAndMatchStyle': 'Einsetzen und Stil anpassen',
  'main.menu.selectAll': 'Alles auswählen',
  'main.menu.speech': 'Sprachausgabe',
  'main.menu.startSpeaking': 'Sprachausgabe starten',
  'main.menu.stopSpeaking': 'Sprachausgabe stoppen',
  // View
  'main.menu.view': 'Darstellung',
  'main.menu.reload': 'Neu laden',
  'main.menu.forward': 'Vorwärts',
  'main.menu.sidebarStyle': 'Stil der Seitenleiste',
  'main.menu.sidebarFolders': 'Ordner',
  'main.menu.sidebarPanel': 'Ordner mit Bereichsleiste',
  'main.menu.sidebarSections': 'Abschnitte',
  'main.menu.devTools': 'Entwicklerwerkzeuge für dieses Konto',
  'main.menu.toggleFullScreen': 'Vollbildmodus ein/aus',
  // Accounts
  'main.menu.accounts': 'Konten',
  'main.menu.home': 'Start',
  'main.menu.allCalendars': 'Alle Kalender',
  'main.menu.copyMeetLink': 'Meet-Link kopieren',
  'main.menu.newEvent': 'Neuer Termin',
  'main.menu.newTodo': 'Neue Aufgabe',
  'main.menu.account': 'Konto {n}',
  'main.menu.stopClaude': 'Claude stoppen',
  // Window
  'main.menu.window': 'Fenster',
  'main.menu.minimize': 'Im Dock ablegen',
  'main.menu.zoom': 'Zoomen',
  'main.menu.front': 'Alle nach vorne bringen',
  // Help
  'main.menu.help': 'Hilfe',
  'main.menu.siteMissionDesk': 'Website von Mission Desk',
  'main.menu.siteRumiLabs': 'Website von Rumi Labs',

  // An account's right-click menu.
  'main.account.edit': 'Bearbeiten …',
  'main.account.muteNotifications': 'Mitteilungen stummschalten',
  'main.account.hibernate': 'Bei Nichtnutzung ruhen lassen',
  'main.account.icon': 'Symbol',
  'main.account.claudeAccess': 'Zugriff für Claude',
  'main.account.accessRead': 'Lesen',
  'main.account.accessAct': 'Lesen & handeln',
  'main.account.moveToSpace': 'In Bereich bewegen',
  'main.account.newSpace': 'Neuer Bereich …',
  'main.account.moveUp': 'Nach oben bewegen',
  'main.account.moveDown': 'Nach unten bewegen',
  'main.account.remove': 'Entfernen …',
  'main.account.removeTitle': '{name} entfernen?',
  'main.account.removeDetail': 'Dadurch wirst du abgemeldet und die zugehörigen Daten auf diesem Mac werden gelöscht.',

  // An account's icon (right-click → Icon).
  'main.icon.sameAs': 'Wie {name}',
  'main.icon.auto': 'Firmenlogo oder Foto',
  'main.icon.service': 'Logo des Dienstes',
  'main.icon.letter': 'Buchstabe',
  'main.icon.chooseImage': 'Bild auswählen …',
  'main.icon.chooseTitle': 'Bild für {name} auswählen',
  'main.icon.imagesFilter': 'Bilder',
  'main.icon.openFailed': 'Das Bild konnte nicht geöffnet werden.',
  'main.icon.openFailedDetail': 'Versuche es mit einer PNG- oder JPEG-Datei.',

  // A space's right-click menu, and the + menu.
  'main.space.rename': 'Umbenennen …',
  'main.space.alwaysOpen': 'Immer geöffnet',
  'main.space.shareGoogle': 'Google-Anmeldung teilen',
  'main.space.googleFrom': 'Google-Anmeldung von',
  'main.space.ungroup': 'Gruppierung aufheben',
  'main.add.app': 'App hinzufügen …',
  'main.add.space': 'Bereich hinzufügen …',

  // Quick actions (the ⚡ button's menu).
  'main.quick.title': 'Schnellaktionen',
  'main.quick.titleFor': 'Schnellaktionen · {name}',
  'main.quick.noGoogleInSpace': 'Google-Konto zu diesem Bereich hinzufügen',
  'main.quick.needGoogle': 'Zuerst ein Google-Konto hinzufügen',
  'main.quick.askAssistant': 'Assistenten fragen',

  // Copy Meet Link.
  'main.meet.noLink': 'Kein Meeting-Link',
  'main.meet.noGoogle': 'Dieser Bereich hat kein Google-Konto. Füge eines hinzu, um Meet-Links zu erstellen.',
  'main.meet.creating': 'Meeting-Link wird erstellt …',
  'main.meet.copied': 'Meeting-Link kopiert',
  /** {link}: the link without https://; {keys}: ⌘V or Ctrl+V. */
  'main.meet.copiedDetail': '{link} · {keys} zum Einsetzen',
  'main.meet.copiedBody': '{url} – mit {keys} einsetzen.',
  'main.meet.errorSignedOut': 'Melde dich in diesem Bereich bei Google an und versuche es dann erneut.',
  'main.meet.errorOffline': 'Mission Desk ist offline. Prüfe deine Verbindung und versuche es erneut.',
  'main.meet.errorForbidden': 'Google hat abgelehnt, ein Meeting für dieses Konto zu erstellen.',
  'main.meet.errorUnsupported': 'Google konnte kein Meeting für dieses Konto erstellen.',
  'main.meet.errorGeneric': 'Google konnte kein Meeting erstellen. Versuche es gleich noch einmal.',
  /** The title of the event Copy Meet Link creates in the user's Google Kalender. */
  'main.meet.quickCallTitle': 'Kurzer Call',

  // The assistant asks before it keeps a note, saves a skill or creates an event. {where}: a space's name.
  'main.assistant.thisSpace': 'diesen Bereich',
  'main.assistant.rememberTitle': 'Dies für {where} merken?',
  'main.assistant.forgetTitle': 'Diese Notiz in {where} vergessen?',
  'main.assistant.rememberDetail':
    '{note}\n\nVom Assistenten angefragt. Nur der Assistent von {where} sieht sie. Du kannst alle Notizen unter „Einstellungen“ → „Assistent“ ansehen und ändern.',
  'main.assistant.forgetDetail': '{note}\n\nVom Assistenten angefragt. Du kannst alle Notizen unter „Einstellungen“ → „Assistent“ ansehen und ändern.',
  'main.assistant.remember': 'Merken',
  'main.assistant.forget': 'Vergessen',
  'main.assistant.saveSkillTitle': 'Skill „{name}“ für {where} sichern?',
  'main.assistant.saveSkillDetailAlways':
    'Immer aktiv: {description}\n\n{instructions}\n\nVom Assistenten verfasst. Er ist nur in {where} aktiv; du kannst ihn unter „Einstellungen“ → „Skills“ ändern oder entfernen.',
  'main.assistant.saveSkillDetailFits':
    'Wird verwendet, wenn passend: {description}\n\n{instructions}\n\nVom Assistenten verfasst. Er ist nur in {where} aktiv; du kannst ihn unter „Einstellungen“ → „Skills“ ändern oder entfernen.',
  'main.assistant.createEventTitle': 'Diesen Termin erstellen?',
  'main.assistant.createEventDetail': '{event}\n\nVom Assistenten angefragt. Prüfe Gäste und Beschreibung, bevor du ihn erstellst.',
  'main.assistant.emailGuests': 'Einladungen per E-Mail an die Gäste senden',

  // The assistant's scopes in per-space mode use common.allSpaces / common.noSpace.
  'main.scope.everything': 'Alles',

  // Claude acting in an account.
  'main.claude.consentTitle': 'Claude erlauben, 30 Minuten lang in {name} zu handeln?',
  'main.claude.consentDetail': 'Claude kann dann in diesem Konto klicken und tippen. Du kannst es jederzeit mit der Taste „Stoppen“ oder mit ⌘. stoppen.',
  'main.claude.allow': 'Erlauben',
  'main.claude.deny': 'Ablehnen',
  'main.claude.socketError': 'Die Verbindung konnte nicht geöffnet werden: {error}',

  // Adding a skill by link (Settings → Skills).
  'main.skills.fetchBadLink': 'Verwende einen https-Link zu einer SKILL.md-Datei (ein GitHub-Link zur Datei oder zu ihrem Ordner funktioniert auch).',
  'main.skills.fetchNotFound': 'Unter diesem Link gibt es keine SKILL.md.',
  'main.skills.fetchStatus': 'Der Link hat mit {status} geantwortet.',
  'main.skills.fetchNotHttps': 'Der Link leitet auf eine Adresse weiter, die nicht https ist.',
  'main.skills.fetchWebPage': 'Das ist eine Webseite, keine SKILL.md-Datei. Verlinke direkt auf die Datei.',
  'main.skills.fetchTooBig': 'Diese Datei ist zu groß für einen Skill.',
  'main.skills.fetchNotText': 'Das ist keine Textdatei.',
  'main.skills.fetchEmpty': 'Diese Datei ist leer.',
  'main.skills.fetchTooLong': 'Dieser Skill ist länger, als Mission Desk erlaubt ({max} Zeichen).',
  'main.skills.fetchFailed': 'Der Link konnte nicht abgerufen werden. Prüfe die Adresse und deine Verbindung.',
  'main.skills.fetchNotAllowed': 'Nicht erlaubt.',
  'main.openRouter.badKey': 'Das sieht nicht wie ein OpenRouter-Schlüssel aus.',

  // Updates.
  'main.updates.readyTitle': 'Mission Desk {version} ist bereit',
  'main.updates.readyBody': 'Starte Mission Desk neu, um abzuschließen, oder das Update wird beim nächsten Beenden installiert.',
  'main.updates.checkFailed': 'GitHub ist für die Prüfung nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.',
  'main.updates.checkFailedOther': 'Derzeit kann nicht nach einer neuen Version gesucht werden. Versuche es später erneut.',
  'main.updates.downloadFailed': 'Das Update konnte nicht geladen werden. Versuche es gleich noch einmal.',
  'main.updates.installFailed': 'Das Update konnte nicht installiert werden. Lade die neue Version stattdessen von der Website.',

  // Other windows and pages.
  'main.popup.signIn': 'Anmelden',
  'main.errorPage.title': 'Offline',
  'main.errorPage.message': 'Diese Seite ist nicht erreichbar. Prüfe deine Verbindung.',
  'main.errorPage.retry': 'Erneut versuchen',
  'main.store.loadWarning': 'Deine gesicherten Konten konnten nicht gelesen werden, daher wurde Mission Desk leer gestartet. Eine Kopie wurde als accounts.json.bak aufbewahrt.',
  'main.calendar.noTitle': '(Kein Titel)',

  // About. {site}: the website without https://; {license}: the license's name (kept in English).
  'main.about.credits': '{site}\n{license}. Kostenlos und Open Source.',
  'main.about.licenseSummary':
    'Kostenlos und Open Source. Alle, Privatpersonen wie Unternehmen, dürfen es für alles nutzen, auch für die Arbeit, und es verändern und weitergeben. Wer Mission Desk oder eine veränderte Version weitergibt, muss den Quellcode unter derselben Lizenz weitergeben, damit es nie zu einem geschlossenen Produkt werden kann.',
  "main.space.memory": "Gedächtnis …",
};
