import type { Msg } from '../types';

/** The first-run setup (src/renderer/src/setup/SetupView.tsx, src/shared/setup.ts). */
export const setup = {
  // Names the setup gives (src/shared/setup.ts)
  'setup.app.website': 'Website',
  'setup.spaces.tooLong': 'Keep it under {max} characters.',
  'setup.spaces.taken': '{name} is already there.',

  // What each service brings (the tiles)
  'setup.service.googleWhat': 'Gmail, Calendar, Drive',
  'setup.service.slackWhat': 'A workspace',
  'setup.service.whatsappWhat': 'Your chats',
  'setup.service.telegramWhat': 'Your chats',
  'setup.service.linkedinWhat': 'Messages, feed',
  'setup.service.discordWhat': 'Servers, DMs',
  'setup.service.zoomWhat': 'Team Chat, meetings',
  'setup.service.notionWhat': 'Pages, wikis',
  'setup.service.protonWhat': 'Private email',
  'setup.service.icloudWhat': 'Apple email',
  'setup.service.fastmailWhat': 'Email, calendar',

  // Example and suggested space names
  'setup.spaceName.personal': 'Personal',
  'setup.spaceName.work': 'Work',
  'setup.spaceName.sideProject': 'Side project',

  // Progress and navigation
  'setup.stage.welcome': 'Welcome',
  'setup.stage.assistant': 'Assistant',
  'setup.stage.spaces': 'Spaces',
  'setup.stage.apps': 'Apps',
  'setup.stage.ready': 'Ready',
  'setup.progressLabel': 'Step {step} of {total}: {stage}',
  'setup.skip': 'Skip setup',
  'setup.skipTitle': 'You can run the setup again from Settings → General',
  'setup.nav.aboutAMinute': 'Takes about a minute.',
  'setup.nav.needSpace': 'Add a space, or keep everything together.',
  'setup.nav.getStarted': 'Get started',
  'setup.nav.settingUp': 'Setting up…',
  'setup.nav.startSigningIn': 'Start signing in',
  'setup.nav.openMissionDesk': 'Open Mission Desk',
  'setup.nav.continue': 'Continue',
  'setup.finishError': "Mission Desk couldn't add them. Go back and check the space names and web addresses, then try again.",
  'setup.remove': 'Remove {name}',

  // Welcome
  'setup.welcome.nameLabel': 'Your name (optional)',
  'setup.welcome.namePlaceholder': 'How you’d like to be called',
  'setup.welcome.title': 'Welcome to Mission Desk',
  'setup.welcome.titleAgain': 'Set up more of Mission Desk',
  'setup.welcome.lede':
    'All your apps side by side, organised in spaces, with one Home for your day and an assistant that knows each space.',
  'setup.welcome.ledeAgain': 'Add spaces and apps the same way as the first time. What you already have stays as it is.',
  'setup.welcome.accountsTitle': 'Every account signed in on its own',
  'setup.welcome.accountsText': 'Two Google accounts, three Slack workspaces: each keeps its own login.',
  'setup.welcome.homeTitle': 'Home shows what’s next',
  'setup.welcome.homeText': 'Your meetings, to-dos and unread messages, and one click to join a call.',
  'setup.welcome.assistantTitle': 'An assistant that stays in its space',
  'setup.welcome.assistantText': 'It reads only the apps you share with it, and only in that space.',
  'setup.welcome.meetingsTitle': 'Meetings transcribed on your Mac',
  'setup.welcome.meetingsText': 'In Meet, Teams and Zoom, with the summary and your to-dos when it ends. The audio never leaves your Mac.',

  // Assistant
  'setup.assistant.title': 'Would you like an assistant?',
  'setup.assistant.lede':
    'It briefs you on your day, finds who’s waiting on you and prepares your meetings, from the apps you share with it.',
  'setup.assistant.groupLabel': 'Assistant',
  'setup.assistant.claudeHint': 'Uses your Claude plan, through Claude Code on this Mac.',
  'setup.assistant.codexHint': 'Uses your ChatGPT plan, through Codex on this Mac.',
  'setup.assistant.openrouterHint': 'GPT, Gemini, Llama and more, with your own OpenRouter key.',
  'setup.assistant.offName': 'Not now',
  'setup.assistant.offHint': 'You can add one later in Settings.',
  'setup.assistant.addAnother': '+ Add another account',
  'setup.assistant.perSpaceTitle': 'Choose an assistant for each space',
  'setup.assistant.perSpaceText': 'For example another Claude account for work. A space you leave as it is uses the one above.',
  'setup.assistant.spaceLabel': '{name}’s assistant',
  'setup.assistant.sameAsAbove': 'Same as above ({name})',
  'setup.assistant.meetings': 'Your apps include calls: when a meeting ends, the space’s assistant can write its summary and your to-dos.',
  'setup.assistant.readsTitle': 'Let the assistant read these apps',
  'setup.assistant.signInAgain': '{name} isn’t signed in.',

  // Connecting the assistant
  'setup.engine.checking': 'Checking {name}…',
  'setup.engine.readyOpenRouter': 'OpenRouter is connected. {name} is ready.',
  'setup.engine.readySignedIn': '{app} is signed in on this Mac. {name} is ready.',
  'setup.engine.keyLabel': 'Your OpenRouter key',
  'setup.engine.checkingKey': 'Checking…',
  'setup.engine.connect': 'Connect',
  'setup.engine.keyRefused': 'OpenRouter refused this key. Check it and try again.',
  'setup.engine.keyHelp':
    'Create one at <link>openrouter.ai/keys</link>. macOS keeps it encrypted on this Mac; OpenRouter bills what you use.',
  'setup.engine.finishInBrowser': 'Finish signing in in your browser…',
  'setup.engine.installed': '{app} is installed. Sign in once, with your {account} account.',
  'setup.engine.signIn': 'Sign in',
  'setup.engine.installClaude': 'Claude needs Claude Code on this Mac. Open Terminal, paste this and press Return:',
  'setup.engine.installCodex':
    'OpenAI Codex needs the Codex command-line tool on this Mac. Open Terminal, paste this and press Return:',
  'setup.engine.copy': 'Copy',
  'setup.engine.copied': 'Copied',
  'setup.engine.npmMissing': 'If Terminal says npm isn’t found, install Node.js from nodejs.org first.',
  'setup.engine.installedIt': 'I’ve installed it',
  'setup.engine.later': 'You can also finish this later, in Settings → Integrations.',

  // Spaces
  'setup.spaces.title': 'How would you like to organise your work?',
  'setup.spaces.lede': 'A space for each company, project or part of your life, like Personal, Acme or Side project.',
  'setup.spaces.listLabel': 'Your spaces',
  'setup.spaces.placeholderFirst': 'Name a space, like Acme',
  'setup.spaces.placeholderMore': 'Another space',
  'setup.spaces.nameLabel': 'Space name',
  'setup.spaces.full': {
    one: 'That’s {count} space, the most the setup makes. You can add more later.',
    other: 'That’s {count} spaces, the most the setup makes. You can add more later.',
  },
  'setup.spaces.ideas': 'Ideas:',
  'setup.spaces.togetherTitle': 'Keep everything together',
  'setup.spaces.togetherText': 'All your apps in one list, without spaces. You can make spaces later.',

  // Apps
  'setup.apps.title': 'Which apps do you use?',
  'setup.apps.titleSpace': 'Which apps go in {name}?',
  'setup.apps.lede': 'Pick as many as you like. You’ll sign in to each one at the end.',
  'setup.apps.ledeSpace': 'Pick as many as you like. {name} is space {n} of {total}. You’ll sign in to each one at the end.',
  'setup.apps.accounts': { one: '{count} account', other: '{count} accounts' },
  'setup.apps.oneFewer': 'One {name} account fewer',
  'setup.apps.another': 'Another {name} account',
  'setup.apps.anyWebsite': 'Any website',
  'setup.apps.sitesAdded': { one: '{count} added', other: '{count} added' },
  'setup.apps.badAddress': 'That doesn’t look like a web address. Try something like notion.so.',
  'setup.apps.alreadyListed': 'It’s already in the list.',
  'setup.apps.addressPlaceholder': 'Web address, like notion.so',
  'setup.apps.addressLabel': 'Web address',
  'setup.apps.full': {
    one: 'That’s {count} app, the most for one space here. You can add more later.',
    other: 'That’s {count} apps, the most for one space here. You can add more later.',
  },
  'setup.apps.needsOne': 'A space needs at least one app. With none, {name} is left out; you can make it later.',

  // Ready
  'setup.ready.nothingTitle': 'Nothing to add yet',
  'setup.ready.nothingText':
    'You haven’t picked any apps. Go back to choose some, or open Mission Desk and add them one by one with the + in the sidebar.',
  'setup.ready.title': 'Ready to sign in',
  'setup.ready.lede': {
    one: 'Mission Desk adds your app and opens {first} first. Sign in to each one once; it stays signed in on this Mac.',
    other:
      'Mission Desk adds your {count} apps and opens {first} first. Sign in to each one once; it stays signed in on this Mac.',
  },
  'setup.ready.ledeSpaces':
    'Mission Desk adds your {count} apps in {spaces} spaces and opens {first} first. Sign in to each one once; it stays signed in on this Mac.',
  'setup.ready.alreadyThere': 'Already there: adds to it',
  'setup.ready.noAssistant': 'No assistant',
  'setup.ready.keepsAssistant': 'Keeps its assistant',
  'setup.ready.readsText':
    'So it can brief you and find who’s waiting on you. It can’t type, click or send in them. You can change this per app in Settings.',

  // The sidebar preview
  'setup.dock.home': 'Home',
  'setup.dock.appsHere': 'Your apps will appear here.',
  'setup.dock.spacesHere': 'Your spaces will appear here.',
  'setup.dock.example': 'An example. Yours takes shape as you answer.',
  'setup.dock.yours': 'Your Mission Desk',
} satisfies Record<string, Msg>;
