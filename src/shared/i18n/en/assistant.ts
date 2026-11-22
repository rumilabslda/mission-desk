import type { Msg } from '../types';

export const assistant = {
  'assistant.title': 'Assistant',
  'assistant.closeShortcut': 'Close (⌘J)',
  'assistant.copy': 'Copy',
  'assistant.copied': 'Copied',
  'assistant.stop': 'Stop',

  // Models and effort (the menus under the chat and in Settings)
  'assistant.model.default': 'Default (Claude Code)',
  'assistant.effort.low': 'low',
  'assistant.effort.medium': 'medium',
  'assistant.effort.high': 'high',
  'assistant.effort.xhigh': 'xhigh',
  'assistant.effort.max': 'max',

  // The "/" menu
  'assistant.command.brief': 'Your day across all accounts',
  'assistant.command.waiting': 'Who is waiting on you',
  'assistant.command.prep': 'Prepare your next meeting',
  'assistant.command.schedule': 'Find a time and book it',
  'assistant.command.reply': 'Draft a reply to the open thread',
  'assistant.command.summarize': 'Summarise what is on screen',
  'assistant.command.catchup': 'What happened in an account',

  // Tool steps in an answer
  'assistant.tool.currentContext': 'Looking at your screen',
  'assistant.tool.listAccounts': 'Listing accounts',
  'assistant.tool.readPage': 'Reading {account}',
  'assistant.tool.readPageTab': 'Reading {account} · {tab}',
  'assistant.tool.readPageAny': 'Reading a page',
  'assistant.tool.readPageAnyTab': 'Reading a page · {tab}',
  'assistant.tool.getElements': 'Looking at {account}',
  'assistant.tool.getElementsAny': 'Looking at the page',
  'assistant.tool.screenshot': 'Screenshot of {account}',
  'assistant.tool.screenshotAny': 'Screenshot of the page',
  'assistant.tool.openUrl': 'Opening a page in {account}',
  'assistant.tool.openUrlAny': 'Opening a page in an account',
  'assistant.tool.click': 'Clicking in {account}',
  'assistant.tool.clickAny': 'Clicking in an account',
  'assistant.tool.type': 'Typing in {account}',
  'assistant.tool.typeAny': 'Typing in an account',
  'assistant.tool.press': 'Pressing {key}',
  'assistant.tool.pressAny': 'Pressing a key',
  'assistant.tool.calendarEvents': 'Checking calendars',
  'assistant.tool.findFreeTime': 'Finding free time',
  'assistant.tool.createEvent': 'Waiting for your OK to create the event',
  'assistant.tool.unreadCounts': 'Counting unread',

  // The chat panel
  'assistant.panel.scopeTitle': 'Which space this assistant works for',
  'assistant.panel.history': 'History',
  'assistant.panel.newChat': 'New chat',
  'assistant.history.title': '{scope} · history',
  'assistant.history.empty': 'No conversations yet.',
  'assistant.history.deleteLabel': 'Delete {title}',
  'assistant.empty.off': 'The assistant is off for <b>{scope}</b>.',
  'assistant.empty.openSettings': 'Open Settings → Assistant',
  'assistant.empty.noAccount': 'No account in <b>{scope}</b> is turned on for the assistant yet.',
  'assistant.empty.chooseInSettings': 'Choose in Settings → Assistant',
  'assistant.empty.askAll': 'Ask anything about <b>all your accounts</b>, or start with:',
  'assistant.empty.askScope': 'Ask anything about <b>{scope}</b>, or start with:',
  'assistant.empty.seesAll': 'It sees every shared account.',
  'assistant.empty.seesScope': "It sees only {scope}'s accounts: {accounts}.",
  'assistant.empty.tip': 'Type / for commands, @ for an account. Nothing is sent for you.',
  'assistant.working': 'Working…',
  'assistant.problem.signedOut': '<b>Claude Code can’t answer: it needs you to sign in again.</b> Open Terminal and run <code>claude auth login</code>, then try again.',
  'assistant.problem.failed': 'Something went wrong.',
  'assistant.problem.retry': 'Try again',
  'assistant.compose.placeholderOff': 'The assistant is off for this space',
  'assistant.compose.placeholder': 'Ask, or type / for commands…',
  'assistant.compose.placeholderNoAccount': 'Turn on an account first (Settings → Assistant)',
  'assistant.compose.model': 'Model',
  'assistant.compose.changeEngine': 'Change in Settings → Assistant',
  'assistant.compose.effort': 'Effort (how hard it thinks)',
  'assistant.compose.send': 'Send',

  // The chat window before the chat (an engine that isn't connected)
  'assistant.window.notConnected': 'This space uses <b>{engine}</b>, which isn\'t connected yet.',
  'assistant.window.connect': 'Connect it in Settings → Integrations',
  'assistant.window.chooseAnother': 'Or choose another assistant for this space in <link>Settings → Assistant</link>.',

  // The floating button
  'assistant.fab.closeTitle': 'Close the assistant  (⌘J)',
  'assistant.fab.close': 'Close the assistant',
  'assistant.fab.actionsTitle': 'Quick actions · drag to move',
  'assistant.fab.actions': 'Quick actions',

  // Setup steps
  'assistant.setup.intro':
    'The assistant reads your accounts and answers questions, drafts replies and finds time for meetings. It runs on <b>Claude Code</b>, with your own Claude plan. Two steps to start:',
  'assistant.setup.connectClaude': 'Connect Claude',
  'assistant.setup.checking': 'Checking…',
  'assistant.setup.notInstalled': 'Claude Code isn’t on this Mac yet. Open Terminal, paste this and press Return:',
  'assistant.setup.needsPlan': 'It needs a Claude Pro or Max plan (or an Anthropic Console account).',
  'assistant.setup.installed': 'I’ve installed it',
  'assistant.setup.signInIntro': 'Sign in with your Claude account. Your browser opens; come back here when it says you’re signed in.',
  'assistant.setup.waiting': 'Waiting for you to finish in the browser…',
  'assistant.setup.slow': 'Taking long? Open Terminal and run <code>claude auth login</code>, then <link>check again</link>.',
  'assistant.setup.signIn': 'Sign in to Claude',
  'assistant.setup.signInFailed': 'Not signed in yet. You can also open Terminal and run <code>claude auth login</code>, then <link>check again</link>.',
  'assistant.setup.chooseAccounts': 'Choose what it can read',
  'assistant.setup.accountsIntro': 'Only these accounts are visible to it. It never sends anything for you; to click or type it asks first.',
  'assistant.setup.changeLater': 'You can change this later in Settings → Assistant.',

  // Connect Claude (Claude Code / Claude Desktop on this Mac)
  'assistant.connect.title': 'Connect Claude',
  'assistant.connect.hint': 'Let Claude Code or Claude Desktop on this Mac read and work in the accounts you choose. Nothing leaves your Mac except through Claude itself.',
  'assistant.connect.allow': 'Allow Claude to connect',
  'assistant.connect.claudeCode': 'Claude Code — run in Terminal',
  'assistant.connect.claudeDesktop': 'Claude Desktop — add to claude_desktop_config.json',
  'assistant.connect.accessHint':
    'Then give each account access (Settings → Accounts, or right-click it → <b>Claude access</b>): Read, or Read & act. Claude must ask you before it clicks or types, and you can stop it any time with ⌘.',

  // The banner while Claude acts in an account
  'assistant.banner.working': 'Claude is working in <b>{name}</b>',
  'assistant.banner.thisAccount': 'this account',

  // Conversations
  'assistant.conversation.newTitle': 'New chat',
  'assistant.startedFresh': '(The earlier context of this conversation was no longer available, so I started fresh.)',

  // Errors shown in the chat
  'assistant.error.claudeNotInstalled': 'Claude Code is not installed.',
  'assistant.error.claudeReported': 'Claude Code reported an error.',
  'assistant.error.claudeStopped': 'Claude Code stopped unexpectedly.',
  'assistant.error.defaultModel':
    'Claude Code\'s own default model can\'t be used here (it said: "{message}"). Choose a model for this space, such as Sonnet or Opus, in the menu under the chat or in Settings → Assistant. Or fix the "model" in your Claude Code settings (~/.claude/settings.json).',
  'assistant.error.codexNotInstalled': 'OpenAI Codex is not installed.',
  'assistant.error.codexCouldNotAnswer': 'Codex could not answer.',
  'assistant.error.codexReported': 'Codex reported an error.',
  'assistant.error.codexStopped': 'Codex stopped unexpectedly.',
  'assistant.error.codexForbiddenServer': 'Codex tried to use a tool from "{server}", which Mission Desk doesn\'t allow, so the answer was stopped.',
  'assistant.error.codexForbiddenOtherServer': 'Codex tried to use a tool from "another server", which Mission Desk doesn\'t allow, so the answer was stopped.',
  'assistant.error.codexForbiddenCommand': 'Codex tried to use a command on the Mac, which Mission Desk doesn\'t allow, so the answer was stopped.',
  'assistant.error.codexForbiddenBuiltIn': 'Codex tried to use its built-in "{tool}" tool, which Mission Desk doesn\'t allow, so the answer was stopped.',
  'assistant.error.openRouterStatus': 'OpenRouter answered {status}.',
  'assistant.error.openRouterConnect': 'Connect OpenRouter in Settings → Integrations.',
  'assistant.error.tooManySteps': '(Stopped: too many steps for one answer.)',
  'assistant.error.modelError': 'The model returned an error.',
  'assistant.error.modelStopped': 'The model stopped with an error.',

  // Connecting OpenRouter
  'assistant.openRouter.keyRejected': 'OpenRouter did not accept this key.',
  'assistant.openRouter.statusRetry': 'OpenRouter answered {status}. Try again.',
  'assistant.openRouter.unreachable': "Couldn't reach OpenRouter. Check the connection.",
  'assistant.keychainUnavailable': 'The macOS Keychain is not available, so the key was not saved.',
  'assistant.error.claudeAccountMissing': 'This space’s Claude account was removed. Choose its Claude account in Settings → Assistant.',
} satisfies Record<string, Msg>;
