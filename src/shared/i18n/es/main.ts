import type { Translation } from '../types';
import type { main as en } from '../en/main';

export const main: Translation<typeof en> = {
  // The app menu (Mission Desk). {app} is the app's name.
  'main.menu.about': 'Acerca de {app}',
  'main.menu.services': 'Servicios',
  'main.menu.hide': 'Ocultar {app}',
  'main.menu.hideOthers': 'Ocultar otros',
  'main.menu.showAll': 'Mostrar todo',
  'main.menu.quit': 'Salir de {app}',
  'main.menu.checkForUpdates': 'Buscar actualizaciones…',
  'main.menu.settings': 'Ajustes…',
  'main.menu.assistant': 'Asistente',
  'main.menu.connectClaude': 'Conectar Claude…',
  // Edit
  'main.menu.edit': 'Edición',
  'main.menu.undo': 'Deshacer',
  'main.menu.redo': 'Rehacer',
  'main.menu.cut': 'Cortar',
  'main.menu.copy': 'Copiar',
  'main.menu.paste': 'Pegar',
  'main.menu.pasteAndMatchStyle': 'Pegar y adaptar estilo',
  'main.menu.selectAll': 'Seleccionar todo',
  'main.menu.speech': 'Voz',
  'main.menu.startSpeaking': 'Iniciar locución',
  'main.menu.stopSpeaking': 'Detener locución',
  // View
  'main.menu.view': 'Visualización',
  'main.menu.reload': 'Volver a cargar',
  'main.menu.forward': 'Avanzar',
  'main.menu.sidebarStyle': 'Estilo de la barra lateral',
  'main.menu.sidebarFolders': 'Carpetas',
  'main.menu.sidebarPanel': 'Carpetas con panel',
  'main.menu.sidebarSections': 'Secciones',
  'main.menu.devTools': 'Herramientas para desarrolladores de esta cuenta',
  'main.menu.toggleFullScreen': 'Activar/desactivar pantalla completa',
  // Accounts
  'main.menu.accounts': 'Cuentas',
  'main.menu.home': 'Inicio',
  'main.menu.allCalendars': 'Todos los calendarios',
  'main.menu.copyMeetLink': 'Copiar enlace de Meet',
  'main.menu.newEvent': 'Nuevo evento',
  'main.menu.newTodo': 'Nueva tarea',
  'main.menu.account': 'Cuenta {n}',
  'main.menu.stopClaude': 'Detener Claude',
  // Window
  'main.menu.window': 'Ventana',
  'main.menu.minimize': 'Minimizar',
  'main.menu.zoom': 'Zoom',
  'main.menu.front': 'Traer todo al frente',
  // Help
  'main.menu.help': 'Ayuda',
  'main.menu.siteMissionDesk': 'Sitio web de Mission Desk',
  'main.menu.siteRumiLabs': 'Sitio web de Rumi Labs',

  // An account's right-click menu.
  'main.account.edit': 'Editar…',
  'main.account.muteNotifications': 'Silenciar notificaciones',
  'main.account.hibernate': 'Hibernar cuando no se use',
  'main.account.icon': 'Icono',
  'main.account.claudeAccess': 'Acceso de Claude',
  'main.account.accessRead': 'Leer',
  'main.account.accessAct': 'Leer y actuar',
  'main.account.moveToSpace': 'Mover al espacio',
  'main.account.newSpace': 'Nuevo espacio…',
  'main.account.moveUp': 'Subir',
  'main.account.moveDown': 'Bajar',
  'main.account.remove': 'Quitar…',
  'main.account.removeTitle': '¿Quitar {name}?',
  'main.account.removeDetail': 'Se cerrará la sesión y se eliminarán sus datos de este Mac.',

  // An account's icon (right-click → Icon).
  'main.icon.sameAs': 'El mismo que {name}',
  'main.icon.auto': 'Logotipo de la empresa o foto',
  'main.icon.service': 'Logotipo del servicio',
  'main.icon.letter': 'Letra',
  'main.icon.chooseImage': 'Elegir imagen…',
  'main.icon.chooseTitle': 'Elige una imagen para {name}',
  'main.icon.imagesFilter': 'Imágenes',
  'main.icon.openFailed': 'No se ha podido abrir esa imagen.',
  'main.icon.openFailedDetail': 'Prueba con un archivo PNG o JPEG.',

  // A space's right-click menu, and the + menu.
  'main.space.rename': 'Renombrar…',
  'main.space.alwaysOpen': 'Siempre abierto',
  'main.space.shareGoogle': 'Compartir el inicio de sesión de Google',
  'main.space.googleFrom': 'Inicio de sesión de Google de',
  'main.space.ungroup': 'Desagrupar',
  'main.add.app': 'Añadir app…',
  'main.add.space': 'Añadir espacio…',

  // Quick actions (the ⚡ button's menu).
  'main.quick.title': 'Acciones rápidas',
  'main.quick.titleFor': 'Acciones rápidas · {name}',
  'main.quick.noGoogleInSpace': 'Añade una cuenta de Google a este espacio',
  'main.quick.needGoogle': 'Primero añade una cuenta de Google',
  'main.quick.askAssistant': 'Preguntar al asistente',

  // Copy Meet Link.
  'main.meet.noLink': 'No hay enlace de reunión',
  'main.meet.noGoogle': 'Este espacio no tiene ninguna cuenta de Google. Añade una para crear enlaces de Meet.',
  'main.meet.creating': 'Creando un enlace de reunión…',
  'main.meet.copied': 'Enlace de reunión copiado',
  /** {link}: the link without https://; {keys}: ⌘V or Ctrl+V. */
  'main.meet.copiedDetail': '{link} · {keys} para pegar',
  'main.meet.copiedBody': '{url}: pégalo con {keys}.',
  'main.meet.errorSignedOut': 'Inicia sesión en Google en este espacio e inténtalo de nuevo.',
  'main.meet.errorOffline': 'Mission Desk no tiene conexión. Comprueba tu conexión e inténtalo de nuevo.',
  'main.meet.errorForbidden': 'Google se ha negado a crear una reunión para esta cuenta.',
  'main.meet.errorUnsupported': 'Google no ha podido crear una reunión para esta cuenta.',
  'main.meet.errorGeneric': 'Google no ha podido crear una reunión. Inténtalo de nuevo en un momento.',
  /** The title of the event Copy Meet Link creates in the user's Google Calendar. */
  'main.meet.quickCallTitle': 'Llamada rápida',

  // The assistant asks before it keeps a note, saves a skill or creates an event. {where}: a space's name.
  'main.assistant.thisSpace': 'este espacio',
  'main.assistant.rememberTitle': '¿Recordar esto para {where}?',
  'main.assistant.forgetTitle': '¿Olvidar esta nota en {where}?',
  'main.assistant.rememberDetail':
    '{note}\n\nLo ha pedido el asistente. Solo la verá el asistente de {where}. Puedes ver y cambiar todas las notas en Ajustes → Asistente.',
  'main.assistant.forgetDetail': '{note}\n\nLo ha pedido el asistente. Puedes ver y cambiar todas las notas en Ajustes → Asistente.',
  'main.assistant.remember': 'Recordar',
  'main.assistant.forget': 'Olvidar',
  'main.assistant.saveSkillTitle': '¿Guardar la skill “{name}” para {where}?',
  'main.assistant.saveSkillDetailAlways':
    'Siempre activada: {description}\n\n{instructions}\n\nEscrita por el asistente. Solo estará activada en {where}; puedes cambiarla o quitarla en Ajustes → Skills.',
  'main.assistant.saveSkillDetailFits':
    'Se usa cuando encaja: {description}\n\n{instructions}\n\nEscrita por el asistente. Solo estará activada en {where}; puedes cambiarla o quitarla en Ajustes → Skills.',
  'main.assistant.createEventTitle': '¿Crear este evento?',
  'main.assistant.createEventDetail': '{event}\n\nLo ha pedido el asistente. Comprueba los invitados y la descripción antes de crearlo.',
  'main.assistant.emailGuests': 'Enviar invitaciones por correo a los invitados',

  // The assistant's scopes in per-space mode use common.allSpaces / common.noSpace.
  'main.scope.everything': 'Todo',

  // Claude acting in an account.
  'main.claude.consentTitle': '¿Permitir que Claude actúe en {name} durante 30 minutos?',
  'main.claude.consentDetail': 'Claude podrá hacer clic y escribir en esta cuenta. Puedes detenerlo en cualquier momento con el botón Detener o con ⌘.',
  'main.claude.allow': 'Permitir',
  'main.claude.deny': 'Denegar',
  'main.claude.socketError': 'No se ha podido abrir la conexión: {error}',

  // Adding a skill by link (Settings → Skills).
  'main.skills.fetchBadLink': 'Usa un enlace https a un archivo SKILL.md (también sirve un enlace de GitHub al archivo o a su carpeta).',
  'main.skills.fetchNotFound': 'No hay ningún SKILL.md en ese enlace.',
  'main.skills.fetchStatus': 'El enlace ha respondido {status}.',
  'main.skills.fetchNotHttps': 'El enlace redirige a una dirección que no es https.',
  'main.skills.fetchWebPage': 'Eso es una página web, no un archivo SKILL.md. Enlaza directamente al archivo.',
  'main.skills.fetchTooBig': 'Ese archivo es demasiado grande para una skill.',
  'main.skills.fetchNotText': 'Ese no es un archivo de texto.',
  'main.skills.fetchEmpty': 'Ese archivo está vacío.',
  'main.skills.fetchTooLong': 'Esa skill supera el máximo que permite Mission Desk ({max} caracteres).',
  'main.skills.fetchFailed': 'No se ha podido obtener ese enlace. Comprueba la dirección y tu conexión.',
  'main.skills.fetchNotAllowed': 'No permitido.',
  'main.openRouter.badKey': 'Eso no parece una clave de OpenRouter.',

  // Updates.
  'main.updates.readyTitle': 'Mission Desk {version} está listo',
  'main.updates.readyBody': 'Reinicia Mission Desk para terminar, o se instalará la próxima vez que salgas.',
  'main.updates.checkFailed': 'No se ha podido conectar con GitHub para comprobarlo. Comprueba tu conexión e inténtalo de nuevo.',
  'main.updates.checkFailedOther': 'Ahora mismo no se puede buscar una versión nueva. Inténtalo más tarde.',
  'main.updates.downloadFailed': 'No se ha podido descargar la actualización. Inténtalo de nuevo en un momento.',
  'main.updates.installFailed': 'No se ha podido instalar la actualización. Descarga la versión nueva desde el sitio web.',

  // Other windows and pages.
  'main.popup.signIn': 'Iniciar sesión',
  'main.errorPage.title': 'Sin conexión',
  'main.errorPage.message': 'No se puede acceder a esta página. Comprueba tu conexión.',
  'main.errorPage.retry': 'Reintentar',
  'main.store.loadWarning': 'No se han podido leer tus cuentas guardadas, así que Mission Desk se ha abierto vacío. Se ha guardado una copia como accounts.json.bak.',
  'main.calendar.noTitle': '(Sin título)',

  // About. {site}: the website without https://; {license}: the license's name (kept in English).
  'main.about.credits': '{site}\n{license}. Gratuito y de código abierto.',
  'main.about.licenseSummary':
    'Gratuito y de código abierto. Cualquiera, tanto personas como empresas, puede usarlo para lo que quiera, incluido el trabajo, y modificarlo y compartirlo. Quien comparta Mission Desk o una versión modificada debe compartir su código fuente con la misma licencia, de modo que nunca pueda convertirse en un producto cerrado.',
};
