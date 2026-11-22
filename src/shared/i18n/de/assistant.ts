import type { Translation } from '../types';
import type { assistant as en } from '../en/assistant';

export const assistant: Translation<typeof en> = {
  'assistant.title': 'Assistent',
  'assistant.closeShortcut': 'Schließen (⌘J)',
  'assistant.copy': 'Kopieren',
  'assistant.copied': 'Kopiert',
  'assistant.stop': 'Stoppen',

  // Models and effort (the menus under the chat and in Settings)
  'assistant.model.default': 'Standard (Claude Code)',
  'assistant.effort.low': 'niedrig',
  'assistant.effort.medium': 'mittel',
  'assistant.effort.high': 'hoch',
  'assistant.effort.xhigh': 'sehr hoch',
  'assistant.effort.max': 'maximal',

  // The "/" menu
  'assistant.command.brief': 'Dein Tag über alle Konten',
  'assistant.command.waiting': 'Wer auf dich wartet',
  'assistant.command.prep': 'Dein nächstes Meeting vorbereiten',
  'assistant.command.schedule': 'Einen Termin finden und eintragen',
  'assistant.command.reply': 'Antwort auf den offenen Verlauf entwerfen',
  'assistant.command.summarize': 'Zusammenfassen, was auf dem Bildschirm ist',
  'assistant.command.catchup': 'Was in einem Konto passiert ist',

  // Tool steps in an answer
  'assistant.tool.currentContext': 'Sieht sich deinen Bildschirm an',
  'assistant.tool.listAccounts': 'Listet Konten auf',
  'assistant.tool.readPage': 'Liest {account}',
  'assistant.tool.readPageTab': 'Liest {account} · {tab}',
  'assistant.tool.readPageAny': 'Liest eine Seite',
  'assistant.tool.readPageAnyTab': 'Liest eine Seite · {tab}',
  'assistant.tool.getElements': 'Sieht sich {account} an',
  'assistant.tool.getElementsAny': 'Sieht sich die Seite an',
  'assistant.tool.screenshot': 'Bildschirmfoto von {account}',
  'assistant.tool.screenshotAny': 'Bildschirmfoto der Seite',
  'assistant.tool.openUrl': 'Öffnet eine Seite in {account}',
  'assistant.tool.openUrlAny': 'Öffnet eine Seite in einem Konto',
  'assistant.tool.click': 'Klickt in {account}',
  'assistant.tool.clickAny': 'Klickt in einem Konto',
  'assistant.tool.type': 'Tippt in {account}',
  'assistant.tool.typeAny': 'Tippt in einem Konto',
  'assistant.tool.press': 'Drückt {key}',
  'assistant.tool.pressAny': 'Drückt eine Taste',
  'assistant.tool.calendarEvents': 'Prüft Kalender',
  'assistant.tool.findFreeTime': 'Sucht freie Zeit',
  'assistant.tool.createEvent': 'Wartet auf dein OK, um den Termin zu erstellen',
  'assistant.tool.unreadCounts': 'Zählt Ungelesenes',

  // The chat panel
  'assistant.panel.scopeTitle': 'Für welchen Bereich dieser Assistent arbeitet',
  'assistant.panel.history': 'Verlauf',
  'assistant.panel.newChat': 'Neuer Chat',
  'assistant.history.title': '{scope} · Verlauf',
  'assistant.history.empty': 'Noch keine Unterhaltungen.',
  'assistant.history.deleteLabel': '{title} löschen',
  'assistant.empty.off': 'Der Assistent ist für <b>{scope}</b> deaktiviert.',
  'assistant.empty.openSettings': '„Einstellungen“ → „Assistent“ öffnen',
  'assistant.empty.noAccount': 'In <b>{scope}</b> ist noch kein Konto für den Assistenten aktiviert.',
  'assistant.empty.chooseInSettings': 'Unter „Einstellungen“ → „Assistent“ auswählen',
  'assistant.empty.askAll': 'Frag alles über <b>alle deine Konten</b> oder beginne mit:',
  'assistant.empty.askScope': 'Frag alles über <b>{scope}</b> oder beginne mit:',
  'assistant.empty.seesAll': 'Er sieht jedes geteilte Konto.',
  'assistant.empty.seesScope': 'Er sieht nur die Konten von {scope}: {accounts}.',
  'assistant.empty.tip': 'Tippe / für Befehle, @ für ein Konto. Nichts wird in deinem Namen gesendet.',
  'assistant.working': 'Arbeitet …',
  'assistant.problem.signedOut': '<b>Claude Code kann nicht antworten: Du musst dich erneut anmelden.</b> Öffne das Terminal, führe <code>claude auth login</code> aus und versuche es dann erneut.',
  'assistant.problem.failed': 'Etwas ist schiefgelaufen.',
  'assistant.problem.retry': 'Erneut versuchen',
  'assistant.compose.placeholderOff': 'Der Assistent ist für diesen Bereich deaktiviert',
  'assistant.compose.placeholder': 'Frag etwas oder tippe / für Befehle …',
  'assistant.compose.placeholderNoAccount': 'Aktiviere zuerst ein Konto („Einstellungen“ → „Assistent“)',
  'assistant.compose.model': 'Modell',
  'assistant.compose.changeEngine': 'Unter „Einstellungen“ → „Assistent“ ändern',
  'assistant.compose.effort': 'Aufwand (wie gründlich er nachdenkt)',
  'assistant.compose.send': 'Senden',

  // The chat window before the chat (an engine that isn't connected)
  'assistant.window.notConnected': 'Dieser Bereich verwendet <b>{engine}</b>, das noch nicht verbunden ist.',
  'assistant.window.connect': 'Unter „Einstellungen“ → „Integrationen“ verbinden',
  'assistant.window.chooseAnother': 'Oder wähle unter <link>„Einstellungen“ → „Assistent“</link> einen anderen Assistenten für diesen Bereich.',

  // The floating button
  'assistant.fab.closeTitle': 'Assistenten schließen  (⌘J)',
  'assistant.fab.close': 'Assistenten schließen',
  'assistant.fab.actionsTitle': 'Schnellaktionen · zum Bewegen ziehen',
  'assistant.fab.actions': 'Schnellaktionen',

  // Setup steps
  'assistant.setup.intro':
    'Der Assistent liest deine Konten, beantwortet Fragen, entwirft Antworten und findet Zeit für Meetings. Er läuft mit <b>Claude Code</b> und deinem eigenen Claude-Abo. Zwei Schritte bis zum Start:',
  'assistant.setup.connectClaude': 'Claude verbinden',
  'assistant.setup.checking': 'Wird geprüft …',
  'assistant.setup.notInstalled': 'Claude Code ist noch nicht auf diesem Mac. Öffne das Terminal, füge dies ein und drücke den Zeilenschalter:',
  'assistant.setup.needsPlan': 'Dafür brauchst du ein Claude Pro- oder Max-Abo (oder ein Anthropic Console-Konto).',
  'assistant.setup.installed': 'Ich habe es installiert',
  'assistant.setup.signInIntro': 'Melde dich mit deinem Claude-Konto an. Dein Browser öffnet sich; komm hierher zurück, wenn dort steht, dass du angemeldet bist.',
  'assistant.setup.waiting': 'Warte, bis du im Browser fertig bist …',
  'assistant.setup.slow': 'Dauert es lange? Öffne das Terminal, führe <code>claude auth login</code> aus und <link>prüfe dann erneut</link>.',
  'assistant.setup.signIn': 'Bei Claude anmelden',
  'assistant.setup.signInFailed': 'Noch nicht angemeldet. Du kannst auch das Terminal öffnen, <code>claude auth login</code> ausführen und dann <link>erneut prüfen</link>.',
  'assistant.setup.chooseAccounts': 'Auswählen, was er lesen darf',
  'assistant.setup.accountsIntro': 'Nur diese Konten sind für ihn sichtbar. Er sendet nie etwas für dich; bevor er klickt oder tippt, fragt er zuerst.',
  'assistant.setup.changeLater': 'Du kannst das später unter „Einstellungen“ → „Assistent“ ändern.',

  // Connect Claude (Claude Code / Claude Desktop on this Mac)
  'assistant.connect.title': 'Claude verbinden',
  'assistant.connect.hint': 'Erlaube Claude Code oder Claude Desktop auf diesem Mac, in den ausgewählten Konten zu lesen und zu arbeiten. Nichts verlässt deinen Mac, außer über Claude selbst.',
  'assistant.connect.allow': 'Claude die Verbindung erlauben',
  'assistant.connect.claudeCode': 'Claude Code – im Terminal ausführen',
  'assistant.connect.claudeDesktop': 'Claude Desktop – zu claude_desktop_config.json hinzufügen',
  'assistant.connect.accessHint':
    'Gib dann jedem Konto Zugriff („Einstellungen“ → „Konten“ oder Rechtsklick darauf → <b>Zugriff für Claude</b>): Lesen oder Lesen & handeln. Claude muss dich fragen, bevor es klickt oder tippt, und du kannst es jederzeit mit ⌘. stoppen.',

  // The banner while Claude acts in an account
  'assistant.banner.working': 'Claude arbeitet in <b>{name}</b>',
  'assistant.banner.thisAccount': 'diesem Konto',

  // Conversations
  'assistant.conversation.newTitle': 'Neuer Chat',
  'assistant.startedFresh': '(Der frühere Kontext dieser Unterhaltung war nicht mehr verfügbar, daher habe ich neu begonnen.)',

  // Errors shown in the chat
  'assistant.error.claudeNotInstalled': 'Claude Code ist nicht installiert.',
  'assistant.error.claudeReported': 'Claude Code hat einen Fehler gemeldet.',
  'assistant.error.claudeStopped': 'Claude Code wurde unerwartet beendet.',
  'assistant.error.defaultModel':
    'Das Standardmodell von Claude Code kann hier nicht verwendet werden (Meldung: „{message}“). Wähle im Menü unter dem Chat oder unter „Einstellungen“ → „Assistent“ ein Modell für diesen Bereich, etwa Sonnet oder Opus. Oder korrigiere „model“ in deinen Claude Code-Einstellungen (~/.claude/settings.json).',
  'assistant.error.codexNotInstalled': 'OpenAI Codex ist nicht installiert.',
  'assistant.error.codexCouldNotAnswer': 'Codex konnte nicht antworten.',
  'assistant.error.codexReported': 'Codex hat einen Fehler gemeldet.',
  'assistant.error.codexStopped': 'Codex wurde unerwartet beendet.',
  'assistant.error.codexForbiddenServer': 'Codex wollte ein Werkzeug von „{server}“ verwenden, was Mission Desk nicht erlaubt, daher wurde die Antwort gestoppt.',
  'assistant.error.codexForbiddenOtherServer': 'Codex wollte ein Werkzeug von „einem anderen Server“ verwenden, was Mission Desk nicht erlaubt, daher wurde die Antwort gestoppt.',
  'assistant.error.codexForbiddenCommand': 'Codex wollte einen Befehl auf dem Mac ausführen, was Mission Desk nicht erlaubt, daher wurde die Antwort gestoppt.',
  'assistant.error.codexForbiddenBuiltIn': 'Codex wollte sein integriertes Werkzeug „{tool}“ verwenden, was Mission Desk nicht erlaubt, daher wurde die Antwort gestoppt.',
  'assistant.error.openRouterStatus': 'OpenRouter hat mit {status} geantwortet.',
  'assistant.error.openRouterConnect': 'Verbinde OpenRouter unter „Einstellungen“ → „Integrationen“.',
  'assistant.error.tooManySteps': '(Gestoppt: zu viele Schritte für eine Antwort.)',
  'assistant.error.modelError': 'Das Modell hat einen Fehler zurückgegeben.',
  'assistant.error.modelStopped': 'Das Modell wurde mit einem Fehler beendet.',

  // Connecting OpenRouter
  'assistant.openRouter.keyRejected': 'OpenRouter hat diesen Schlüssel nicht akzeptiert.',
  'assistant.openRouter.statusRetry': 'OpenRouter hat mit {status} geantwortet. Versuche es erneut.',
  'assistant.openRouter.unreachable': 'OpenRouter ist nicht erreichbar. Prüfe die Verbindung.',
  'assistant.keychainUnavailable': 'Der macOS-Schlüsselbund ist nicht verfügbar, daher wurde der Schlüssel nicht gesichert.',
};
