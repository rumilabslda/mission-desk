import type { Msg } from '../types';

/** Text the main process shows: the app menu, context menus, native dialogs, notifications, toasts. */
export const main = {
  // The app menu (Mission Desk). {app} is the app's name.
  'main.menu.about': 'About {app}',
  'main.menu.services': 'Services',
  'main.menu.hide': 'Hide {app}',
  'main.menu.hideOthers': 'Hide Others',
  'main.menu.showAll': 'Show All',
  'main.menu.quit': 'Quit {app}',
  'main.menu.checkForUpdates': 'Check for Updates…',
  'main.menu.settings': 'Settings…',
  'main.menu.assistant': 'Assistant',
  'main.menu.connectClaude': 'Connect Claude…',
  // Edit
  'main.menu.edit': 'Edit',
  'main.menu.undo': 'Undo',
  'main.menu.redo': 'Redo',
  'main.menu.cut': 'Cut',
  'main.menu.copy': 'Copy',
  'main.menu.paste': 'Paste',
  'main.menu.pasteAndMatchStyle': 'Paste and Match Style',
  'main.menu.selectAll': 'Select All',
  'main.menu.speech': 'Speech',
  'main.menu.startSpeaking': 'Start Speaking',
  'main.menu.stopSpeaking': 'Stop Speaking',
  // View
  'main.menu.view': 'View',
  'main.menu.reload': 'Reload',
  'main.menu.forward': 'Forward',
  'main.menu.sidebarStyle': 'Sidebar style',
  'main.menu.sidebarFolders': 'Folders',
  'main.menu.sidebarPanel': 'Folders with panel',
  'main.menu.sidebarSections': 'Sections',
  'main.menu.devTools': 'Developer Tools for This Account',
  'main.menu.toggleFullScreen': 'Toggle Full Screen',
  // Accounts
  'main.menu.accounts': 'Accounts',
  'main.menu.home': 'Home',
  'main.menu.allCalendars': 'All Calendars',
  'main.menu.copyMeetLink': 'Copy Meet Link',
  'main.menu.newEvent': 'New Event',
  'main.menu.newTodo': 'New To-do',
  'main.menu.account': 'Account {n}',
  'main.menu.stopClaude': 'Stop Claude',
  // Window
  'main.menu.window': 'Window',
  'main.menu.minimize': 'Minimize',
  'main.menu.zoom': 'Zoom',
  'main.menu.front': 'Bring All to Front',
  // Help
  'main.menu.help': 'Help',
  'main.menu.siteMissionDesk': 'Mission Desk Website',
  'main.menu.siteRumiLabs': 'Rumi Labs Website',

  // An account's right-click menu.
  'main.account.edit': 'Edit…',
  'main.account.muteNotifications': 'Mute notifications',
  'main.account.hibernate': 'Hibernate when not in use',
  'main.account.icon': 'Icon',
  'main.account.claudeAccess': 'Claude access',
  'main.account.accessRead': 'Read',
  'main.account.accessAct': 'Read & act',
  'main.account.moveToSpace': 'Move to space',
  'main.account.newSpace': 'New space…',
  'main.account.moveUp': 'Move Up',
  'main.account.moveDown': 'Move Down',
  'main.account.remove': 'Remove…',
  'main.account.removeTitle': 'Remove {name}?',
  'main.account.removeDetail': 'This signs you out and deletes its data on this Mac.',

  // An account's icon (right-click → Icon).
  'main.icon.sameAs': 'Same as {name}',
  'main.icon.auto': 'Company logo or photo',
  'main.icon.service': 'Service logo',
  'main.icon.letter': 'Letter',
  'main.icon.chooseImage': 'Choose Image…',
  'main.icon.chooseTitle': 'Choose an image for {name}',
  'main.icon.imagesFilter': 'Images',
  'main.icon.openFailed': "That image couldn't be opened.",
  'main.icon.openFailedDetail': 'Try a PNG or JPEG file.',

  // A space's right-click menu, and the + menu.
  'main.space.rename': 'Rename…',
  'main.space.alwaysOpen': 'Always open',
  'main.space.shareGoogle': 'Share Google sign-in',
  'main.space.googleFrom': 'Google sign-in from',
  'main.space.ungroup': 'Ungroup',
  'main.add.app': 'Add App…',
  'main.add.space': 'Add Space…',

  // Quick actions (the ⚡ button's menu).
  'main.quick.title': 'Quick actions',
  'main.quick.titleFor': 'Quick actions · {name}',
  'main.quick.noGoogleInSpace': 'Add a Google account to this space',
  'main.quick.needGoogle': 'Add a Google account first',
  'main.quick.askAssistant': 'Ask the Assistant',

  // Copy Meet Link.
  'main.meet.noLink': 'No meeting link',
  'main.meet.noGoogle': 'This space has no Google account. Add one to make Meet links.',
  'main.meet.creating': 'Creating a meeting link…',
  'main.meet.copied': 'Meeting link copied',
  /** {link}: the link without https://; {keys}: ⌘V or Ctrl+V. */
  'main.meet.copiedDetail': '{link} · {keys} to paste',
  'main.meet.copiedBody': '{url} — paste it with {keys}.',
  'main.meet.errorSignedOut': 'Sign in to Google in this space, then try again.',
  'main.meet.errorOffline': 'Mission Desk is offline. Check your connection and try again.',
  'main.meet.errorForbidden': 'Google refused to create a meeting for this account.',
  'main.meet.errorUnsupported': 'Google could not create a meeting for this account.',
  'main.meet.errorGeneric': 'Google could not create a meeting. Try again in a moment.',
  /** The title of the event Copy Meet Link creates in the user's Google Calendar. */
  'main.meet.quickCallTitle': 'Quick call',

  // The assistant asks before it keeps a note, saves a skill or creates an event. {where}: a space's name.
  'main.assistant.thisSpace': 'this space',
  'main.assistant.rememberTitle': 'Remember this for {where}?',
  'main.assistant.forgetTitle': 'Forget this note in {where}?',
  'main.assistant.rememberDetail':
    '{note}\n\nRequested by the assistant. Only the assistant of {where} will see it. You can see and change every note in Settings → Assistant.',
  'main.assistant.forgetDetail': '{note}\n\nRequested by the assistant. You can see and change every note in Settings → Assistant.',
  'main.assistant.remember': 'Remember',
  'main.assistant.forget': 'Forget',
  'main.assistant.saveSkillTitle': 'Save the skill "{name}" for {where}?',
  'main.assistant.saveSkillDetailAlways':
    'Always on: {description}\n\n{instructions}\n\nWritten by the assistant. It will be on only in {where}; you can change or remove it in Settings → Skills.',
  'main.assistant.saveSkillDetailFits':
    'Used when it fits: {description}\n\n{instructions}\n\nWritten by the assistant. It will be on only in {where}; you can change or remove it in Settings → Skills.',
  'main.assistant.createEventTitle': 'Create this event?',
  'main.assistant.createEventDetail': '{event}\n\nRequested by the assistant. Check the guests and description before creating.',
  'main.assistant.emailGuests': 'Email invitations to the guests',

  // The assistant's scopes in per-space mode use common.allSpaces / common.noSpace.
  'main.scope.everything': 'Everything',

  // Claude acting in an account.
  'main.claude.consentTitle': 'Allow Claude to act in {name} for 30 minutes?',
  'main.claude.consentDetail': 'Claude will be able to click and type in this account. Stop it any time with the Stop button or ⌘.',
  'main.claude.allow': 'Allow',
  'main.claude.deny': 'Deny',
  'main.claude.socketError': 'Could not open the connection: {error}',

  // Adding a skill by link (Settings → Skills).
  'main.skills.fetchBadLink': 'Use an https link to a SKILL.md file (a GitHub link to the file or its folder works too).',
  'main.skills.fetchNotFound': 'No SKILL.md at that link.',
  'main.skills.fetchStatus': 'The link answered {status}.',
  'main.skills.fetchNotHttps': 'The link moved to an address that isn’t https.',
  'main.skills.fetchWebPage': 'That’s a web page, not a SKILL.md file. Link to the file itself.',
  'main.skills.fetchTooBig': 'That file is too big for a skill.',
  'main.skills.fetchNotText': 'That isn’t a text file.',
  'main.skills.fetchEmpty': 'That file is empty.',
  'main.skills.fetchTooLong': 'That skill is longer than Mission Desk allows ({max} characters).',
  'main.skills.fetchFailed': 'Couldn’t fetch that link. Check the address and your connection.',
  'main.skills.fetchNotAllowed': 'Not allowed.',
  'main.openRouter.badKey': 'That doesn’t look like an OpenRouter key.',

  // Updates.
  'main.updates.readyTitle': 'Mission Desk {version} is ready',
  'main.updates.readyBody': 'Restart Mission Desk to finish, or it installs the next time you quit.',
  'main.updates.checkFailed': 'Couldn’t reach GitHub to check. Check your connection and try again.',
  'main.updates.checkFailedOther': 'Couldn’t check for a new version right now. Try again later.',
  'main.updates.downloadFailed': 'The update couldn’t be downloaded. Try again in a moment.',
  'main.updates.installFailed': 'The update couldn’t be installed. Download the new version from the website instead.',

  // Other windows and pages.
  'main.popup.signIn': 'Sign in',
  'main.errorPage.title': 'Offline',
  'main.errorPage.message': "Can't reach this page. Check your connection.",
  'main.errorPage.retry': 'Retry',
  'main.store.loadWarning': 'Your saved accounts could not be read, so Mission Desk started empty. A copy was kept as accounts.json.bak.',
  'main.calendar.noTitle': '(No title)',

  // About. {site}: the website without https://; {license}: the license's name (kept in English).
  'main.about.credits': '{site}\n{license}. Free and open source.',
  'main.about.licenseSummary':
    'Free and open source. Anyone, people and companies alike, may use it for anything, including work, and change and share it. Whoever shares Mission Desk or a changed version must share its source code under the same license, so it can never become a closed product.',
} satisfies Record<string, Msg>;
