# Mission Desk user guide

Shortcuts use ⌘ on macOS and Ctrl on Windows and Linux.

## Getting started

The first time you open Mission Desk, a short setup starts by showing the language it's in (your Mac's): change it there and everything switches before you go on. It also asks your name (optional; change it later in **Settings → General**): Home greets you with it, and the assistant and your meetings know which person is you. Then it asks: how you'd like to organise your work in spaces, which apps go in each space, whether you'd like an assistant and, on a Mac with an app that has calls, whether to transcribe your meetings. The assistant can be the Claude Code or Codex already on your Mac, OpenRouter, or any connection from **Settings → Integrations** (**+ Add another account** creates one right there). One assistant serves every space, or choose one for each space ("Claude Acme" for work, your own Claude at home, none in another). The meetings step offers **Ask at each meeting** (the default), **Always, without asking** or **No, thanks**, for every space or each its own; the transcription engine (Apple's, or Parakeet or Whisper, downloaded after the setup); and insights during meetings. Then each app opens in turn so you can sign in. Each one stays signed in from then on.

You can skip the setup and add apps one by one with the **+** at the bottom of the sidebar, or run the setup again from **Settings → General**. Running it again only adds: a space with the same name as one you have gets the new apps, and the spaces you already have keep their assistant.

### Language

Mission Desk's menus, buttons and messages come in English, Português (Portugal), Português (Brasil), Español, Français, Deutsch, Italiano and Nederlands. It follows your Mac's language (the first one in **System Settings → General → Language & Region** that Mission Desk has, otherwise English). To pick another, use the language on the setup's first screen, or later **Settings → General → Language**: Mission Desk switches at once. Dates and times follow the language, written the way your Mac's region writes them. Your apps (Gmail, Slack…) keep the language of their own account settings, and the assistant answers in the language you write to it in.

## Updates

Mission Desk looks for new versions on GitHub a minute after it starts and every few hours. A new version downloads in the background; when it's ready, a notification says so and a dot appears on **Settings**. It installs when you restart Mission Desk (**Settings → About → Restart to update**), or the next time you quit.

- **Mission Desk → Check for Updates…** looks right away.
- To stop the automatic checks, turn off **Check for updates automatically** in **Settings → About**. Nothing about you or your accounts is sent; GitHub only sees the request for the latest version.
- On Linux, the AppImage updates itself; if you installed the `.deb`, Mission Desk tells you a new version exists and you install it as usual.

## Apps

- Add Google, Microsoft 365, Slack, WhatsApp, Telegram, LinkedIn, Discord, Zoom, Notion, Proton Mail, iCloud Mail, Fastmail or any website from the **+** button. Zoom is its web version (Team Chat, meetings, calendar); a **Join** on a Zoom meeting still opens the Zoom app when it's installed, and otherwise your Zoom account here (only one in the same space; otherwise your browser). Notion opens the pages it links to as tabs, like any website. Proton Mail, iCloud Mail and Fastmail show the Inbox's unread count when their page shows it in its title. Add the same service as many times as you like (two Google accounts, three Slack workspaces).
- Every app is isolated: its own cookies, logins and storage.
- Google apps get Gmail, Calendar, Drive and Meet tabs; Microsoft 365 gets Outlook and Teams. Document links open inside the same account.
- **Links open inside Mission Desk.** A link to another website (from Slack, an email, a chat) opens as a tab next to the app it came from, signed in as that app. Inside the tab you can browse as in a browser; the orange address at the top right shows which site it is, and clicking it opens the page in your browser. Close the tab with its ×. **⌘-click** (Ctrl-click on Windows and Linux) or a middle click opens the link in your browser instead. Turn it off in **Settings → General → Open links inside Mission Desk**.
- Right-click an app to rename, recolour, mute, reload or remove it, or to choose what the assistant may do in it.
- Pages you haven't used for 10 minutes go to sleep. Apps you rarely use can sleep completely ("Hibernate when not in use").
- ⌘1–⌘9 switch apps, ⌘R reloads, ⌘[ and ⌘] go back and forward.

## Spaces

Group apps by company, project or part of your life (for example Personal, Acme, Side project), so the sidebar stays short as it grows.

- **Create a space:** drag one app onto the middle of another, then name the space. Or right-click an app → **Move to space → New space…**, or use **+ → Add space**.
- **Move apps:** drag an app into a space, or next to another app inside or outside a space. You can also right-click it → **Move to space**.
- **Right-click a space:** **Rename…**, **Always open**, or **Ungroup**. Ungroup only removes the grouping; no app is deleted.
- **Choose the style** in **Settings → General** (or **View → Sidebar style**):
  - **Folders:** a closed space shows small icons of its apps and their unread total; click it to open it in place.
  - **Folders with panel:** clicking a space shows its apps, with their names, in a panel next to the sidebar.
  - **Sections:** every space is always open, with its name above it.
- ⌘1–⌘9 count the apps from top to bottom, including those inside closed spaces.

### Which Chrome profile links open in

If you use several Chrome profiles (one per company, one personal), Mission Desk sends each space's browser links to the right one. On **Automatic** (the default), a Gmail account's links go to the Chrome profile signed in to the same address, or to one at the same company; the space's other apps (Slack, WhatsApp…) follow its Gmail account, and a website app follows its own domain. Or choose the profile yourself in **Settings → Spaces → Browser links open in**. Settings shows where each app's links go. Gmail's address is known once the account has loaded since Mission Desk started; until then, and when nothing matches, links open in your default browser. On a Mac only; elsewhere links use the default browser.

### Passkeys

On a Mac with Touch ID, an app can sign in with a passkey instead of a password. Mission Desk keeps its own passkeys: add one from inside the app (in Google, **Manage your Google Account → Security → Passkeys → Create a passkey**), and the next sign-in is a touch of the finger.

- Each app keeps its own passkeys, like its sign-in: a passkey made in one Gmail account isn't offered in another.
- They stay on this Mac. The passkeys in your iPhone, iCloud Keychain or Safari can't be used in Mission Desk: Apple lets only web browsers use them. Sign in with the password and code instead, or open the page in your browser.
- With several passkeys for one site, Mission Desk asks which account to use.

### Shared Google sign-in

A space signs in to Google once for all its apps. When Gmail in the space is signed in, the space's Slack (and any app that offers "Sign in with Google") finds Google already signed in, so it's one click, with no password or phone.

- Only Google's sign-in cookies are shared, and only between apps in the same space. Each app keeps its own session, and WhatsApp is never touched.
- With two Google accounts in a space, right-click the space → **Google sign-in from** to choose which one is shared.
- Moving an app out of a space removes the shared Google sign-in from it, so spaces stay separate.
- To turn it off for a space: right-click it → **Share Google sign-in**.

## Home

The house at the top of the sidebar (⌘T). Mission Desk opens on Home unless you turn that off in **Settings → General**.

- **Agenda:** what's next today across your Google calendars, with **Join** for Meet, Teams, Zoom and other calls. Below it, **Next hours** shows the meetings from half an hour ago to four hours ahead on a time scale, with a line for now and the free time between them. **Earlier today** and **more later today** stretch it to the whole day.
- **Messages:** the latest chat or email of each conversation, from every app, as they arrive. Click a line to open that conversation. A line goes when you read it in the app, when the app's unread count drops, or when you clear it. Apps with unread messages but no line are shown below as "Also unread".
  - Messages come from the apps' own notifications. Gmail and Outlook only send them if desktop notifications are on in their own settings.
  - Nothing is saved: the list clears when Mission Desk quits. To hide the text and see only who wrote, turn off **Show message previews on Home** in **Settings → General**.
- **To-do:** a simple list for today, each item optionally tagged with a space or an app.
- **✦ Brief me** (when the assistant may read your apps): a summary of your day.

## All calendars

The calendar button at the top of the sidebar (⌘0) shows the events of all your Google accounts together and lets you work with them there. There is nothing to set up: it uses the sign-in each account already has in Mission Desk.

- It shows the calendars you have ticked in each account's Google Calendar. Untick an account in the left panel, or turn off **Show in All calendars** in its space's card (Settings → Spaces), to hide it from this view only.
- Each account keeps its own colour. If two accounts share one, the calendar gives the second a different colour.
- **Create:** click an empty time (or drag to choose the length), click an empty day in Month view, or use **+ Create**. Pick the account, add Google Meet, or open **More options** for the calendar, guests, location and description.
- **Change:** drag an event to move it, drag its bottom edge to change its length (with **Undo**), or open it and edit or delete it. Repeating events ask *This event* or *All events*.
- **Invitations:** answer **Yes · No · Maybe** from the event's card. With guests, Mission Desk asks before Google emails them, as Google does.
- Keys: T today, D / W / M for day, week or month, J / K or the arrows for next and previous.

It reads and writes the calendar the same way Google's own Calendar web page does. That method isn't documented by Google, so if Google changes it, an account shows "Couldn't load this calendar" (or a save fails with a link to open it in Google Calendar) until Mission Desk is updated. Everything else keeps working.

## Meetings

Mission Desk can transcribe the meetings you join in **Google Meet**, **Microsoft Teams** and **Zoom** inside it (not their Mac apps), on this Mac. The audio is never recorded or sent anywhere: it is turned into text as the meeting goes, and only the text is kept, in the meeting's space.

- **When it transcribes:** each space chooses in **Settings → Meetings**: **Always**, **Ask** (a bar over the meeting asks "Transcribe this meeting?", with **Never in this space**) or **Off**. New spaces ask.
- **The bar:** while it transcribes, a bar over the meeting shows the space, the meeting's language (change it there), **Pause**, **Stop** and **Copy notice**. In the EU you must tell participants when a meeting is transcribed: **Copy notice** copies a short sentence (yours, set in Settings → Meetings) to paste in the meeting chat. Nothing is transcribed while the bar isn't there.
- **Who said what:** your microphone is "Me"; the other side is "Others" (names from the meeting page are coming). While you're muted in the call, your microphone isn't transcribed.
- **Engines:** Apple's (macOS 26; nothing to download, fast, light on the battery), **Whisper large-v3 turbo** (1.6 GB, the most accurate) and **Parakeet v3** (0.5 GB, very fast). Download, use or delete them in Settings → Meetings; every file is checked before it's used. Apple's languages are downloaded by macOS (the same page, or the bar, offers it when one is missing).
- **When the meeting ends:** "The meeting ended" lists what the space's assistant can do: the **summary**, **your to-dos**, **waiting on** (what others owe you, with who), a **follow-up e-mail draft**, **notes** for the space's memory and a **follow-up event**. Your choice is remembered for the space. **Your to-dos** are only concrete actions you took on or were asked to do (by your name or as "you"), not status updates or other people's work; **waiting on** is only what someone agreed to deliver to you. Everyone's own updates in a stand-up go to the summary. Notes and events are proposals you confirm; the draft opens as a new message in the space's Gmail or Outlook and is never sent by Mission Desk. The transcript goes to the assistant with no tools at all: whatever someone says in a meeting, it can only write text.
- **Insights during the meeting:** while a meeting is transcribed, the space's assistant looks at the last few minutes every couple of minutes and, only when it's clearly worth it, shows a short card under the bar. There are three kinds: a **link to the past** (it was discussed or decided before), an **open commitment** (a to-do or "waiting on" about who or what is being discussed) and a **contradiction** (it goes against something decided before). Each card shows the real text of its source (a memory note, a past meeting, a to-do or a recent message from the space's shared apps), often with a question worth asking, and **Open source** and **Not useful**. The card hides after 20 seconds, or stays while the pointer is over it. **✦** on the bar opens every insight of the meeting, with **Pause insights**. Insights are on when the space has an assistant; turn them off per space in Settings → Meetings. They use only the space's own knowledge, and the last minutes of transcript go only to the space's assistant connection, with no tools, so nothing said can make it act. They're kept with the meeting and deleted with its transcript.
- **Later:** a meeting shows in its calendar event's card, on Home under **Meetings today**, and on the meetings page (Home → **See all**), with its summary, to-dos, draft, transcript and **Run actions** for what hasn't run. The space's assistant can read its own meetings, never another space's; "All spaces" only reads meetings outside spaces.
- **Deleting:** delete a meeting from its card. Removing or ungrouping a space deletes its meetings (Mission Desk asks first). **Delete transcripts after 30 or 90 days** keeps the summaries and to-dos and removes the full text.
- Short calls (under a minute) and calls with nothing said are dropped. A meeting interrupted by quitting Mission Desk keeps its text and can be run later.

## Assistant

The round **+** button floats over your apps. Click it for the quick actions: **New meeting link** (copied for you, with a confirmation beside the button), **New event**, **New to-do** and **Ask the assistant**. Press 1–4 or the arrows and Enter to pick one, Esc to close. ⌘J opens and closes the assistant directly. Drag the button to move it; drag the chat's edges to resize it. With the button turned off, the ⚡ button in the sidebar holds the quick actions.

- **Which assistant:** set up one or more connections in **Settings → Integrations**: Claude Code (your own Claude Code and Claude plan), Codex (your own Codex CLI and ChatGPT plan) or OpenRouter (GPT, Gemini, Llama, Claude and more, with your own key). Then choose which connection each space uses in **Settings → Assistant**.
- **Per space:** by default each space has its own assistant, which sees only that space's apps. "All spaces" sees everything you share, for briefs across your day. Or choose one assistant for everything.
- **What it may read:** nothing until you allow it. Right-click an app → **Claude access** → *Read* or *Read & act*.
- **Acting:** before it clicks or types in an app, Mission Desk asks "Allow Claude to act in *Acme* for 30 minutes?". While it may act, a banner says so, with **Stop** (⌘.). Creating calendar events always asks you first.
- **What it knows:** Home's latest messages and your to-dos, only from its own space's shared apps, so "who's waiting on me?" is quick. It can add a to-do or mark one done when you ask.
- **Memory:** each space keeps its own notes (who is who, projects, how you like to work), and the assistant reads them at the start of every chat. It asks before saving one; see, change or remove them in **Settings → Assistant**. A space's notes, messages and to-dos never reach another space's assistant, and "All spaces" has notes of its own.
- **Skills:** instructions the assistant follows, in **Settings → Skills**. *Always on* skills shape everything it writes (Humanizer makes it sound like a person); *When it fits* skills are loaded when a request matches (a proposal, a follow-up). Add one from the catalogue, import a SKILL.md from a link (a GitHub link to the file or its folder works), or write your own. Each is on only in the spaces you pick. Skills are text only: nothing in them runs, and they can't change what the assistant may do. Type `/` in the chat to use one on purpose.
- Conversations are saved on your computer, per space. **New chat** starts a fresh one; the history list reopens or deletes old ones.
- Quick commands in the chat: `/brief`, `/waiting`, `/prep`, `/schedule`, `/reply`, `/summarize`, `/catchup`.

### Connect Claude Code or Claude Desktop

Claude Code or Claude Desktop on the same computer can also read and work in your apps directly.

1. **Mission Desk → Connect Claude…**: turn on **Allow Claude to connect**, and copy the command (Claude Code) or the JSON (Claude Desktop).
2. Give each app the access you want, as above.

Tools: `list_accounts`, `read_page`, `get_elements`, `screenshot`, `open_url`, `click`, `type`, `press`.

Safety:

- **Off by default, three times over:** the master switch, each app's access, and a live "Allow Claude to act in *X* for 30 minutes?" before any click or typing.
- **Local only:** a private socket in Mission Desk's data folder (a private named pipe on Windows). There is no network port.
- **Page content is marked untrusted** for Claude. `open_url` only opens pages of the app's own service. `claude-activity.log` records tool calls, never page text or typed text.

### Memory

Each space's assistant has its own memory: short notes about the client, the people and how you like to work, read at the start of every chat. The assistant offers to save a note (you confirm), a meeting's follow-up can propose some, and you can write your own. Open a space's memory with the 🧠 button in the assistant panel, **Memory…** on the space's right-click menu, or Settings → Assistant: search, click a note to edit it, 🗑 to delete it, or add one at the bottom (40 per space). Only that space's assistant ever sees them.

### Assistant connections

A connection is one sign-in or key with a name you choose: your own Claude Code, a client's Claude account, a ChatGPT account for Codex, an OpenRouter key. Add as many as you need in **Settings → Integrations → + New connection**: choose the type, give it a name (for example "Claude Acme"), then sign in in the browser that opens, or paste the OpenRouter key. If the program isn't installed yet, the wizard shows the command to install it. A connection that doesn't finish connecting isn't kept.

What this Mac already has shows up on its own: **Claude Code (this Mac)**, **Codex (this Mac)** when Codex is installed, and **OpenRouter** when you saved a key in setup. You can rename them, not remove them.

In **Settings → Assistant**, each space's card has one **Assistant** choice: every connection by name, grouped by type, then Off. Everything that space's assistant does (chats, meeting follow-ups) uses that connection. Each Claude Code or Codex connection keeps its own sign-in, settings and conversations, apart from the others; an added one doesn't load your personal CLAUDE.md, hooks or plugins. Removing a connection (Integrations, **Remove**) asks first and says how many spaces use it, then signs it out on this Mac and deletes its conversations or its key; spaces that used it stop until you choose another connection (they never fall back to another one).
