import type { Translation } from '../types';
import type { assistant as en } from '../en/assistant';

export const assistant: Translation<typeof en> = {
  'assistant.title': 'Assistent',
  'assistant.closeShortcut': 'Sluit (⌘J)',
  'assistant.copy': 'Kopieer',
  'assistant.copied': 'Gekopieerd',
  'assistant.stop': 'Stop',

  // Models and effort (the menus under the chat and in Settings)
  'assistant.model.default': 'Standaard (Claude Code)',
  'assistant.effort.low': 'laag',
  'assistant.effort.medium': 'gemiddeld',
  'assistant.effort.high': 'hoog',
  'assistant.effort.xhigh': 'zeer hoog',
  'assistant.effort.max': 'max',

  // The "/" menu
  'assistant.command.brief': 'Je dag in al je accounts',
  'assistant.command.waiting': 'Wie er op je wacht',
  'assistant.command.prep': 'Bereid je volgende vergadering voor',
  'assistant.command.schedule': 'Zoek een tijd en plan die in',
  'assistant.command.reply': 'Stel een antwoord op in de open thread',
  'assistant.command.summarize': 'Vat samen wat er op het scherm staat',
  'assistant.command.catchup': 'Wat er in een account is gebeurd',

  // Tool steps in an answer
  'assistant.tool.currentContext': 'Kijkt naar je scherm',
  'assistant.tool.listAccounts': 'Accounts opsommen',
  'assistant.tool.readPage': '{account} lezen',
  'assistant.tool.readPageTab': '{account} lezen · {tab}',
  'assistant.tool.readPageAny': 'Een pagina lezen',
  'assistant.tool.readPageAnyTab': 'Een pagina lezen · {tab}',
  'assistant.tool.getElements': 'Kijkt naar {account}',
  'assistant.tool.getElementsAny': 'Kijkt naar de pagina',
  'assistant.tool.screenshot': 'Schermafbeelding van {account}',
  'assistant.tool.screenshotAny': 'Schermafbeelding van de pagina',
  'assistant.tool.openUrl': 'Een pagina openen in {account}',
  'assistant.tool.openUrlAny': 'Een pagina openen in een account',
  'assistant.tool.click': 'Klikken in {account}',
  'assistant.tool.clickAny': 'Klikken in een account',
  'assistant.tool.type': 'Typen in {account}',
  'assistant.tool.typeAny': 'Typen in een account',
  'assistant.tool.press': 'Drukt op {key}',
  'assistant.tool.pressAny': 'Drukt op een toets',
  'assistant.tool.calendarEvents': 'Agenda’s controleren',
  'assistant.tool.findFreeTime': 'Vrije tijd zoeken',
  'assistant.tool.createEvent': 'Wacht op je akkoord om de activiteit aan te maken',
  'assistant.tool.unreadCounts': 'Ongelezen tellen',

  // The chat panel
  'assistant.panel.scopeTitle': 'Voor welke ruimte deze assistent werkt',
  'assistant.panel.history': 'Geschiedenis',
  'assistant.panel.newChat': 'Nieuwe chat',
  'assistant.history.title': '{scope} · geschiedenis',
  'assistant.history.empty': 'Nog geen gesprekken.',
  'assistant.history.deleteLabel': 'Verwijder {title}',
  'assistant.empty.off': 'De assistent staat uit voor <b>{scope}</b>.',
  'assistant.empty.openSettings': 'Open Instellingen → Assistent',
  'assistant.empty.noAccount': 'Er staat nog geen account in <b>{scope}</b> aan voor de assistent.',
  'assistant.empty.chooseInSettings': 'Kies in Instellingen → Assistent',
  'assistant.empty.askAll': 'Vraag alles over <b>al je accounts</b>, of begin met:',
  'assistant.empty.askScope': 'Vraag alles over <b>{scope}</b>, of begin met:',
  'assistant.empty.seesAll': 'Hij ziet elk gedeeld account.',
  'assistant.empty.seesScope': 'Hij ziet alleen de accounts van {scope}: {accounts}.',
  'assistant.empty.tip': 'Typ / voor opdrachten, @ voor een account. Er wordt niets namens jou verstuurd.',
  'assistant.working': 'Bezig…',
  'assistant.problem.signedOut': '<b>Claude Code kan niet antwoorden: je moet opnieuw inloggen.</b> Open Terminal en voer <code>claude auth login</code> uit, en probeer het dan opnieuw.',
  'assistant.problem.failed': 'Er is iets misgegaan.',
  'assistant.problem.retry': 'Probeer opnieuw',
  'assistant.compose.placeholderOff': 'De assistent staat uit voor deze ruimte',
  'assistant.compose.placeholder': 'Stel een vraag, of typ / voor opdrachten…',
  'assistant.compose.placeholderNoAccount': 'Zet eerst een account aan (Instellingen → Assistent)',
  'assistant.compose.model': 'Model',
  'assistant.compose.changeEngine': 'Wijzig in Instellingen → Assistent',
  'assistant.compose.effort': 'Inspanning (hoe diep hij nadenkt)',
  'assistant.compose.send': 'Verstuur',

  // The chat window before the chat (an engine that isn't connected)
  'assistant.window.notConnected': 'Deze ruimte gebruikt <b>{engine}</b>, maar die is nog niet gekoppeld.',
  'assistant.window.connect': 'Koppel in Instellingen → Integraties',
  'assistant.window.chooseAnother': 'Of kies een andere assistent voor deze ruimte in <link>Instellingen → Assistent</link>.',

  // The floating button
  'assistant.fab.closeTitle': 'Sluit de assistent  (⌘J)',
  'assistant.fab.close': 'Sluit de assistent',
  'assistant.fab.actionsTitle': 'Snelle acties · sleep om te verplaatsen',
  'assistant.fab.actions': 'Snelle acties',

  // Setup steps
  'assistant.setup.intro':
    'De assistent leest je accounts en beantwoordt vragen, stelt antwoorden op en zoekt tijd voor vergaderingen. Hij werkt met <b>Claude Code</b>, met je eigen Claude-abonnement. Twee stappen om te beginnen:',
  'assistant.setup.connectClaude': 'Koppel Claude',
  'assistant.setup.checking': 'Controleren…',
  'assistant.setup.notInstalled': 'Claude Code staat nog niet op deze Mac. Open Terminal, plak dit en druk op Return:',
  'assistant.setup.needsPlan': 'Er is een Claude Pro- of Max-abonnement nodig (of een Anthropic Console-account).',
  'assistant.setup.installed': 'Ik heb het geïnstalleerd',
  'assistant.setup.signInIntro': 'Log in met je Claude-account. Je browser wordt geopend; kom hier terug als er staat dat je bent ingelogd.',
  'assistant.setup.waiting': 'Wachten tot je klaar bent in de browser…',
  'assistant.setup.slow': 'Duurt het lang? Open Terminal en voer <code>claude auth login</code> uit, en <link>controleer opnieuw</link>.',
  'assistant.setup.signIn': 'Log in bij Claude',
  'assistant.setup.signInFailed': 'Nog niet ingelogd. Je kunt ook Terminal openen en <code>claude auth login</code> uitvoeren, en dan <link>opnieuw controleren</link>.',
  'assistant.setup.chooseAccounts': 'Kies wat hij mag lezen',
  'assistant.setup.accountsIntro': 'Alleen deze accounts zijn voor hem zichtbaar. Hij verstuurt nooit iets namens jou; om te klikken of te typen vraagt hij het eerst.',
  'assistant.setup.changeLater': 'Je kunt dit later wijzigen in Instellingen → Assistent.',

  // Connect Claude (Claude Code / Claude Desktop on this Mac)
  'assistant.connect.title': 'Koppel Claude',
  'assistant.connect.hint': 'Laat Claude Code of Claude Desktop op deze Mac lezen en werken in de accounts die je kiest. Er verlaat niets je Mac, behalve via Claude zelf.',
  'assistant.connect.allow': 'Sta Claude toe te koppelen',
  'assistant.connect.claudeCode': 'Claude Code — voer uit in Terminal',
  'assistant.connect.claudeDesktop': 'Claude Desktop — voeg toe aan claude_desktop_config.json',
  'assistant.connect.accessHint':
    'Geef daarna elk account toegang (Instellingen → Accounts, of klik er met de rechtermuisknop op → <b>Toegang voor Claude</b>): Lezen, of Lezen en handelen. Claude moet het je vragen voordat hij klikt of typt, en je kunt hem altijd stoppen met ⌘.',

  // The banner while Claude acts in an account
  'assistant.banner.working': 'Claude is bezig in <b>{name}</b>',
  'assistant.banner.thisAccount': 'dit account',

  // Conversations
  'assistant.conversation.newTitle': 'Nieuwe chat',
  'assistant.startedFresh': '(De eerdere context van dit gesprek was niet meer beschikbaar, dus ik ben opnieuw begonnen.)',

  // Errors shown in the chat
  'assistant.error.claudeNotInstalled': 'Claude Code is niet geïnstalleerd.',
  'assistant.error.claudeReported': 'Claude Code heeft een fout gemeld.',
  'assistant.error.claudeStopped': 'Claude Code is onverwacht gestopt.',
  'assistant.error.defaultModel':
    'Het eigen standaardmodel van Claude Code kan hier niet worden gebruikt (melding: “{message}”). Kies een model voor deze ruimte, zoals Sonnet of Opus, in het menu onder de chat of in Instellingen → Assistent. Of pas het “model” aan in je Claude Code-instellingen (~/.claude/settings.json).',
  'assistant.error.codexNotInstalled': 'OpenAI Codex is niet geïnstalleerd.',
  'assistant.error.codexCouldNotAnswer': 'Codex kon niet antwoorden.',
  'assistant.error.codexReported': 'Codex heeft een fout gemeld.',
  'assistant.error.codexStopped': 'Codex is onverwacht gestopt.',
  'assistant.error.codexForbiddenServer': 'Codex probeerde een tool van “{server}” te gebruiken. Mission Desk staat dat niet toe, dus het antwoord is gestopt.',
  'assistant.error.codexForbiddenOtherServer': 'Codex probeerde een tool van “een andere server” te gebruiken. Mission Desk staat dat niet toe, dus het antwoord is gestopt.',
  'assistant.error.codexForbiddenCommand': 'Codex probeerde een opdracht op de Mac uit te voeren. Mission Desk staat dat niet toe, dus het antwoord is gestopt.',
  'assistant.error.codexForbiddenBuiltIn': 'Codex probeerde de ingebouwde tool “{tool}” te gebruiken. Mission Desk staat dat niet toe, dus het antwoord is gestopt.',
  'assistant.error.openRouterStatus': 'OpenRouter antwoordde met {status}.',
  'assistant.error.openRouterConnect': 'Koppel OpenRouter in Instellingen → Integraties.',
  'assistant.error.tooManySteps': '(Gestopt: te veel stappen voor één antwoord.)',
  'assistant.error.modelError': 'Het model gaf een fout.',
  'assistant.error.modelStopped': 'Het model is gestopt met een fout.',

  // Connecting OpenRouter
  'assistant.openRouter.keyRejected': 'OpenRouter heeft deze sleutel niet geaccepteerd.',
  'assistant.openRouter.statusRetry': 'OpenRouter antwoordde met {status}. Probeer het opnieuw.',
  'assistant.openRouter.unreachable': 'Kan OpenRouter niet bereiken. Controleer de verbinding.',
  'assistant.keychainUnavailable': 'De macOS-sleutelhanger is niet beschikbaar, dus de sleutel is niet bewaard.',
  "assistant.error.claudeAccountMissing": "Het Claude-account van deze ruimte is verwijderd. Kies het Claude-account ervan in Instellingen → Assistent.",
};
