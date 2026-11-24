import type { Translation } from '../types';
import type { setup as en } from '../en/setup';

export const setup: Translation<typeof en> = {
  // Names the setup gives (src/shared/setup.ts)
  'setup.app.website': 'Website',
  'setup.spaces.tooLong': 'Gebruik minder dan {max} tekens.',
  'setup.spaces.taken': '{name} bestaat al.',

  // What each service brings (the tiles)
  'setup.service.googleWhat': 'Gmail, Agenda, Drive',
  'setup.service.slackWhat': 'Een werkruimte',
  'setup.service.whatsappWhat': 'Je chats',
  'setup.service.telegramWhat': 'Je chats',
  'setup.service.linkedinWhat': 'Berichten, feed',
  'setup.service.discordWhat': 'Servers, DM’s',
  'setup.service.zoomWhat': 'Team Chat, vergaderingen',
  'setup.service.notionWhat': 'Pagina’s, wiki’s',
  'setup.service.protonWhat': 'Privé-e-mail',
  'setup.service.icloudWhat': 'E-mail van Apple',
  'setup.service.fastmailWhat': 'E-mail, agenda',

  // Example and suggested space names
  'setup.spaceName.personal': 'Persoonlijk',
  'setup.spaceName.work': 'Werk',
  'setup.spaceName.sideProject': 'Zijproject',

  // Progress and navigation
  'setup.stage.welcome': 'Welkom',
  'setup.stage.assistant': 'Assistent',
  'setup.stage.spaces': 'Ruimtes',
  'setup.stage.apps': 'Apps',
  'setup.stage.ready': 'Klaar',
  'setup.progressLabel': 'Stap {step} van {total}: {stage}',
  'setup.skip': 'Sla configuratie over',
  'setup.skipTitle': 'Je kunt de configuratie later opnieuw doorlopen via Instellingen → Algemeen',
  'setup.nav.aboutAMinute': 'Duurt ongeveer een minuut.',
  'setup.nav.needSpace': 'Voeg een ruimte toe, of houd alles bij elkaar.',
  'setup.nav.getStarted': 'Aan de slag',
  'setup.nav.settingUp': 'Instellen…',
  'setup.nav.startSigningIn': 'Begin met inloggen',
  'setup.nav.openMissionDesk': 'Open Mission Desk',
  'setup.nav.continue': 'Ga door',
  'setup.finishError': 'Mission Desk kon ze niet toevoegen. Ga terug, controleer de namen van de ruimtes en de webadressen en probeer het opnieuw.',
  'setup.remove': 'Verwijder {name}',

  // Welcome
  'setup.welcome.nameLabel': 'Je naam (optioneel)',
  'setup.welcome.namePlaceholder': 'Hoe je genoemd wilt worden',
  'setup.welcome.title': 'Welkom bij Mission Desk',
  'setup.welcome.titleAgain': 'Stel meer van Mission Desk in',
  'setup.welcome.lede':
    'Al je apps naast elkaar, geordend in ruimtes, met één Start voor je dag en een assistent die elke ruimte kent.',
  'setup.welcome.ledeAgain': 'Voeg ruimtes en apps toe op dezelfde manier als de eerste keer. Wat je al hebt, blijft zoals het is.',
  'setup.welcome.accountsTitle': 'Elk account apart ingelogd',
  'setup.welcome.accountsText': 'Twee Google-accounts, drie Slack-werkruimtes: elk houdt een eigen login.',
  'setup.welcome.homeTitle': 'Start toont wat er komt',
  'setup.welcome.homeText': 'Je vergaderingen, taken en ongelezen berichten, en met één klik deelnemen aan een gesprek.',
  'setup.welcome.assistantTitle': 'Een assistent die in zijn ruimte blijft',
  'setup.welcome.assistantText': 'Hij leest alleen de apps die je met hem deelt, en alleen in die ruimte.',
  'setup.welcome.meetingsTitle': 'Vergaderingen uitgeschreven op je Mac',
  'setup.welcome.meetingsText': 'In Meet, Teams en Zoom, met de samenvatting en je taken aan het eind. Het geluid verlaat je Mac nooit.',

  // Assistant
  'setup.assistant.title': 'Wil je een assistent?',
  'setup.assistant.lede':
    'Hij praat je bij over je dag, ziet wie er op je wacht en bereidt je vergaderingen voor, op basis van de apps die je met hem deelt.',
  'setup.assistant.groupLabel': 'Assistent',
  'setup.assistant.claudeHint': 'Gebruikt je Claude-abonnement, via Claude Code op deze Mac.',
  'setup.assistant.codexHint': 'Gebruikt je ChatGPT-abonnement, via Codex op deze Mac.',
  'setup.assistant.openrouterHint': 'GPT, Gemini, Llama en meer, met je eigen OpenRouter-sleutel.',
  'setup.assistant.offName': 'Nu niet',
  'setup.assistant.offHint': 'Je kunt er later een toevoegen in Instellingen.',
  'setup.assistant.addAnother': '+ Nog een account toevoegen',
  'setup.assistant.perSpaceTitle': 'Kies een assistent per ruimte',
  'setup.assistant.perSpaceText': 'Bijvoorbeeld een ander Claude-account voor je werk. Een ruimte die je laat zoals hij is, gebruikt die hierboven.',
  'setup.assistant.spaceLabel': 'Assistent van {name}',
  'setup.assistant.sameAsAbove': 'Zoals hierboven ({name})',
  'setup.assistant.meetings': 'Je apps hebben gesprekken: als een vergadering afloopt, kan de assistent van de ruimte de samenvatting en je taken schrijven.',
  'setup.assistant.readsTitle': 'Laat de assistent deze apps lezen',
  'setup.assistant.signInAgain': '{name} is niet ingelogd.',

  // Connecting the assistant
  'setup.engine.checking': '{name} controleren…',
  'setup.engine.readyOpenRouter': 'OpenRouter is gekoppeld. {name} is klaar.',
  'setup.engine.readySignedIn': '{app} is ingelogd op deze Mac. {name} is klaar.',
  'setup.engine.keyLabel': 'Je OpenRouter-sleutel',
  'setup.engine.checkingKey': 'Controleren…',
  'setup.engine.connect': 'Koppel',
  'setup.engine.keyRefused': 'OpenRouter heeft deze sleutel geweigerd. Controleer hem en probeer het opnieuw.',
  'setup.engine.keyHelp':
    'Maak er een aan op <link>openrouter.ai/keys</link>. macOS bewaart hem versleuteld op deze Mac; OpenRouter factureert wat je gebruikt.',
  'setup.engine.finishInBrowser': 'Rond het inloggen af in je browser…',
  'setup.engine.installed': '{app} is geïnstalleerd. Log één keer in met je {account}-account.',
  'setup.engine.signIn': 'Log in',
  'setup.engine.installClaude': 'Claude heeft Claude Code nodig op deze Mac. Open Terminal, plak dit en druk op Return:',
  'setup.engine.installCodex':
    'OpenAI Codex heeft het Codex-opdrachtregelprogramma nodig op deze Mac. Open Terminal, plak dit en druk op Return:',
  'setup.engine.copy': 'Kopieer',
  'setup.engine.copied': 'Gekopieerd',
  'setup.engine.npmMissing': 'Als Terminal meldt dat npm niet is gevonden, installeer dan eerst Node.js via nodejs.org.',
  'setup.engine.installedIt': 'Ik heb het geïnstalleerd',
  'setup.engine.later': 'Je kunt dit ook later afronden, in Instellingen → Integraties.',

  // Spaces
  'setup.spaces.title': 'Hoe wil je je werk ordenen?',
  'setup.spaces.lede': 'Een ruimte voor elk bedrijf, project of deel van je leven, zoals Persoonlijk, Acme of Zijproject.',
  'setup.spaces.listLabel': 'Je ruimtes',
  'setup.spaces.placeholderFirst': 'Geef een ruimte een naam, zoals Acme',
  'setup.spaces.placeholderMore': 'Nog een ruimte',
  'setup.spaces.nameLabel': 'Naam van ruimte',
  'setup.spaces.full': {
    one: 'Dat is {count} ruimte, het maximum dat de configuratie aanmaakt. Je kunt er later meer toevoegen.',
    other: 'Dat zijn {count} ruimtes, het maximum dat de configuratie aanmaakt. Je kunt er later meer toevoegen.',
  },
  'setup.spaces.ideas': 'Ideeën:',
  'setup.spaces.togetherTitle': 'Houd alles bij elkaar',
  'setup.spaces.togetherText': 'Al je apps in één lijst, zonder ruimtes. Je kunt later ruimtes aanmaken.',

  // Apps
  'setup.apps.title': 'Welke apps gebruik je?',
  'setup.apps.titleSpace': 'Welke apps horen in {name}?',
  'setup.apps.lede': 'Kies er zoveel als je wilt. Aan het eind log je bij elke app in.',
  'setup.apps.ledeSpace': 'Kies er zoveel als je wilt. {name} is ruimte {n} van {total}. Aan het eind log je bij elke app in.',
  'setup.apps.accounts': { one: '{count} account', other: '{count} accounts' },
  'setup.apps.oneFewer': 'Eén {name}-account minder',
  'setup.apps.another': 'Nog een {name}-account',
  'setup.apps.anyWebsite': 'Elke website',
  'setup.apps.sitesAdded': { one: '{count} toegevoegd', other: '{count} toegevoegd' },
  'setup.apps.badAddress': 'Dat lijkt geen webadres. Probeer iets als notion.so.',
  'setup.apps.alreadyListed': 'Die staat al in de lijst.',
  'setup.apps.addressPlaceholder': 'Webadres, zoals notion.so',
  'setup.apps.addressLabel': 'Webadres',
  'setup.apps.full': {
    one: 'Dat is {count} app, het maximum voor één ruimte hier. Je kunt er later meer toevoegen.',
    other: 'Dat zijn {count} apps, het maximum voor één ruimte hier. Je kunt er later meer toevoegen.',
  },
  'setup.apps.needsOne': 'Een ruimte heeft minstens één app nodig. Zonder apps wordt {name} overgeslagen; je kunt die later aanmaken.',

  // Ready
  'setup.ready.nothingTitle': 'Nog niets om toe te voegen',
  'setup.ready.nothingText':
    'Je hebt geen apps gekozen. Ga terug om er een paar te kiezen, of open Mission Desk en voeg ze een voor een toe met de + in de navigatiekolom.',
  'setup.ready.title': 'Klaar om in te loggen',
  'setup.ready.lede': {
    one: 'Mission Desk voegt je app toe en opent eerst {first}. Log één keer bij elke app in; die blijft ingelogd op deze Mac.',
    other:
      'Mission Desk voegt je {count} apps toe en opent eerst {first}. Log één keer bij elke app in; die blijft ingelogd op deze Mac.',
  },
  'setup.ready.ledeSpaces':
    'Mission Desk voegt je {count} apps toe in {spaces} ruimtes en opent eerst {first}. Log één keer bij elke app in; die blijft ingelogd op deze Mac.',
  'setup.ready.alreadyThere': 'Bestaat al: wordt aangevuld',
  'setup.ready.noAssistant': 'Geen assistent',
  'setup.ready.keepsAssistant': 'Houdt zijn assistent',
  'setup.ready.readsText':
    'Zo kan die je bijpraten en zien wie er op je wacht. Typen, klikken of versturen in de apps kan niet. Je kunt dit per app wijzigen in Instellingen.',

  // The sidebar preview
  'setup.dock.home': 'Start',
  'setup.dock.appsHere': 'Je apps verschijnen hier.',
  'setup.dock.spacesHere': 'Je ruimtes verschijnen hier.',
  'setup.dock.example': 'Een voorbeeld. Het jouwe krijgt vorm terwijl je antwoordt.',
  'setup.dock.yours': 'Jouw Mission Desk',
};
