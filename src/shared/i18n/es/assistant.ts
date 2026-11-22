import type { Translation } from '../types';
import type { assistant as en } from '../en/assistant';

export const assistant: Translation<typeof en> = {
  'assistant.title': 'Asistente',
  'assistant.closeShortcut': 'Cerrar (⌘J)',
  'assistant.copy': 'Copiar',
  'assistant.copied': 'Copiado',
  'assistant.stop': 'Detener',

  // Models and effort (the menus under the chat and in Settings)
  'assistant.model.default': 'Predeterminado (Claude Code)',
  'assistant.effort.low': 'bajo',
  'assistant.effort.medium': 'medio',
  'assistant.effort.high': 'alto',
  'assistant.effort.xhigh': 'muy alto',
  'assistant.effort.max': 'máximo',

  // The "/" menu
  'assistant.command.brief': 'Tu día en todas las cuentas',
  'assistant.command.waiting': 'Quién espera tu respuesta',
  'assistant.command.prep': 'Prepara tu próxima reunión',
  'assistant.command.schedule': 'Busca un hueco y resérvalo',
  'assistant.command.reply': 'Redacta una respuesta a la conversación abierta',
  'assistant.command.summarize': 'Resume lo que hay en pantalla',
  'assistant.command.catchup': 'Qué ha pasado en una cuenta',

  // Tool steps in an answer
  'assistant.tool.currentContext': 'Mirando tu pantalla',
  'assistant.tool.listAccounts': 'Listando cuentas',
  'assistant.tool.readPage': 'Leyendo {account}',
  'assistant.tool.readPageTab': 'Leyendo {account} · {tab}',
  'assistant.tool.readPageAny': 'Leyendo una página',
  'assistant.tool.readPageAnyTab': 'Leyendo una página · {tab}',
  'assistant.tool.getElements': 'Mirando {account}',
  'assistant.tool.getElementsAny': 'Mirando la página',
  'assistant.tool.screenshot': 'Captura de {account}',
  'assistant.tool.screenshotAny': 'Captura de la página',
  'assistant.tool.openUrl': 'Abriendo una página en {account}',
  'assistant.tool.openUrlAny': 'Abriendo una página en una cuenta',
  'assistant.tool.click': 'Haciendo clic en {account}',
  'assistant.tool.clickAny': 'Haciendo clic en una cuenta',
  'assistant.tool.type': 'Escribiendo en {account}',
  'assistant.tool.typeAny': 'Escribiendo en una cuenta',
  'assistant.tool.press': 'Pulsando {key}',
  'assistant.tool.pressAny': 'Pulsando una tecla',
  'assistant.tool.calendarEvents': 'Consultando los calendarios',
  'assistant.tool.findFreeTime': 'Buscando huecos libres',
  'assistant.tool.createEvent': 'Esperando tu OK para crear el evento',
  'assistant.tool.unreadCounts': 'Contando los mensajes sin leer',

  // The chat panel
  'assistant.panel.scopeTitle': 'Para qué espacio trabaja este asistente',
  'assistant.panel.history': 'Historial',
  'assistant.panel.newChat': 'Nuevo chat',
  'assistant.history.title': '{scope} · historial',
  'assistant.history.empty': 'Todavía no hay conversaciones.',
  'assistant.history.deleteLabel': 'Eliminar {title}',
  'assistant.empty.off': 'El asistente está desactivado para <b>{scope}</b>.',
  'assistant.empty.openSettings': 'Abrir Ajustes → Asistente',
  'assistant.empty.noAccount': 'Todavía no hay ninguna cuenta de <b>{scope}</b> activada para el asistente.',
  'assistant.empty.chooseInSettings': 'Elegir en Ajustes → Asistente',
  'assistant.empty.askAll': 'Pregunta lo que quieras sobre <b>todas tus cuentas</b>, o empieza con:',
  'assistant.empty.askScope': 'Pregunta lo que quieras sobre <b>{scope}</b>, o empieza con:',
  'assistant.empty.seesAll': 'Ve todas las cuentas compartidas.',
  'assistant.empty.seesScope': 'Solo ve las cuentas de {scope}: {accounts}.',
  'assistant.empty.tip': 'Escribe / para ver los comandos y @ para una cuenta. Nunca se envía nada por ti.',
  'assistant.working': 'Trabajando…',
  'assistant.problem.signedOut': '<b>Claude Code no puede responder: tienes que volver a iniciar sesión.</b> Abre Terminal, ejecuta <code>claude auth login</code> e inténtalo de nuevo.',
  'assistant.problem.failed': 'Se ha producido un error.',
  'assistant.problem.retry': 'Reintentar',
  'assistant.compose.placeholderOff': 'El asistente está desactivado para este espacio',
  'assistant.compose.placeholder': 'Pregunta o escribe / para ver los comandos…',
  'assistant.compose.placeholderNoAccount': 'Primero activa una cuenta (Ajustes → Asistente)',
  'assistant.compose.model': 'Modelo',
  'assistant.compose.changeEngine': 'Cambiar en Ajustes → Asistente',
  'assistant.compose.effort': 'Esfuerzo (cuánto piensa)',
  'assistant.compose.send': 'Enviar',

  // The chat window before the chat (an engine that isn't connected)
  'assistant.window.notConnected': 'Este espacio usa <b>{engine}</b>, que todavía no está conectado.',
  'assistant.window.connect': 'Conéctalo en Ajustes → Integraciones',
  'assistant.window.chooseAnother': 'O elige otro asistente para este espacio en <link>Ajustes → Asistente</link>.',

  // The floating button
  'assistant.fab.closeTitle': 'Cerrar el asistente  (⌘J)',
  'assistant.fab.close': 'Cerrar el asistente',
  'assistant.fab.actionsTitle': 'Acciones rápidas · arrastra para mover',
  'assistant.fab.actions': 'Acciones rápidas',

  // Setup steps
  'assistant.setup.intro':
    'El asistente lee tus cuentas, responde preguntas, redacta respuestas y busca huecos para reuniones. Funciona con <b>Claude Code</b> y tu propio plan de Claude. Dos pasos para empezar:',
  'assistant.setup.connectClaude': 'Conectar Claude',
  'assistant.setup.checking': 'Comprobando…',
  'assistant.setup.notInstalled': 'Claude Code todavía no está en este Mac. Abre Terminal, pega esto y pulsa Retorno:',
  'assistant.setup.needsPlan': 'Necesita un plan Claude Pro o Max (o una cuenta de Anthropic Console).',
  'assistant.setup.installed': 'Ya lo he instalado',
  'assistant.setup.signInIntro': 'Inicia sesión con tu cuenta de Claude. Se abrirá el navegador; vuelve aquí cuando indique que has iniciado sesión.',
  'assistant.setup.waiting': 'Esperando a que termines en el navegador…',
  'assistant.setup.slow': '¿Tarda mucho? Abre Terminal, ejecuta <code>claude auth login</code> y <link>vuelve a comprobarlo</link>.',
  'assistant.setup.signIn': 'Iniciar sesión en Claude',
  'assistant.setup.signInFailed': 'Todavía no has iniciado sesión. También puedes abrir Terminal, ejecutar <code>claude auth login</code> y <link>volver a comprobarlo</link>.',
  'assistant.setup.chooseAccounts': 'Elige lo que puede leer',
  'assistant.setup.accountsIntro': 'Solo puede ver estas cuentas. Nunca envía nada por ti; antes de hacer clic o escribir, te pregunta.',
  'assistant.setup.changeLater': 'Puedes cambiarlo más adelante en Ajustes → Asistente.',

  // Connect Claude (Claude Code / Claude Desktop on this Mac)
  'assistant.connect.title': 'Conectar Claude',
  'assistant.connect.hint': 'Permite que Claude Code o Claude Desktop en este Mac lean y trabajen en las cuentas que elijas. Nada sale de tu Mac salvo a través del propio Claude.',
  'assistant.connect.allow': 'Permitir que Claude se conecte',
  'assistant.connect.claudeCode': 'Claude Code: ejecútalo en Terminal',
  'assistant.connect.claudeDesktop': 'Claude Desktop: añádelo a claude_desktop_config.json',
  'assistant.connect.accessHint':
    'Después, da acceso a cada cuenta (Ajustes → Cuentas, o haz clic derecho en ella → <b>Acceso de Claude</b>): Leer, o Leer y actuar. Claude tiene que preguntarte antes de hacer clic o escribir, y puedes detenerlo en cualquier momento con ⌘.',

  // The banner while Claude acts in an account
  'assistant.banner.working': 'Claude está trabajando en <b>{name}</b>',
  'assistant.banner.thisAccount': 'esta cuenta',

  // Conversations
  'assistant.conversation.newTitle': 'Nuevo chat',
  'assistant.startedFresh': '(El contexto anterior de esta conversación ya no estaba disponible, así que he empezado de cero).',

  // Errors shown in the chat
  'assistant.error.claudeNotInstalled': 'Claude Code no está instalado.',
  'assistant.error.claudeReported': 'Claude Code ha informado de un error.',
  'assistant.error.claudeStopped': 'Claude Code se ha detenido de forma inesperada.',
  'assistant.error.defaultModel':
    'El modelo predeterminado de Claude Code no se puede usar aquí (ha dicho: “{message}”). Elige un modelo para este espacio, como Sonnet u Opus, en el menú bajo el chat o en Ajustes → Asistente. O corrige el “model” en los ajustes de Claude Code (~/.claude/settings.json).',
  'assistant.error.codexNotInstalled': 'OpenAI Codex no está instalado.',
  'assistant.error.codexCouldNotAnswer': 'Codex no ha podido responder.',
  'assistant.error.codexReported': 'Codex ha informado de un error.',
  'assistant.error.codexStopped': 'Codex se ha detenido de forma inesperada.',
  'assistant.error.codexForbiddenServer': 'Codex ha intentado usar una herramienta de “{server}”, algo que Mission Desk no permite, así que se ha detenido la respuesta.',
  'assistant.error.codexForbiddenOtherServer': 'Codex ha intentado usar una herramienta de “otro servidor”, algo que Mission Desk no permite, así que se ha detenido la respuesta.',
  'assistant.error.codexForbiddenCommand': 'Codex ha intentado usar un comando en el Mac, algo que Mission Desk no permite, así que se ha detenido la respuesta.',
  'assistant.error.codexForbiddenBuiltIn': 'Codex ha intentado usar su herramienta integrada “{tool}”, algo que Mission Desk no permite, así que se ha detenido la respuesta.',
  'assistant.error.openRouterStatus': 'OpenRouter ha respondido {status}.',
  'assistant.error.openRouterConnect': 'Conecta OpenRouter en Ajustes → Integraciones.',
  'assistant.error.tooManySteps': '(Detenido: demasiados pasos para una sola respuesta).',
  'assistant.error.modelError': 'El modelo ha devuelto un error.',
  'assistant.error.modelStopped': 'El modelo se ha detenido con un error.',

  // Connecting OpenRouter
  'assistant.openRouter.keyRejected': 'OpenRouter no ha aceptado esta clave.',
  'assistant.openRouter.statusRetry': 'OpenRouter ha respondido {status}. Inténtalo de nuevo.',
  'assistant.openRouter.unreachable': 'No se ha podido conectar con OpenRouter. Comprueba la conexión.',
  'assistant.keychainUnavailable': 'El llavero de macOS no está disponible, así que no se ha guardado la clave.',
  "assistant.error.claudeAccountMissing": "Se quitó la cuenta de Claude de este espacio. Elige su cuenta de Claude en Ajustes → Asistente.",
};
