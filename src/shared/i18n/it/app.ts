import type { Translation } from '../types';
import type { app as en } from '../en/app';

export const app: Translation<typeof en> = {
  // Welcome screen (no accounts yet)
  'app.welcome.title': 'Benvenuto in Mission Desk',
  'app.welcome.body': 'Aggiungi le app che usi, come Google, Slack o WhatsApp. Ognuna resta connessa per conto suo.',
  'app.welcome.addFirst': 'Aggiungi il tuo primo account',
  'app.welcome.setup': 'Oppure configura spazi e app passo per passo',

  // Sidebar
  'app.sidebar.home': 'Home',
  'app.sidebar.allCalendars': 'Tutti i calendari',
  'app.sidebar.settings': 'Impostazioni',
  'app.sidebar.muted': 'Silenziato',
  'app.sidebar.spaceClickToClose': '{name}: fai clic per chiudere',
  'app.sidebar.quickActions': 'Azioni rapide',
  'app.sidebar.quickActionsTitle': 'Azioni rapide: link Meet, evento, attività, assistente',
  'app.sidebar.updateReadyTitle': 'Mission Desk {version} è pronto: riavvia per aggiornare',
  'app.sidebar.updateReadyLabel': 'Impostazioni. Mission Desk {version} è pronto da installare',
  'app.sidebar.add': 'Aggiungi un’app o uno spazio',
  'app.sidebar.unread': 'Messaggi non letti',

  // A closed space in the sidebar
  'app.spaceTile.title': '{name} ({count})',
  'app.spaceTile.titleSharesGoogle': '{name} ({count}) · condivide l’accesso a Google',

  // Service names that aren't brands
  'app.service.custom': 'Qualsiasi sito web',

  // Add / Edit app dialog
  'app.account.addTitle': 'Aggiungi app',
  'app.account.editTitle': 'Modifica account',
  'app.account.service': 'Servizio',
  'app.account.address': 'Indirizzo',
  'app.account.addressPlaceholder': 'es. notion.so',
  'app.account.addressError': 'Usa un indirizzo https://.',
  'app.account.name': 'Nome',
  'app.account.namePlaceholder': 'es. Acme',
  'app.account.colour': 'Colore',
  'app.account.space': 'Spazio',
  'app.account.newSpace': 'Nuovo spazio…',
  'app.account.spaceName': 'Nome dello spazio',
  'app.account.hint.google': 'Gmail, Calendar, Drive e Meet per un account Google o Workspace.',
  'app.account.hint.slack': 'Un workspace Slack.',
  'app.account.hint.whatsapp': 'WhatsApp Web. Dovrai scansionare un codice QR con il telefono.',
  'app.account.hint.microsoft': 'Outlook, Calendario e Teams per un account Microsoft di lavoro, scuola o personale.',
  'app.account.hint.telegram': 'Telegram Web. Dovrai scansionare un codice QR con il telefono.',
  'app.account.hint.linkedin': 'Messaggi e feed di LinkedIn per un account LinkedIn.',
  'app.account.hint.discord': 'Server e messaggi di Discord per un account Discord.',
  'app.account.hint.zoom': 'Zoom Team Chat, riunioni e calendario sul web, per un account Zoom.',
  'app.account.hint.proton': 'Proton Mail per un account Proton.',
  'app.account.hint.icloud': 'Mail di iCloud per un Account Apple.',
  'app.account.hint.fastmail': 'Posta, calendario e contatti di Fastmail per un account Fastmail.',
  'app.account.hint.notion': 'Un account Notion, con tutti i suoi workspace. Le pagine che apre diventano pannelli.',
  'app.account.hint.custom': 'Qualsiasi app web (Jira, HubSpot, Linear…), con un accesso tutto suo. Le pagine che apre diventano pannelli.',

  // Space dialogs
  'app.space.name': 'Nome',
  'app.space.namePlaceholder': 'es. Acme, Personale',
  'app.space.addTitle': 'Aggiungi spazio',
  'app.space.appsInSpace': 'App in questo spazio',
  'app.space.serviceInSpace': '{service} · in {space}',
  'app.space.newTitle': 'Nuovo spazio',
  'app.space.renameTitle': 'Rinomina spazio',
  'app.space.rename': 'Rinomina',

  // Tab strip (Google, Microsoft 365, websites)
  'app.tab.calendar': 'Calendario',
  'app.tab.home': 'Home',
  'app.tab.close': 'Chiudi {title}',
  'app.tab.offsite': 'Questa pagina è su {host}, al di fuori di {app}',
  'app.tab.offsiteNoName': 'Questa pagina è su {host}, al di fuori dell’app',
};
