import type { Translation } from '../types';
import type { setup as en } from '../en/setup';

export const setup: Translation<typeof en> = {
  // Names the setup gives (src/shared/setup.ts)
  'setup.app.website': 'Sitio web',
  'setup.spaces.tooLong': 'Usa menos de {max} caracteres.',
  'setup.spaces.taken': '{name} ya existe.',

  // What each service brings (the tiles)
  'setup.service.googleWhat': 'Gmail, Calendar, Drive',
  'setup.service.slackWhat': 'Un espacio de trabajo',
  'setup.service.whatsappWhat': 'Tus chats',
  'setup.service.telegramWhat': 'Tus chats',
  'setup.service.linkedinWhat': 'Mensajes, feed',
  'setup.service.discordWhat': 'Servidores, MD',
  'setup.service.zoomWhat': 'Team Chat, reuniones',
  'setup.service.notionWhat': 'Páginas, wikis',
  'setup.service.protonWhat': 'Correo privado',
  'setup.service.icloudWhat': 'Correo de Apple',
  'setup.service.fastmailWhat': 'Correo, calendario',

  // Example and suggested space names
  'setup.spaceName.personal': 'Personal',
  'setup.spaceName.work': 'Trabajo',
  'setup.spaceName.sideProject': 'Proyecto personal',

  // Progress and navigation
  'setup.stage.welcome': 'Bienvenida',
  'setup.stage.assistant': 'Asistente',
  'setup.stage.spaces': 'Espacios',
  'setup.stage.apps': 'Apps',
  'setup.stage.ready': 'Listo',
  'setup.progressLabel': 'Paso {step} de {total}: {stage}',
  'setup.skip': 'Omitir configuración',
  'setup.skipTitle': 'Puedes volver a configurar desde Ajustes → General',
  'setup.nav.aboutAMinute': 'Se tarda alrededor de un minuto.',
  'setup.nav.needSpace': 'Añade un espacio o mantenlo todo junto.',
  'setup.nav.getStarted': 'Empezar',
  'setup.nav.settingUp': 'Configurando…',
  'setup.nav.startSigningIn': 'Empezar a iniciar sesión',
  'setup.nav.openMissionDesk': 'Abrir Mission Desk',
  'setup.nav.continue': 'Continuar',
  'setup.finishError': 'Mission Desk no ha podido añadirlas. Vuelve atrás, comprueba los nombres de los espacios y las direcciones web, e inténtalo de nuevo.',
  'setup.remove': 'Quitar {name}',

  // Welcome
  'setup.welcome.nameLabel': 'Su nombre (opcional)',
  'setup.welcome.namePlaceholder': 'Cómo quiere que le llamen',
  'setup.stage.meetings': 'Reuniones',
  'setup.meetings.title': '¿Transcribir sus reuniones?',
  'setup.meetings.lede': 'Las llamadas de Meet, Teams y Zoom a las que se une en Mission Desk, transcritas en este Mac: el audio nunca sale de él y solo se guarda el texto, en el espacio de la reunión.',
  'setup.meetings.groupLabel': 'Transcripción',
  'setup.meetings.askName': 'Preguntar en cada reunión',
  'setup.meetings.askHint': 'Una barra sobre la llamada pregunta antes de empezar. Recomendado.',
  'setup.meetings.alwaysName': 'Siempre, sin preguntar',
  'setup.meetings.alwaysHint': 'Empieza en cuanto se une a una llamada. Recuerde avisar a los demás.',
  'setup.meetings.offName': 'No, gracias',
  'setup.meetings.offHint': 'No se transcribe nada. Puede activarlo después en Ajustes → Reuniones.',
  'setup.meetings.perSpaceTitle': 'Elegir para cada espacio',
  'setup.meetings.perSpaceText': 'Por ejemplo Siempre para un cliente y Preguntar para el resto.',
  'setup.meetings.spaceLabel': 'Transcripción en {name}',
  'setup.meetings.sameAsAbove': 'Igual que arriba ({name})',
  'setup.meetings.engineTitle': 'Motor de transcripción',
  'setup.meetings.appleHint': 'Incluido en macOS 26: nada que descargar.',
  'setup.meetings.appleUnavailable': 'Requiere macOS 26.',
  'setup.meetings.parakeetHint': 'Muy rápido. 0,5 GB, se descarga tras la configuración.',
  'setup.meetings.whisperHint': 'El más preciso. 1,6 GB, se descarga tras la configuración.',
  'setup.meetings.insightsTitle': 'Ideas durante las reuniones',
  'setup.meetings.insightsText': 'Cuando algo dicho enlaza con lo que un espacio sabe, su asistente muestra una nota breve con la fuente.',
  'setup.ready.meetings': 'Transcripción: {mode}',
  'setup.welcome.title': 'Te damos la bienvenida a Mission Desk',
  'setup.welcome.titleAgain': 'Configura más cosas en Mission Desk',
  'setup.welcome.lede':
    'Todas tus apps juntas, organizadas en espacios, con un Inicio para tu día y un asistente que conoce cada espacio.',
  'setup.welcome.ledeAgain': 'Añade espacios y apps igual que la primera vez. Lo que ya tienes se queda como está.',
  'setup.welcome.accountsTitle': 'Cada cuenta con su propia sesión',
  'setup.welcome.accountsText': 'Dos cuentas de Google, tres espacios de trabajo de Slack: cada uno mantiene su propio inicio de sesión.',
  'setup.welcome.homeTitle': 'Inicio te muestra lo siguiente',
  'setup.welcome.homeText': 'Tus reuniones, tareas y mensajes sin leer, y un clic para unirte a una llamada.',
  'setup.welcome.assistantTitle': 'Un asistente que no sale de su espacio',
  'setup.welcome.assistantText': 'Solo lee las apps que compartes con él, y solo en ese espacio.',
  'setup.welcome.meetingsTitle': 'Reuniones transcritas en su Mac',
  'setup.welcome.meetingsText': 'En Meet, Teams y Zoom, con el resumen y sus tareas al terminar. El audio nunca sale de su Mac.',

  // Assistant
  'setup.assistant.title': '¿Quieres un asistente?',
  'setup.assistant.lede':
    'Te resume el día, encuentra quién espera tu respuesta y prepara tus reuniones, a partir de las apps que compartes con él.',
  'setup.assistant.groupLabel': 'Asistente',
  'setup.assistant.claudeHint': 'Usa tu plan de Claude, a través de Claude Code en este Mac.',
  'setup.assistant.codexHint': 'Usa tu plan de ChatGPT, a través de Codex en este Mac.',
  'setup.assistant.openrouterHint': 'GPT, Gemini, Llama y más, con tu propia clave de OpenRouter.',
  'setup.assistant.offName': 'Ahora no',
  'setup.assistant.offHint': 'Puedes añadir uno más adelante en Ajustes.',
  'setup.assistant.addAnother': '+ Añadir otra cuenta',
  'setup.assistant.perSpaceTitle': 'Elegir un asistente para cada espacio',
  'setup.assistant.perSpaceText': 'Por ejemplo, otra cuenta de Claude para el trabajo. Un espacio que deje como está usa el de arriba.',
  'setup.assistant.spaceLabel': 'Asistente de {name}',
  'setup.assistant.sameAsAbove': 'Igual que arriba ({name})',
  'setup.assistant.meetings': 'Sus apps tienen llamadas: cuando termina una reunión, el asistente del espacio puede escribir el resumen y sus tareas.',
  'setup.assistant.readsTitle': 'Permitir que el asistente lea estas apps',
  'setup.assistant.signInAgain': '{name} no tiene la sesión iniciada.',

  // Connecting the assistant
  'setup.engine.checking': 'Comprobando {name}…',
  'setup.engine.readyOpenRouter': 'OpenRouter está conectado. {name} está listo.',
  'setup.engine.readySignedIn': '{app} tiene la sesión iniciada en este Mac. {name} está listo.',
  'setup.engine.keyLabel': 'Tu clave de OpenRouter',
  'setup.engine.checkingKey': 'Comprobando…',
  'setup.engine.connect': 'Conectar',
  'setup.engine.keyRefused': 'OpenRouter ha rechazado esta clave. Compruébala e inténtalo de nuevo.',
  'setup.engine.keyHelp':
    'Crea una en <link>openrouter.ai/keys</link>. macOS la guarda cifrada en este Mac; OpenRouter factura lo que uses.',
  'setup.engine.finishInBrowser': 'Termina de iniciar sesión en el navegador…',
  'setup.engine.installed': '{app} está instalado. Inicia sesión una vez con tu cuenta de {account}.',
  'setup.engine.signIn': 'Iniciar sesión',
  'setup.engine.installClaude': 'Claude necesita Claude Code en este Mac. Abre Terminal, pega esto y pulsa Retorno:',
  'setup.engine.installCodex':
    'OpenAI Codex necesita la herramienta de línea de comandos de Codex en este Mac. Abre Terminal, pega esto y pulsa Retorno:',
  'setup.engine.copy': 'Copiar',
  'setup.engine.copied': 'Copiado',
  'setup.engine.npmMissing': 'Si Terminal dice que no encuentra npm, instala primero Node.js desde nodejs.org.',
  'setup.engine.installedIt': 'Ya lo he instalado',
  'setup.engine.later': 'También puedes terminar esto más adelante, en Ajustes → Integraciones.',

  // Spaces
  'setup.spaces.title': '¿Cómo quieres organizar tu trabajo?',
  'setup.spaces.lede': 'Un espacio para cada empresa, proyecto o parte de tu vida, como Personal, Acme o Proyecto personal.',
  'setup.spaces.listLabel': 'Tus espacios',
  'setup.spaces.placeholderFirst': 'Ponle nombre a un espacio, como Acme',
  'setup.spaces.placeholderMore': 'Otro espacio',
  'setup.spaces.nameLabel': 'Nombre del espacio',
  'setup.spaces.full': {
    one: 'Ya tienes {count} espacio, el máximo que crea la configuración. Puedes añadir más después.',
    other: 'Ya tienes {count} espacios, el máximo que crea la configuración. Puedes añadir más después.',
  },
  'setup.spaces.ideas': 'Ideas:',
  'setup.spaces.togetherTitle': 'Mantenerlo todo junto',
  'setup.spaces.togetherText': 'Todas tus apps en una lista, sin espacios. Puedes crear espacios después.',

  // Apps
  'setup.apps.title': '¿Qué apps usas?',
  'setup.apps.titleSpace': '¿Qué apps van en {name}?',
  'setup.apps.lede': 'Elige todas las que quieras. Iniciarás sesión en cada una al final.',
  'setup.apps.ledeSpace': 'Elige todas las que quieras. {name} es el espacio {n} de {total}. Iniciarás sesión en cada una al final.',
  'setup.apps.accounts': { one: '{count} cuenta', other: '{count} cuentas' },
  'setup.apps.oneFewer': 'Una cuenta de {name} menos',
  'setup.apps.another': 'Otra cuenta de {name}',
  'setup.apps.anyWebsite': 'Cualquier sitio web',
  'setup.apps.sitesAdded': { one: '{count} añadido', other: '{count} añadidos' },
  'setup.apps.badAddress': 'Eso no parece una dirección web. Prueba con algo como notion.so.',
  'setup.apps.alreadyListed': 'Ya está en la lista.',
  'setup.apps.addressPlaceholder': 'Dirección web, como notion.so',
  'setup.apps.addressLabel': 'Dirección web',
  'setup.apps.full': {
    one: 'Ya tienes {count} app, el máximo para un espacio aquí. Puedes añadir más después.',
    other: 'Ya tienes {count} apps, el máximo para un espacio aquí. Puedes añadir más después.',
  },
  'setup.apps.needsOne': 'Un espacio necesita al menos una app. Sin ninguna, {name} se queda fuera; puedes crearlo después.',

  // Ready
  'setup.ready.nothingTitle': 'Todavía no hay nada que añadir',
  'setup.ready.nothingText':
    'No has elegido ninguna app. Vuelve atrás para elegir algunas, o abre Mission Desk y añádelas una a una con el + de la barra lateral.',
  'setup.ready.title': 'Todo listo para iniciar sesión',
  'setup.ready.lede': {
    one: 'Mission Desk añade tu app y abre {first} primero. Inicia sesión en cada una una vez; la sesión se mantiene en este Mac.',
    other:
      'Mission Desk añade tus {count} apps y abre {first} primero. Inicia sesión en cada una una vez; la sesión se mantiene en este Mac.',
  },
  'setup.ready.ledeSpaces':
    'Mission Desk añade tus {count} apps en {spaces} espacios y abre {first} primero. Inicia sesión en cada una una vez; la sesión se mantiene en este Mac.',
  'setup.ready.alreadyThere': 'Ya existe: se añadirán a él',
  'setup.ready.noAssistant': 'Sin asistente',
  'setup.ready.keepsAssistant': 'Mantiene su asistente',
  'setup.ready.readsText':
    'Así puede resumirte el día y encontrar quién espera tu respuesta. No puede escribir, hacer clic ni enviar nada en ellas. Puedes cambiarlo para cada app en Ajustes.',

  // The sidebar preview
  'setup.dock.home': 'Inicio',
  'setup.dock.appsHere': 'Tus apps aparecerán aquí.',
  'setup.dock.spacesHere': 'Tus espacios aparecerán aquí.',
  'setup.dock.example': 'Un ejemplo. El tuyo irá tomando forma a medida que respondas.',
  'setup.dock.yours': 'Tu Mission Desk',
};
