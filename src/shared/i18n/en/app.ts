import type { Msg } from '../types';

/** The window shell: welcome screen, sidebar, the Add/Edit app dialog, space dialogs and the tab strip. */
export const app = {
  // Welcome screen (no accounts yet)
  'app.welcome.title': 'Welcome to Mission Desk',
  'app.welcome.body': 'Add the apps you use, like Google, Slack or WhatsApp. Each one stays signed in on its own.',
  'app.welcome.addFirst': 'Add your first account',
  'app.welcome.setup': 'Or set up spaces and apps step by step',

  // Sidebar
  'app.sidebar.home': 'Home',
  'app.sidebar.allCalendars': 'All calendars',
  'app.sidebar.settings': 'Settings',
  'app.sidebar.muted': 'Muted',
  'app.sidebar.spaceClickToClose': '{name} — click to close',
  'app.sidebar.quickActions': 'Quick actions',
  'app.sidebar.quickActionsTitle': 'Quick actions: Meet link, event, to-do, assistant',
  'app.sidebar.updateReadyTitle': 'Mission Desk {version} is ready: restart to update',
  'app.sidebar.updateReadyLabel': 'Settings. Mission Desk {version} is ready to install',
  'app.sidebar.add': 'Add an app or a space',
  'app.sidebar.unread': 'Unread messages',

  // A closed space in the sidebar
  'app.spaceTile.title': '{name} ({count})',
  'app.spaceTile.titleSharesGoogle': '{name} ({count}) · shares Google sign-in',

  // Service names that aren't brands
  'app.service.custom': 'Any website',

  // Add / Edit app dialog
  'app.account.addTitle': 'Add app',
  'app.account.editTitle': 'Edit account',
  'app.account.service': 'Service',
  'app.account.address': 'Address',
  'app.account.addressPlaceholder': 'e.g. notion.so',
  'app.account.addressError': 'Use an https:// address.',
  'app.account.addressRequired': 'Enter the site\'s address.',
  'app.account.name': 'Name',
  'app.account.namePlaceholder': 'e.g. Acme',
  'app.account.colour': 'Colour',
  'app.account.space': 'Space',
  'app.account.newSpace': 'New space…',
  'app.account.spaceName': 'Space name',
  'app.account.spaceNameRequired': 'Give the new space a name.',
  'app.account.hint.google': 'Gmail, Calendar, Drive and Meet for one Google or Workspace account.',
  'app.account.hint.slack': 'One Slack workspace.',
  'app.account.hint.whatsapp': 'WhatsApp Web. You will scan a QR code with your phone.',
  'app.account.hint.microsoft': 'Outlook, Calendar and Teams for one work, school or personal Microsoft account.',
  'app.account.hint.telegram': 'Telegram Web. You will scan a QR code with your phone.',
  'app.account.hint.linkedin': 'LinkedIn messages and feed for one LinkedIn account.',
  'app.account.hint.discord': 'Discord servers and messages for one Discord account.',
  'app.account.hint.zoom': 'Zoom Team Chat, meetings and calendar on the web, for one Zoom account.',
  'app.account.hint.proton': 'Proton Mail for one Proton account.',
  'app.account.hint.icloud': 'iCloud Mail for one Apple Account.',
  'app.account.hint.fastmail': 'Fastmail mail, calendar and contacts for one Fastmail account.',
  'app.account.hint.notion': 'One Notion account, with all its workspaces. Pages it opens become tabs.',
  'app.account.hint.custom': 'Any web app (Jira, HubSpot, Linear…), signed in on its own. Pages it opens become tabs.',

  // Space dialogs
  'app.space.name': 'Name',
  'app.space.namePlaceholder': 'e.g. Acme, Personal',
  'app.space.addTitle': 'Add space',
  'app.space.appsInSpace': 'Apps in this space',
  'app.space.serviceInSpace': '{service} · in {space}',
  'app.space.newTitle': 'New space',
  'app.space.renameTitle': 'Rename space',
  'app.space.rename': 'Rename',

  // Tab strip (Google, Microsoft 365, websites)
  'app.tab.calendar': 'Calendar',
  'app.tab.home': 'Home',
  'app.tab.close': 'Close {title}',
  'app.tab.offsite': 'This page is on {host}, outside {app}',
  'app.tab.offsiteNoName': 'This page is on {host}, outside the app',
  'app.tab.openInBrowser': "Click to open it in your browser.",
} satisfies Record<string, Msg>;
