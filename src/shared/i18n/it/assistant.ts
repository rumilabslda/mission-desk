import type { Translation } from '../types';
import type { assistant as en } from '../en/assistant';

export const assistant: Translation<typeof en> = {
  'assistant.title': 'Assistente',
  'assistant.closeShortcut': 'Chiudi (⌘J)',
  'assistant.copy': 'Copia',
  'assistant.copied': 'Copiato',
  'assistant.stop': 'Interrompi',

  // Models and effort (the menus under the chat and in Settings)
  'assistant.model.default': 'Predefinito (Claude Code)',
  'assistant.effort.low': 'basso',
  'assistant.effort.medium': 'medio',
  'assistant.effort.high': 'alto',
  'assistant.effort.xhigh': 'molto alto',
  'assistant.effort.max': 'massimo',

  // The "/" menu
  'assistant.command.brief': 'La tua giornata in tutti gli account',
  'assistant.command.waiting': 'Chi aspetta una tua risposta',
  'assistant.command.prep': 'Prepara la prossima riunione',
  'assistant.command.schedule': 'Trova un orario e prenotalo',
  'assistant.command.reply': 'Scrivi una bozza di risposta alla conversazione aperta',
  'assistant.command.summarize': 'Riassumi ciò che è sullo schermo',
  'assistant.command.catchup': 'Cosa è successo in un account',

  // Tool steps in an answer
  'assistant.tool.currentContext': 'Guardo il tuo schermo',
  'assistant.tool.listAccounts': 'Elenco gli account',
  'assistant.tool.readPage': 'Leggo {account}',
  'assistant.tool.readPageTab': 'Leggo {account} · {tab}',
  'assistant.tool.readPageAny': 'Leggo una pagina',
  'assistant.tool.readPageAnyTab': 'Leggo una pagina · {tab}',
  'assistant.tool.getElements': 'Esamino {account}',
  'assistant.tool.getElementsAny': 'Esamino la pagina',
  'assistant.tool.screenshot': 'Istantanea di {account}',
  'assistant.tool.screenshotAny': 'Istantanea della pagina',
  'assistant.tool.openUrl': 'Apro una pagina in {account}',
  'assistant.tool.openUrlAny': 'Apro una pagina in un account',
  'assistant.tool.click': 'Faccio clic in {account}',
  'assistant.tool.clickAny': 'Faccio clic in un account',
  'assistant.tool.type': 'Digito in {account}',
  'assistant.tool.typeAny': 'Digito in un account',
  'assistant.tool.press': 'Premo {key}',
  'assistant.tool.pressAny': 'Premo un tasto',
  'assistant.tool.calendarEvents': 'Controllo i calendari',
  'assistant.tool.findFreeTime': 'Cerco tempo libero',
  'assistant.tool.createEvent': 'Attendo il tuo OK per creare l’evento',
  'assistant.tool.unreadCounts': 'Conto i non letti',

  // The chat panel
  'assistant.panel.scopeTitle': 'Per quale spazio lavora questo assistente',
  'assistant.panel.history': 'Cronologia',
  'assistant.panel.newChat': 'Nuova chat',
  'assistant.history.title': '{scope} · cronologia',
  'assistant.history.empty': 'Ancora nessuna conversazione.',
  'assistant.history.deleteLabel': 'Elimina {title}',
  'assistant.empty.off': 'L’assistente è disattivato per <b>{scope}</b>.',
  'assistant.empty.openSettings': 'Apri Impostazioni → Assistente',
  'assistant.empty.noAccount': 'Nessun account di <b>{scope}</b> è ancora attivato per l’assistente.',
  'assistant.empty.chooseInSettings': 'Scegli in Impostazioni → Assistente',
  'assistant.empty.askAll': 'Chiedi qualsiasi cosa su <b>tutti i tuoi account</b>, oppure inizia con:',
  'assistant.empty.askScope': 'Chiedi qualsiasi cosa su <b>{scope}</b>, oppure inizia con:',
  'assistant.empty.seesAll': 'Vede ogni account condiviso.',
  'assistant.empty.seesScope': 'Vede solo gli account di {scope}: {accounts}.',
  'assistant.empty.tip': 'Digita / per i comandi, @ per un account. Non viene inviato nulla al posto tuo.',
  'assistant.working': 'Al lavoro…',
  'assistant.problem.signedOut': '<b>Claude Code non può rispondere: devi accedere di nuovo.</b> Apri Terminale ed esegui <code>claude auth login</code>, poi riprova.',
  'assistant.problem.failed': 'Si è verificato un problema.',
  'assistant.problem.retry': 'Riprova',
  'assistant.compose.placeholderOff': 'L’assistente è disattivato per questo spazio',
  'assistant.compose.placeholder': 'Chiedi, o digita / per i comandi…',
  'assistant.compose.placeholderNoAccount': 'Prima attiva un account (Impostazioni → Assistente)',
  'assistant.compose.model': 'Modello',
  'assistant.compose.changeEngine': 'Modifica in Impostazioni → Assistente',
  'assistant.compose.effort': 'Impegno (quanto ragiona)',
  'assistant.compose.send': 'Invia',

  // The chat window before the chat (an engine that isn't connected)
  'assistant.window.notConnected': 'Questo spazio usa <b>{engine}</b>, che non è ancora collegato.',
  'assistant.window.connect': 'Collegalo in Impostazioni → Integrazioni',
  'assistant.window.chooseAnother': 'Oppure scegli un altro assistente per questo spazio in <link>Impostazioni → Assistente</link>.',

  // The floating button
  'assistant.fab.closeTitle': 'Chiudi l’assistente  (⌘J)',
  'assistant.fab.close': 'Chiudi l’assistente',
  'assistant.fab.actionsTitle': 'Azioni rapide · trascina per spostare',
  'assistant.fab.actions': 'Azioni rapide',

  // Setup steps
  'assistant.setup.intro':
    'L’assistente legge i tuoi account e risponde alle domande, scrive bozze di risposta e trova il tempo per le riunioni. Funziona con <b>Claude Code</b>, con il tuo piano Claude. Due passaggi per iniziare:',
  'assistant.setup.connectClaude': 'Collega Claude',
  'assistant.setup.checking': 'Verifica…',
  'assistant.setup.notInstalled': 'Claude Code non è ancora su questo Mac. Apri Terminale, incolla questo comando e premi Invio:',
  'assistant.setup.needsPlan': 'Serve un piano Claude Pro o Max (o un account Anthropic Console).',
  'assistant.setup.installed': 'L’ho installato',
  'assistant.setup.signInIntro': 'Accedi con il tuo account Claude. Si apre il browser; torna qui quando indica che hai effettuato l’accesso.',
  'assistant.setup.waiting': 'In attesa che tu finisca nel browser…',
  'assistant.setup.slow': 'Ci vuole troppo? Apri Terminale ed esegui <code>claude auth login</code>, poi <link>controlla di nuovo</link>.',
  'assistant.setup.signIn': 'Accedi a Claude',
  'assistant.setup.signInFailed': 'Accesso non ancora effettuato. Puoi anche aprire Terminale ed eseguire <code>claude auth login</code>, poi <link>controllare di nuovo</link>.',
  'assistant.setup.chooseAccounts': 'Scegli cosa può leggere',
  'assistant.setup.accountsIntro': 'Può vedere solo questi account. Non invia mai nulla al posto tuo; prima di fare clic o digitare te lo chiede.',
  'assistant.setup.changeLater': 'Puoi modificarlo più tardi in Impostazioni → Assistente.',

  // Connect Claude (Claude Code / Claude Desktop on this Mac)
  'assistant.connect.title': 'Collega Claude',
  'assistant.connect.hint': 'Consenti a Claude Code o Claude Desktop su questo Mac di leggere e lavorare negli account che scegli. Nulla lascia il tuo Mac se non tramite Claude stesso.',
  'assistant.connect.allow': 'Consenti a Claude di collegarsi',
  'assistant.connect.claudeCode': 'Claude Code: esegui in Terminale',
  'assistant.connect.claudeDesktop': 'Claude Desktop: aggiungi a claude_desktop_config.json',
  'assistant.connect.accessHint':
    'Poi concedi l’accesso a ciascun account (Impostazioni → Account, oppure fai clic destro → <b>Accesso di Claude</b>): Lettura, oppure Lettura e azioni. Claude deve chiederti il permesso prima di fare clic o digitare, e puoi fermarlo in qualsiasi momento con ⌘.',

  // The banner while Claude acts in an account
  'assistant.banner.working': 'Claude sta lavorando in <b>{name}</b>',
  'assistant.banner.thisAccount': 'questo account',

  // Conversations
  'assistant.conversation.newTitle': 'Nuova chat',
  'assistant.startedFresh': '(Il contesto precedente di questa conversazione non era più disponibile, quindi ho ricominciato da capo.)',

  // Errors shown in the chat
  'assistant.error.claudeNotInstalled': 'Claude Code non è installato.',
  'assistant.error.claudeReported': 'Claude Code ha segnalato un errore.',
  'assistant.error.claudeStopped': 'Claude Code si è interrotto inaspettatamente.',
  'assistant.error.defaultModel':
    'Il modello predefinito di Claude Code non si può usare qui (ha risposto: “{message}”). Scegli un modello per questo spazio, ad esempio Sonnet o Opus, nel menu sotto la chat o in Impostazioni → Assistente. Oppure correggi “model” nelle impostazioni di Claude Code (~/.claude/settings.json).',
  'assistant.error.codexNotInstalled': 'OpenAI Codex non è installato.',
  'assistant.error.codexCouldNotAnswer': 'Codex non è riuscito a rispondere.',
  'assistant.error.codexReported': 'Codex ha segnalato un errore.',
  'assistant.error.codexStopped': 'Codex si è interrotto inaspettatamente.',
  'assistant.error.codexForbiddenServer': 'Codex ha provato a usare uno strumento di “{server}”, che Mission Desk non consente, quindi la risposta è stata interrotta.',
  'assistant.error.codexForbiddenOtherServer': 'Codex ha provato a usare uno strumento di “un altro server”, che Mission Desk non consente, quindi la risposta è stata interrotta.',
  'assistant.error.codexForbiddenCommand': 'Codex ha provato a usare un comando sul Mac, che Mission Desk non consente, quindi la risposta è stata interrotta.',
  'assistant.error.codexForbiddenBuiltIn': 'Codex ha provato a usare il suo strumento integrato “{tool}”, che Mission Desk non consente, quindi la risposta è stata interrotta.',
  'assistant.error.openRouterStatus': 'OpenRouter ha risposto {status}.',
  'assistant.error.openRouterConnect': 'Collega OpenRouter in Impostazioni → Integrazioni.',
  'assistant.error.tooManySteps': '(Interrotto: troppi passaggi per una sola risposta.)',
  'assistant.error.modelError': 'Il modello ha restituito un errore.',
  'assistant.error.modelStopped': 'Il modello si è interrotto con un errore.',

  // Connecting OpenRouter
  'assistant.openRouter.keyRejected': 'OpenRouter non ha accettato questa chiave.',
  'assistant.openRouter.statusRetry': 'OpenRouter ha risposto {status}. Riprova.',
  'assistant.openRouter.unreachable': 'Impossibile raggiungere OpenRouter. Controlla la connessione.',
  'assistant.keychainUnavailable': 'Il Portachiavi di macOS non è disponibile, quindi la chiave non è stata salvata.',
  "assistant.error.claudeAccountMissing": "L’account Claude di questo spazio è stato rimosso. Scegli il suo account Claude in Impostazioni → Assistente.",
};
