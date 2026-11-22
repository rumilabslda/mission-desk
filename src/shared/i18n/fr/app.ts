import type { Translation } from '../types';
import type { app as en } from '../en/app';

export const app: Translation<typeof en> = {
  // Welcome screen (no accounts yet)
  'app.welcome.title': 'Bienvenue dans Mission Desk',
  'app.welcome.body': 'Ajoutez les apps que vous utilisez, comme Google, Slack ou WhatsApp. Chacune garde sa propre session ouverte.',
  'app.welcome.addFirst': 'Ajouter votre premier compte',
  'app.welcome.setup': 'Ou configurer les espaces et les apps pas à pas',

  // Sidebar
  'app.sidebar.home': 'Accueil',
  'app.sidebar.allCalendars': 'Tous les calendriers',
  'app.sidebar.settings': 'Réglages',
  'app.sidebar.muted': 'Silencieux',
  'app.sidebar.spaceClickToClose': '{name} — cliquez pour fermer',
  'app.sidebar.quickActions': 'Actions rapides',
  'app.sidebar.quickActionsTitle': 'Actions rapides : lien Meet, événement, tâche, assistant',
  'app.sidebar.updateReadyTitle': 'Mission Desk {version} est prêt : redémarrez pour mettre à jour',
  'app.sidebar.updateReadyLabel': 'Réglages. Mission Desk {version} est prêt à être installé',
  'app.sidebar.add': 'Ajouter une app ou un espace',
  'app.sidebar.unread': 'Messages non lus',

  // A closed space in the sidebar
  'app.spaceTile.title': '{name} ({count})',
  'app.spaceTile.titleSharesGoogle': '{name} ({count}) · partage la connexion Google',

  // Service names that aren't brands
  'app.service.custom': 'N’importe quel site web',

  // Add / Edit app dialog
  'app.account.addTitle': 'Ajouter une app',
  'app.account.editTitle': 'Modifier le compte',
  'app.account.service': 'Service',
  'app.account.address': 'Adresse',
  'app.account.addressPlaceholder': 'p. ex. notion.so',
  'app.account.addressError': 'Utilisez une adresse en https://.',
  'app.account.name': 'Nom',
  'app.account.namePlaceholder': 'p. ex. Acme',
  'app.account.colour': 'Couleur',
  'app.account.space': 'Espace',
  'app.account.newSpace': 'Nouvel espace…',
  'app.account.spaceName': 'Nom de l’espace',
  'app.account.hint.google': 'Gmail, Calendar, Drive et Meet pour un compte Google ou Workspace.',
  'app.account.hint.slack': 'Un espace de travail Slack.',
  'app.account.hint.whatsapp': 'WhatsApp Web. Vous scannerez un code QR avec votre téléphone.',
  'app.account.hint.microsoft': 'Outlook, Calendrier et Teams pour un compte Microsoft professionnel, scolaire ou personnel.',
  'app.account.hint.telegram': 'Telegram Web. Vous scannerez un code QR avec votre téléphone.',
  'app.account.hint.linkedin': 'Messages et fil d’actualité LinkedIn pour un compte LinkedIn.',
  'app.account.hint.discord': 'Serveurs et messages Discord pour un compte Discord.',
  'app.account.hint.zoom': 'Zoom Team Chat, réunions et calendrier sur le web, pour un compte Zoom.',
  'app.account.hint.proton': 'Proton Mail pour un compte Proton.',
  'app.account.hint.icloud': 'Mail iCloud pour un compte Apple.',
  'app.account.hint.fastmail': 'Mail, calendrier et contacts Fastmail pour un compte Fastmail.',
  'app.account.hint.notion': 'Un compte Notion, avec tous ses espaces de travail. Les pages qu’il ouvre deviennent des onglets.',
  'app.account.hint.custom': 'N’importe quelle app web (Jira, HubSpot, Linear…), avec sa propre connexion. Les pages qu’elle ouvre deviennent des onglets.',

  // Space dialogs
  'app.space.name': 'Nom',
  'app.space.namePlaceholder': 'p. ex. Acme, Perso',
  'app.space.addTitle': 'Ajouter un espace',
  'app.space.appsInSpace': 'Apps de cet espace',
  'app.space.serviceInSpace': '{service} · dans {space}',
  'app.space.newTitle': 'Nouvel espace',
  'app.space.renameTitle': 'Renommer l’espace',
  'app.space.rename': 'Renommer',

  // Tab strip (Google, Microsoft 365, websites)
  'app.tab.calendar': 'Calendrier',
  'app.tab.home': 'Accueil',
  'app.tab.close': 'Fermer {title}',
  'app.tab.offsite': 'Cette page est sur {host}, en dehors de {app}',
  'app.tab.offsiteNoName': 'Cette page est sur {host}, en dehors de l’app',
};
