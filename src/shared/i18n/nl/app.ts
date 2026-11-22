import type { Translation } from '../types';
import type { app as en } from '../en/app';

export const app: Translation<typeof en> = {
  // Welcome screen (no accounts yet)
  'app.welcome.title': 'Welkom bij Mission Desk',
  'app.welcome.body': 'Voeg de apps toe die je gebruikt, zoals Google, Slack of WhatsApp. Elke app blijft apart ingelogd.',
  'app.welcome.addFirst': 'Voeg je eerste account toe',
  'app.welcome.setup': 'Of stel stap voor stap ruimtes en apps in',

  // Sidebar
  'app.sidebar.home': 'Start',
  'app.sidebar.allCalendars': 'Alle agenda’s',
  'app.sidebar.settings': 'Instellingen',
  'app.sidebar.muted': 'Gedempt',
  'app.sidebar.spaceClickToClose': '{name} — klik om te sluiten',
  'app.sidebar.quickActions': 'Snelle acties',
  'app.sidebar.quickActionsTitle': 'Snelle acties: Meet-link, activiteit, taak, assistent',
  'app.sidebar.updateReadyTitle': 'Mission Desk {version} staat klaar: herstart om bij te werken',
  'app.sidebar.updateReadyLabel': 'Instellingen. Mission Desk {version} staat klaar om te installeren',
  'app.sidebar.add': 'Voeg een app of ruimte toe',
  'app.sidebar.unread': 'Ongelezen berichten',

  // A closed space in the sidebar
  'app.spaceTile.title': '{name} ({count})',
  'app.spaceTile.titleSharesGoogle': '{name} ({count}) · deelt Google-login',

  // Service names that aren't brands
  'app.service.custom': 'Elke website',

  // Add / Edit app dialog
  'app.account.addTitle': 'Voeg app toe',
  'app.account.editTitle': 'Wijzig account',
  'app.account.service': 'Dienst',
  'app.account.address': 'Adres',
  'app.account.addressPlaceholder': 'bv. notion.so',
  'app.account.addressError': 'Gebruik een https://-adres.',
  'app.account.name': 'Naam',
  'app.account.namePlaceholder': 'bv. Acme',
  'app.account.colour': 'Kleur',
  'app.account.space': 'Ruimte',
  'app.account.newSpace': 'Nieuwe ruimte…',
  'app.account.spaceName': 'Naam van ruimte',
  'app.account.hint.google': 'Gmail, Agenda, Drive en Meet voor één Google- of Workspace-account.',
  'app.account.hint.slack': 'Eén Slack-werkruimte.',
  'app.account.hint.whatsapp': 'WhatsApp Web. Je scant een QR-code met je telefoon.',
  'app.account.hint.microsoft': 'Outlook, Agenda en Teams voor één werk-, school- of persoonlijk Microsoft-account.',
  'app.account.hint.telegram': 'Telegram Web. Je scant een QR-code met je telefoon.',
  'app.account.hint.linkedin': 'LinkedIn-berichten en -feed voor één LinkedIn-account.',
  'app.account.hint.discord': 'Discord-servers en -berichten voor één Discord-account.',
  'app.account.hint.zoom': 'Zoom Team Chat, vergaderingen en agenda op het web, voor één Zoom-account.',
  'app.account.hint.proton': 'Proton Mail voor één Proton-account.',
  'app.account.hint.icloud': 'iCloud Mail voor één Apple Account.',
  'app.account.hint.fastmail': 'Fastmail-mail, -agenda en -contacten voor één Fastmail-account.',
  'app.account.hint.notion': 'Eén Notion-account, met al zijn werkruimtes. Pagina’s die het opent, worden tabbladen.',
  'app.account.hint.custom': 'Elke webapp (Jira, HubSpot, Linear…), apart ingelogd. Pagina’s die hij opent, worden tabbladen.',

  // Space dialogs
  'app.space.name': 'Naam',
  'app.space.namePlaceholder': 'bv. Acme, Persoonlijk',
  'app.space.addTitle': 'Voeg ruimte toe',
  'app.space.appsInSpace': 'Apps in deze ruimte',
  'app.space.serviceInSpace': '{service} · in {space}',
  'app.space.newTitle': 'Nieuwe ruimte',
  'app.space.renameTitle': 'Wijzig naam van ruimte',
  'app.space.rename': 'Wijzig naam',

  // Tab strip (Google, Microsoft 365, websites)
  'app.tab.calendar': 'Agenda',
  'app.tab.home': 'Start',
  'app.tab.close': 'Sluit {title}',
  'app.tab.offsite': 'Deze pagina staat op {host}, buiten {app}',
  'app.tab.offsiteNoName': 'Deze pagina staat op {host}, buiten de app',
};
