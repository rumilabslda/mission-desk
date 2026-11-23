import type { Translation } from '../types';
import type { setup as en } from '../en/setup';

export const setup: Translation<typeof en> = {
  // Names the setup gives (src/shared/setup.ts)
  'setup.app.website': 'Sito web',
  'setup.spaces.tooLong': 'Usa meno di {max} caratteri.',
  'setup.spaces.taken': '{name} esiste già.',

  // What each service brings (the tiles)
  'setup.service.googleWhat': 'Gmail, Calendar, Drive',
  'setup.service.slackWhat': 'Un workspace',
  'setup.service.whatsappWhat': 'Le tue chat',
  'setup.service.telegramWhat': 'Le tue chat',
  'setup.service.linkedinWhat': 'Messaggi, feed',
  'setup.service.discordWhat': 'Server, messaggi diretti',
  'setup.service.zoomWhat': 'Team Chat, riunioni',
  'setup.service.notionWhat': 'Pagine, wiki',
  'setup.service.protonWhat': 'Email privata',
  'setup.service.icloudWhat': 'Email di Apple',
  'setup.service.fastmailWhat': 'Email, calendario',

  // Example and suggested space names
  'setup.spaceName.personal': 'Personale',
  'setup.spaceName.work': 'Lavoro',
  'setup.spaceName.sideProject': 'Progetto personale',

  // Progress and navigation
  'setup.stage.welcome': 'Benvenuto',
  'setup.stage.assistant': 'Assistente',
  'setup.stage.spaces': 'Spazi',
  'setup.stage.apps': 'App',
  'setup.stage.ready': 'Pronto',
  'setup.progressLabel': 'Passaggio {step} di {total}: {stage}',
  'setup.skip': 'Salta configurazione',
  'setup.skipTitle': 'Puoi ripetere la configurazione da Impostazioni → Generali',
  'setup.nav.aboutAMinute': 'Ci vuole circa un minuto.',
  'setup.nav.needSpace': 'Aggiungi uno spazio oppure tieni tutto insieme.',
  'setup.nav.getStarted': 'Inizia',
  'setup.nav.settingUp': 'Configurazione…',
  'setup.nav.startSigningIn': 'Inizia ad accedere',
  'setup.nav.openMissionDesk': 'Apri Mission Desk',
  'setup.nav.continue': 'Continua',
  'setup.finishError': 'Mission Desk non è riuscito ad aggiungerli. Torna indietro e controlla i nomi degli spazi e gli indirizzi web, poi riprova.',
  'setup.remove': 'Rimuovi {name}',

  // Welcome
  'setup.welcome.title': 'Benvenuto in Mission Desk',
  'setup.welcome.titleAgain': 'Configura altro in Mission Desk',
  'setup.welcome.lede':
    'Tutte le tue app una accanto all’altra, organizzate in spazi, con una sola Home per la tua giornata e un assistente che conosce ogni spazio.',
  'setup.welcome.ledeAgain': 'Aggiungi spazi e app come la prima volta. Ciò che hai già resta com’è.',
  'setup.welcome.accountsTitle': 'Ogni account con il suo accesso',
  'setup.welcome.accountsText': 'Due account Google, tre workspace Slack: ognuno mantiene il proprio login.',
  'setup.welcome.homeTitle': 'Home mostra cosa ti aspetta',
  'setup.welcome.homeText': 'Le tue riunioni, attività e messaggi non letti, e un clic per entrare in una chiamata.',
  'setup.welcome.assistantTitle': 'Un assistente che resta nel suo spazio',
  'setup.welcome.assistantText': 'Legge solo le app che condividi con lui, e solo in quello spazio.',
  'setup.welcome.meetingsTitle': 'Riunioni trascritte sul tuo Mac',
  'setup.welcome.meetingsText': 'In Meet, Teams e Zoom, con il riepilogo e le tue attività alla fine. L’audio non lascia mai il tuo Mac.',

  // Assistant
  'setup.assistant.title': 'Vuoi un assistente?',
  'setup.assistant.lede':
    'Ti fa il punto sulla giornata, trova chi aspetta una tua risposta e prepara le tue riunioni, a partire dalle app che condividi con lui.',
  'setup.assistant.groupLabel': 'Assistente',
  'setup.assistant.claudeHint': 'Usa il tuo piano Claude, tramite Claude Code su questo Mac.',
  'setup.assistant.codexHint': 'Usa il tuo piano ChatGPT, tramite Codex su questo Mac.',
  'setup.assistant.openrouterHint': 'GPT, Gemini, Llama e altri, con la tua chiave OpenRouter.',
  'setup.assistant.offName': 'Non ora',
  'setup.assistant.offHint': 'Puoi aggiungerne uno più tardi in Impostazioni.',
  'setup.assistant.addAnother': '+ Aggiungi un altro account',
  'setup.assistant.perSpaceTitle': 'Scegli un assistente per ogni spazio',
  'setup.assistant.perSpaceText': 'Per esempio un altro account Claude per il lavoro. Uno spazio lasciato così usa quello sopra.',
  'setup.assistant.spaceLabel': 'Assistente di {name}',
  'setup.assistant.sameAsAbove': 'Come sopra ({name})',
  'setup.assistant.meetings': 'Le tue app hanno chiamate: quando una riunione finisce, l’assistente dello spazio può scriverne il riepilogo e le tue attività.',
  'setup.assistant.readsTitle': 'Consenti all’assistente di leggere queste app',
  'setup.assistant.signInAgain': '{name} non ha effettuato l’accesso.',

  // Connecting the assistant
  'setup.engine.checking': 'Verifica di {name}…',
  'setup.engine.readyOpenRouter': 'OpenRouter è collegato. {name} è pronto.',
  'setup.engine.readySignedIn': 'Hai effettuato l’accesso a {app} su questo Mac. {name} è pronto.',
  'setup.engine.keyLabel': 'La tua chiave OpenRouter',
  'setup.engine.checkingKey': 'Verifica…',
  'setup.engine.connect': 'Collega',
  'setup.engine.keyRefused': 'OpenRouter ha rifiutato questa chiave. Controllala e riprova.',
  'setup.engine.keyHelp':
    'Creane una su <link>openrouter.ai/keys</link>. macOS la conserva cifrata su questo Mac; OpenRouter addebita ciò che usi.',
  'setup.engine.finishInBrowser': 'Completa l’accesso nel browser…',
  'setup.engine.installed': '{app} è installato. Accedi una volta, con il tuo account {account}.',
  'setup.engine.signIn': 'Accedi',
  'setup.engine.installClaude': 'Claude ha bisogno di Claude Code su questo Mac. Apri Terminale, incolla questo comando e premi Invio:',
  'setup.engine.installCodex':
    'OpenAI Codex ha bisogno dello strumento a riga di comando Codex su questo Mac. Apri Terminale, incolla questo comando e premi Invio:',
  'setup.engine.copy': 'Copia',
  'setup.engine.copied': 'Copiato',
  'setup.engine.npmMissing': 'Se Terminale dice che npm non è stato trovato, installa prima Node.js da nodejs.org.',
  'setup.engine.installedIt': 'L’ho installato',
  'setup.engine.later': 'Puoi anche completare questo passaggio più tardi, in Impostazioni → Integrazioni.',

  // Spaces
  'setup.spaces.title': 'Come vuoi organizzare il tuo lavoro?',
  'setup.spaces.lede': 'Uno spazio per ogni azienda, progetto o parte della tua vita, come Personale, Acme o Progetto personale.',
  'setup.spaces.listLabel': 'I tuoi spazi',
  'setup.spaces.placeholderFirst': 'Dai un nome a uno spazio, es. Acme',
  'setup.spaces.placeholderMore': 'Un altro spazio',
  'setup.spaces.nameLabel': 'Nome dello spazio',
  'setup.spaces.full': {
    one: 'Sei a {count} spazio, il massimo che la configurazione crea. Potrai aggiungerne altri in seguito.',
    other: 'Sei a {count} spazi, il massimo che la configurazione crea. Potrai aggiungerne altri in seguito.',
  },
  'setup.spaces.ideas': 'Idee:',
  'setup.spaces.togetherTitle': 'Tieni tutto insieme',
  'setup.spaces.togetherText': 'Tutte le tue app in un solo elenco, senza spazi. Potrai creare degli spazi in seguito.',

  // Apps
  'setup.apps.title': 'Quali app usi?',
  'setup.apps.titleSpace': 'Quali app vanno in {name}?',
  'setup.apps.lede': 'Scegline quante vuoi. Accederai a ciascuna alla fine.',
  'setup.apps.ledeSpace': 'Scegline quante vuoi. {name} è lo spazio {n} di {total}. Accederai a ciascuna alla fine.',
  'setup.apps.accounts': { one: '{count} account', other: '{count} account' },
  'setup.apps.oneFewer': 'Un account {name} in meno',
  'setup.apps.another': 'Un altro account {name}',
  'setup.apps.anyWebsite': 'Qualsiasi sito web',
  'setup.apps.sitesAdded': { one: '{count} aggiunto', other: '{count} aggiunti' },
  'setup.apps.badAddress': 'Non sembra un indirizzo web. Prova qualcosa come notion.so.',
  'setup.apps.alreadyListed': 'È già nell’elenco.',
  'setup.apps.addressPlaceholder': 'Indirizzo web, es. notion.so',
  'setup.apps.addressLabel': 'Indirizzo web',
  'setup.apps.full': {
    one: 'Sei a {count} app, il massimo per uno spazio qui. Potrai aggiungerne altre in seguito.',
    other: 'Sei a {count} app, il massimo per uno spazio qui. Potrai aggiungerne altre in seguito.',
  },
  'setup.apps.needsOne': 'Uno spazio ha bisogno di almeno un’app. Senza app, {name} viene escluso; potrai crearlo in seguito.',

  // Ready
  'setup.ready.nothingTitle': 'Ancora niente da aggiungere',
  'setup.ready.nothingText':
    'Non hai scelto nessuna app. Torna indietro per sceglierne qualcuna, oppure apri Mission Desk e aggiungile una alla volta con il + nella barra laterale.',
  'setup.ready.title': 'Pronto per accedere',
  'setup.ready.lede': {
    one: 'Mission Desk aggiunge la tua app e apre prima {first}. Accedi a ciascuna una volta; l’accesso resta attivo su questo Mac.',
    other:
      'Mission Desk aggiunge le tue {count} app e apre prima {first}. Accedi a ciascuna una volta; l’accesso resta attivo su questo Mac.',
  },
  'setup.ready.ledeSpaces':
    'Mission Desk aggiunge le tue {count} app in {spaces} spazi e apre prima {first}. Accedi a ciascuna una volta; l’accesso resta attivo su questo Mac.',
  'setup.ready.alreadyThere': 'Esiste già: verranno aggiunte qui',
  'setup.ready.noAssistant': 'Nessun assistente',
  'setup.ready.keepsAssistant': 'Mantiene il suo assistente',
  'setup.ready.readsText':
    'Così può farti il punto e trovare chi aspetta una tua risposta. Non può digitare, fare clic o inviare nulla al loro interno. Puoi modificarlo per ogni app in Impostazioni.',

  // The sidebar preview
  'setup.dock.home': 'Home',
  'setup.dock.appsHere': 'Le tue app compariranno qui.',
  'setup.dock.spacesHere': 'I tuoi spazi compariranno qui.',
  'setup.dock.example': 'Un esempio. Il tuo prende forma mentre rispondi.',
  'setup.dock.yours': 'Il tuo Mission Desk',
};
