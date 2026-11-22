import type { Translation } from '../types';
import type { app as en } from '../en/app';

export const app: Translation<typeof en> = {
  // Welcome screen (no accounts yet)
  'app.welcome.title': 'Te damos la bienvenida a Mission Desk',
  'app.welcome.body': 'Añade las apps que usas, como Google, Slack o WhatsApp. Cada una mantiene su propia sesión iniciada.',
  'app.welcome.addFirst': 'Añadir tu primera cuenta',
  'app.welcome.setup': 'O configurar espacios y apps paso a paso',

  // Sidebar
  'app.sidebar.home': 'Inicio',
  'app.sidebar.allCalendars': 'Todos los calendarios',
  'app.sidebar.settings': 'Ajustes',
  'app.sidebar.muted': 'Silenciado',
  'app.sidebar.spaceClickToClose': '{name}: haz clic para cerrar',
  'app.sidebar.quickActions': 'Acciones rápidas',
  'app.sidebar.quickActionsTitle': 'Acciones rápidas: enlace de Meet, evento, tarea, asistente',
  'app.sidebar.updateReadyTitle': 'Mission Desk {version} está listo: reinicia para actualizar',
  'app.sidebar.updateReadyLabel': 'Ajustes. Mission Desk {version} está listo para instalarse',
  'app.sidebar.add': 'Añadir una app o un espacio',
  'app.sidebar.unread': 'Mensajes sin leer',

  // A closed space in the sidebar
  'app.spaceTile.title': '{name} ({count})',
  'app.spaceTile.titleSharesGoogle': '{name} ({count}) · comparte el inicio de sesión de Google',

  // Service names that aren't brands
  'app.service.custom': 'Cualquier sitio web',

  // Add / Edit app dialog
  'app.account.addTitle': 'Añadir app',
  'app.account.editTitle': 'Editar cuenta',
  'app.account.service': 'Servicio',
  'app.account.address': 'Dirección',
  'app.account.addressPlaceholder': 'p. ej., notion.so',
  'app.account.addressError': 'Usa una dirección https://.',
  'app.account.name': 'Nombre',
  'app.account.namePlaceholder': 'p. ej., Acme',
  'app.account.colour': 'Color',
  'app.account.space': 'Espacio',
  'app.account.newSpace': 'Nuevo espacio…',
  'app.account.spaceName': 'Nombre del espacio',
  'app.account.hint.google': 'Gmail, Calendar, Drive y Meet para una cuenta de Google o Workspace.',
  'app.account.hint.slack': 'Un espacio de trabajo de Slack.',
  'app.account.hint.whatsapp': 'WhatsApp Web. Tendrás que escanear un código QR con el móvil.',
  'app.account.hint.microsoft': 'Outlook, Calendar y Teams para una cuenta de Microsoft del trabajo, de un centro educativo o personal.',
  'app.account.hint.telegram': 'Telegram Web. Tendrás que escanear un código QR con el móvil.',
  'app.account.hint.linkedin': 'Mensajes y feed de LinkedIn para una cuenta de LinkedIn.',
  'app.account.hint.discord': 'Servidores y mensajes de Discord para una cuenta de Discord.',
  'app.account.hint.zoom': 'Zoom Team Chat, reuniones y calendario en la web, para una cuenta de Zoom.',
  'app.account.hint.proton': 'Proton Mail para una cuenta de Proton.',
  'app.account.hint.icloud': 'Mail de iCloud para una cuenta de Apple.',
  'app.account.hint.fastmail': 'Correo, calendario y contactos de Fastmail para una cuenta de Fastmail.',
  'app.account.hint.notion': 'Una cuenta de Notion, con todos sus espacios de trabajo. Las páginas que abre se convierten en pestañas.',
  'app.account.hint.custom': 'Cualquier app web (Jira, HubSpot, Linear…), con su propia sesión. Las páginas que abre se convierten en pestañas.',

  // Space dialogs
  'app.space.name': 'Nombre',
  'app.space.namePlaceholder': 'p. ej., Acme, Personal',
  'app.space.addTitle': 'Añadir espacio',
  'app.space.appsInSpace': 'Apps de este espacio',
  'app.space.serviceInSpace': '{service} · en {space}',
  'app.space.newTitle': 'Nuevo espacio',
  'app.space.renameTitle': 'Renombrar espacio',
  'app.space.rename': 'Renombrar',

  // Tab strip (Google, Microsoft 365, websites)
  'app.tab.calendar': 'Calendario',
  'app.tab.home': 'Inicio',
  'app.tab.close': 'Cerrar {title}',
  'app.tab.offsite': 'Esta página está en {host}, fuera de {app}',
  'app.tab.offsiteNoName': 'Esta página está en {host}, fuera de la app',
};
