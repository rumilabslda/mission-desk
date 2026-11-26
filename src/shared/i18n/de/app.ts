import type { Translation } from '../types';
import type { app as en } from '../en/app';

export const app: Translation<typeof en> = {
  // Welcome screen (no accounts yet)
  'app.welcome.title': 'Willkommen bei Mission Desk',
  'app.welcome.body': 'Füge die Apps hinzu, die du nutzt, etwa Google, Slack oder WhatsApp. Jede bleibt für sich angemeldet.',
  'app.welcome.addFirst': 'Erstes Konto hinzufügen',
  'app.welcome.setup': 'Oder Bereiche und Apps Schritt für Schritt einrichten',

  // Sidebar
  'app.sidebar.home': 'Start',
  'app.sidebar.allCalendars': 'Alle Kalender',
  'app.sidebar.settings': 'Einstellungen',
  'app.sidebar.muted': 'Stummgeschaltet',
  'app.sidebar.spaceClickToClose': '{name} – zum Schließen klicken',
  'app.sidebar.quickActions': 'Schnellaktionen',
  'app.sidebar.quickActionsTitle': 'Schnellaktionen: Meet-Link, Termin, Aufgabe, Assistent',
  'app.sidebar.updateReadyTitle': 'Mission Desk {version} ist bereit: Zum Aktualisieren neu starten',
  'app.sidebar.updateReadyLabel': 'Einstellungen. Mission Desk {version} ist bereit zur Installation',
  'app.sidebar.add': 'App oder Bereich hinzufügen',
  'app.sidebar.unread': 'Ungelesene Nachrichten',

  // A closed space in the sidebar
  'app.spaceTile.title': '{name} ({count})',
  'app.spaceTile.titleSharesGoogle': '{name} ({count}) · teilt die Google-Anmeldung',

  // Service names that aren't brands
  'app.service.custom': 'Beliebige Website',

  // Add / Edit app dialog
  'app.account.addTitle': 'App hinzufügen',
  'app.account.editTitle': 'Konto bearbeiten',
  'app.account.service': 'Dienst',
  'app.account.address': 'Adresse',
  'app.account.addressPlaceholder': 'z. B. notion.so',
  'app.account.addressError': 'Verwende eine https://-Adresse.',
  'app.account.addressRequired': 'Gib die Adresse der Website ein.',
  'app.account.name': 'Name',
  'app.account.namePlaceholder': 'z. B. Acme',
  'app.account.colour': 'Farbe',
  'app.account.space': 'Bereich',
  'app.account.newSpace': 'Neuer Bereich …',
  'app.account.spaceName': 'Name des Bereichs',
  'app.account.spaceNameRequired': 'Gib dem neuen Space einen Namen.',
  'app.account.hint.google': 'Gmail, Kalender, Drive und Meet für ein Google- oder Workspace-Konto.',
  'app.account.hint.slack': 'Ein Slack-Workspace.',
  'app.account.hint.whatsapp': 'WhatsApp Web. Du scannst einen QR-Code mit deinem Telefon.',
  'app.account.hint.microsoft': 'Outlook, Kalender und Teams für ein Microsoft-Konto (Arbeit, Schule oder privat).',
  'app.account.hint.telegram': 'Telegram Web. Du scannst einen QR-Code mit deinem Telefon.',
  'app.account.hint.linkedin': 'LinkedIn-Nachrichten und -Feed für ein LinkedIn-Konto.',
  'app.account.hint.discord': 'Discord-Server und -Nachrichten für ein Discord-Konto.',
  'app.account.hint.zoom': 'Zoom Team Chat, Meetings und Kalender im Web, für ein Zoom-Konto.',
  'app.account.hint.proton': 'Proton Mail für ein Proton-Konto.',
  'app.account.hint.icloud': 'iCloud Mail für einen Apple Account.',
  'app.account.hint.fastmail': 'Fastmail-Mail, -Kalender und -Kontakte für ein Fastmail-Konto.',
  'app.account.hint.notion': 'Ein Notion-Konto mit all seinen Workspaces. Seiten, die es öffnet, werden zu Tabs.',
  'app.account.hint.custom': 'Eine beliebige Web-App (Jira, HubSpot, Linear …), für sich angemeldet. Seiten, die sie öffnet, werden zu Tabs.',

  // Space dialogs
  'app.space.name': 'Name',
  'app.space.namePlaceholder': 'z. B. Acme, Privat',
  'app.space.addTitle': 'Bereich hinzufügen',
  'app.space.appsInSpace': 'Apps in diesem Bereich',
  'app.space.serviceInSpace': '{service} · in {space}',
  'app.space.newTitle': 'Neuer Bereich',
  'app.space.renameTitle': 'Bereich umbenennen',
  'app.space.rename': 'Umbenennen',

  // Tab strip (Google, Microsoft 365, websites)
  'app.tab.calendar': 'Kalender',
  'app.tab.home': 'Start',
  'app.tab.close': '{title} schließen',
  'app.tab.offsite': 'Diese Seite liegt auf {host}, außerhalb von {app}',
  'app.tab.offsiteNoName': 'Diese Seite liegt auf {host}, außerhalb der App',
  'app.tab.openInBrowser': "Klicke, um sie im Browser zu öffnen.",
};
