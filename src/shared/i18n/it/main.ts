import type { Translation } from '../types';
import type { main as en } from '../en/main';

export const main: Translation<typeof en> = {
  // The app menu (Mission Desk). {app} is the app's name.
  'main.menu.about': 'Informazioni su {app}',
  'main.menu.services': 'Servizi',
  'main.menu.hide': 'Nascondi {app}',
  'main.menu.hideOthers': 'Nascondi altre',
  'main.menu.showAll': 'Mostra tutte',
  'main.menu.quit': 'Esci da {app}',
  'main.menu.checkForUpdates': 'Verifica aggiornamenti…',
  'main.menu.settings': 'Impostazioni…',
  'main.menu.assistant': 'Assistente',
  'main.menu.connectClaude': 'Collega Claude…',
  // Edit
  'main.menu.edit': 'Composizione',
  'main.menu.undo': 'Annulla',
  'main.menu.redo': 'Ripeti',
  'main.menu.cut': 'Taglia',
  'main.menu.copy': 'Copia',
  'main.menu.paste': 'Incolla',
  'main.menu.pasteAndMatchStyle': 'Incolla e adatta stile',
  'main.menu.selectAll': 'Seleziona tutto',
  'main.menu.speech': 'Voce',
  'main.menu.startSpeaking': 'Avvia lettura',
  'main.menu.stopSpeaking': 'Interrompi lettura',
  // View
  'main.menu.view': 'Vista',
  'main.menu.reload': 'Ricarica',
  'main.menu.forward': 'Avanti',
  'main.menu.sidebarStyle': 'Stile della barra laterale',
  'main.menu.sidebarFolders': 'Cartelle',
  'main.menu.sidebarPanel': 'Cartelle con pannello',
  'main.menu.sidebarSections': 'Sezioni',
  'main.menu.devTools': 'Strumenti per sviluppatori per questo account',
  'main.menu.toggleFullScreen': 'Attiva/disattiva modalità a tutto schermo',
  // Accounts
  'main.menu.accounts': 'Account',
  'main.menu.home': 'Home',
  'main.menu.allCalendars': 'Tutti i calendari',
  'main.menu.copyMeetLink': 'Copia link Meet',
  'main.menu.newEvent': 'Nuovo evento',
  'main.menu.newTodo': 'Nuova attività',
  'main.menu.account': 'Account {n}',
  'main.menu.stopClaude': 'Ferma Claude',
  // Window
  'main.menu.window': 'Finestra',
  'main.menu.minimize': 'Contrai',
  'main.menu.zoom': 'Ridimensiona',
  'main.menu.front': 'Porta tutto in primo piano',
  // Help
  'main.menu.help': 'Aiuto',
  'main.menu.siteMissionDesk': 'Sito web di Mission Desk',
  'main.menu.siteRumiLabs': 'Sito web di Rumi Labs',

  // An account's right-click menu.
  'main.account.edit': 'Modifica…',
  'main.account.muteNotifications': 'Silenzia notifiche',
  'main.account.hibernate': 'Iberna quando non è in uso',
  'main.account.icon': 'Icona',
  'main.account.claudeAccess': 'Accesso di Claude',
  'main.account.accessRead': 'Lettura',
  'main.account.accessAct': 'Lettura e azioni',
  'main.account.moveToSpace': 'Sposta nello spazio',
  'main.account.newSpace': 'Nuovo spazio…',
  'main.account.moveUp': 'Sposta su',
  'main.account.moveDown': 'Sposta giù',
  'main.account.remove': 'Rimuovi…',
  'main.account.removeTitle': 'Rimuovere {name}?',
  'main.account.removeDetail': 'Verrà effettuata l’uscita e i suoi dati su questo Mac verranno eliminati.',

  // An account's icon (right-click → Icon).
  'main.icon.sameAs': 'Come {name}',
  'main.icon.auto': 'Logo aziendale o foto',
  'main.icon.service': 'Logo del servizio',
  'main.icon.letter': 'Lettera',
  'main.icon.chooseImage': 'Scegli immagine…',
  'main.icon.chooseTitle': 'Scegli un’immagine per {name}',
  'main.icon.imagesFilter': 'Immagini',
  'main.icon.openFailed': 'Impossibile aprire l’immagine.',
  'main.icon.openFailedDetail': 'Prova con un file PNG o JPEG.',

  // A space's right-click menu, and the + menu.
  'main.space.rename': 'Rinomina…',
  'main.space.alwaysOpen': 'Sempre aperto',
  'main.space.shareGoogle': 'Condividi l’accesso a Google',
  'main.space.googleFrom': 'Accesso a Google da',
  'main.space.ungroup': 'Separa',
  'main.add.app': 'Aggiungi app…',
  'main.add.space': 'Aggiungi spazio…',

  // Quick actions (the ⚡ button's menu).
  'main.quick.title': 'Azioni rapide',
  'main.quick.titleFor': 'Azioni rapide · {name}',
  'main.quick.noGoogleInSpace': 'Aggiungi un account Google a questo spazio',
  'main.quick.needGoogle': 'Prima aggiungi un account Google',
  'main.quick.askAssistant': 'Chiedi all’assistente',

  // Copy Meet Link.
  'main.meet.noLink': 'Nessun link riunione',
  'main.meet.noGoogle': 'Questo spazio non ha un account Google. Aggiungine uno per creare link Meet.',
  'main.meet.creating': 'Creazione del link riunione…',
  'main.meet.copied': 'Link riunione copiato',
  /** {link}: the link without https://; {keys}: ⌘V or Ctrl+V. */
  'main.meet.copiedDetail': '{link} · {keys} per incollare',
  'main.meet.copiedBody': '{url}: incollalo con {keys}.',
  'main.meet.errorSignedOut': 'Accedi a Google in questo spazio, poi riprova.',
  'main.meet.errorOffline': 'Mission Desk è offline. Controlla la connessione e riprova.',
  'main.meet.errorForbidden': 'Google ha rifiutato di creare una riunione per questo account.',
  'main.meet.errorUnsupported': 'Google non è riuscito a creare una riunione per questo account.',
  'main.meet.errorGeneric': 'Google non è riuscito a creare una riunione. Riprova tra poco.',
  /** The title of the event Copy Meet Link creates in the user's Google Calendar. */
  'main.meet.quickCallTitle': 'Chiamata veloce',

  // The assistant asks before it keeps a note, saves a skill or creates an event. {where}: a space's name.
  'main.assistant.thisSpace': 'questo spazio',
  'main.assistant.rememberTitle': 'Ricordare questa nota per {where}?',
  'main.assistant.forgetTitle': 'Dimenticare questa nota in {where}?',
  'main.assistant.rememberDetail':
    '{note}\n\nRichiesto dall’assistente. Solo l’assistente di {where} la vedrà. Puoi vedere e modificare ogni nota in Impostazioni → Assistente.',
  'main.assistant.forgetDetail': '{note}\n\nRichiesto dall’assistente. Puoi vedere e modificare ogni nota in Impostazioni → Assistente.',
  'main.assistant.remember': 'Ricorda',
  'main.assistant.forget': 'Dimentica',
  'main.assistant.saveSkillTitle': 'Salvare la skill “{name}” per {where}?',
  'main.assistant.saveSkillDetailAlways':
    'Sempre attiva: {description}\n\n{instructions}\n\nScritta dall’assistente. Sarà attiva solo in {where}; puoi modificarla o rimuoverla in Impostazioni → Skill.',
  'main.assistant.saveSkillDetailFits':
    'Usata quando serve: {description}\n\n{instructions}\n\nScritta dall’assistente. Sarà attiva solo in {where}; puoi modificarla o rimuoverla in Impostazioni → Skill.',
  'main.assistant.createEventTitle': 'Creare questo evento?',
  'main.assistant.createEventDetail': '{event}\n\nRichiesto dall’assistente. Controlla gli invitati e la descrizione prima di crearlo.',
  'main.assistant.emailGuests': 'Invia gli inviti via email agli invitati',

  // The assistant's scopes in per-space mode use common.allSpaces / common.noSpace.
  'main.scope.everything': 'Tutto',

  // Claude acting in an account.
  'main.claude.consentTitle': 'Consentire a Claude di agire in {name} per 30 minuti?',
  'main.claude.consentDetail': 'Claude potrà fare clic e digitare in questo account. Puoi fermarlo in qualsiasi momento con il pulsante Interrompi o con ⌘.',
  'main.claude.allow': 'Consenti',
  'main.claude.deny': 'Rifiuta',
  'main.claude.socketError': 'Impossibile aprire la connessione: {error}',

  // Adding a skill by link (Settings → Skills).
  'main.skills.fetchBadLink': 'Usa un link https a un file SKILL.md (funziona anche un link GitHub al file o alla sua cartella).',
  'main.skills.fetchNotFound': 'Nessun SKILL.md a quel link.',
  'main.skills.fetchStatus': 'Il link ha risposto {status}.',
  'main.skills.fetchNotHttps': 'Il link è stato spostato a un indirizzo che non è https.',
  'main.skills.fetchWebPage': 'Questa è una pagina web, non un file SKILL.md. Inserisci il link al file stesso.',
  'main.skills.fetchTooBig': 'Il file è troppo grande per una skill.',
  'main.skills.fetchNotText': 'Non è un file di testo.',
  'main.skills.fetchEmpty': 'Il file è vuoto.',
  'main.skills.fetchTooLong': 'La skill supera la lunghezza consentita da Mission Desk ({max} caratteri).',
  'main.skills.fetchFailed': 'Impossibile recuperare il link. Controlla l’indirizzo e la connessione.',
  'main.skills.fetchNotAllowed': 'Non consentito.',
  'main.openRouter.badKey': 'Non sembra una chiave OpenRouter.',

  // Updates.
  'main.updates.readyTitle': 'Mission Desk {version} è pronto',
  'main.updates.readyBody': 'Riavvia Mission Desk per completare, oppure verrà installato alla prossima uscita.',
  'main.updates.checkFailed': 'Impossibile raggiungere GitHub per la verifica. Controlla la connessione e riprova.',
  'main.updates.checkFailedOther': 'Impossibile verificare la presenza di una nuova versione ora. Riprova più tardi.',
  'main.updates.downloadFailed': 'Impossibile scaricare l’aggiornamento. Riprova tra poco.',
  'main.updates.installFailed': 'Impossibile installare l’aggiornamento. Scarica la nuova versione dal sito web.',

  // Other windows and pages.
  'main.popup.signIn': 'Accedi',
  'main.errorPage.title': 'Offline',
  'main.errorPage.message': 'Impossibile raggiungere questa pagina. Controlla la connessione.',
  'main.errorPage.retry': 'Riprova',
  'main.store.loadWarning': 'Non è stato possibile leggere gli account salvati, quindi Mission Desk si è avviato vuoto. Una copia è stata conservata come accounts.json.bak.',
  'main.calendar.noTitle': '(Senza titolo)',

  // About. {site}: the website without https://; {license}: the license's name (kept in English).
  'main.about.credits': '{site}\n{license}. Libero e open source.',
  'main.about.licenseSummary':
    'Libero e open source. Chiunque, persone e aziende, può usarlo per qualsiasi scopo, anche per lavoro, e modificarlo e condividerlo. Chi condivide Mission Desk o una sua versione modificata deve condividerne il codice sorgente con la stessa licenza, così non potrà mai diventare un prodotto chiuso.',
  "main.space.memory": "Memoria…",
};
