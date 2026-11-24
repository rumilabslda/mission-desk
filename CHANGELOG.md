# Changelog

All notable changes to Mission Desk. Versions follow [Semantic Versioning](https://semver.org). Until 1.0.0 Mission Desk is an early preview: a new minor number (0.2.0) adds features and may change how things work, a patch (0.1.1) fixes bugs. 1.0.0 will be the first version ready for everyone.

## 0.2.1 — 2026-11-24

### Fixes
- **Insights during the meeting:** pausing the transcription also stops an insight that was being prepared, so nothing new appears while paused.
- **Not useful** dims the insight in the bar's list at once.
- In a short meeting window, a long insight card scrolls instead of being cut off, so **Open source** and **Not useful** are always within reach.
- Insights do less work during a call: past meeting summaries are kept in memory, and only the last minutes of conversation are kept for them.
- Without a name set in Settings, transcripts and the assistant call you in your language ("Eu", "Yo", "Moi"…) instead of "Me".

## 0.2.0 — 2026-11-24

### Languages
- Mission Desk now speaks **English, Português (Portugal), Português (Brasil), Español, Français, Deutsch, Italiano and Nederlands**: menus, dialogs, notifications, the setup, Settings, Home, the calendar and the assistant. It follows your Mac's language; pick another in **Settings → General → Language** and it switches at once, no restart.
- Dates and times follow the language, with your Mac's region (English on a Mac set to Portugal keeps 24-hour times).
- Your apps keep their own language, and the assistant still answers in the language you write in.

### Setup
- **Your name:** the setup's first screen asks it (optional), and Settings → General keeps it. Home greets you with it ("Good afternoon, Ana"), and the assistant and meetings know which person is you.
- **Language first:** the setup's first screen shows the language Mission Desk is in (your Mac's) and lets you change it before going on; everything switches at once.
- **The assistant comes after your apps**, so it's chosen for the spaces you just made: Welcome, Spaces, Apps, Assistant, Ready.
- **Assistant connections in the setup:** pick the Claude Code or Codex on this Mac, OpenRouter, or any connection from Settings → Integrations, or add one with **+ Add another account**. One for every space, or **Choose an assistant for each space**. The permission to read the apps is asked there too.
- **Meetings in the setup:** on a Mac, when an app has calls, the setup asks whether to transcribe meetings: **Ask at each meeting** (the default), **Always** or **No, thanks**, for every space or each its own, which engine (Apple's, Parakeet or Whisper, downloaded after the setup), and insights during meetings.
- **Ready shows each space's assistant** (and its transcription) next to its apps.
- **Meetings on the first screen:** "Meetings transcribed on your Mac" joins the highlights; when your apps include calls, the assistant screen says the space's assistant can sum them up.
- Running the setup again no longer changes the assistant of the spaces you already have (choosing **Not now** used to turn it off for spaces without their own choice).

### Apps
- **Notion**: one Notion account with all its workspaces. Pages it opens become tabs, "Sign in with Google, Apple, Microsoft or ChatGPT" and your company's SSO stay in the account, the microphone works for AI Meeting Notes, and unread Inbox notifications show on its badge.
- **Proton Mail**, **iCloud Mail** and **Fastmail**: email beyond Google and Microsoft, each with the Inbox's unread count when its page shows it. Links in emails open in your browser.
- **Zoom**: add a Zoom account (its web version: Team Chat, meetings, calendar), with its unread count, notifications, camera and microphone for calls, and "Sign in with Google, Microsoft or Apple" or your company's SSO. **Join** on a Zoom meeting opens the Zoom app when it's installed, and otherwise your Zoom account in Mission Desk.

### Settings
- **Accounts is now Apps**, right after Spaces: General, Spaces, Apps, then the rest.
- **Calendar is now part of Spaces:** each space's card says whether its Google accounts show in All calendars, and the Google accounts outside spaces have their own card at the end. The separate Calendar section is gone.

### Assistant
- **Memory window:** the 🧠 button in the assistant panel (and **Memory…** on a space's menu, and Settings → Assistant) opens that space's memory: search, edit in place, delete (it asks on the line) and add notes. One space at a time.
- **Assistant connections, as many as you need:** Settings → Integrations lists every assistant connection by a name you choose ("Claude pessoal", "Claude Acme", "OpenRouter cliente X"). **+ New connection** asks the type (Claude Code, Codex or OpenRouter), a name, and connects it: the browser sign-in, or the OpenRouter key. Rename, sign in again or remove each one there. Each Claude Code or Codex connection keeps its own sign-in, settings and conversations, and an added one doesn't load your personal CLAUDE.md, hooks or plugins; each OpenRouter connection has its own key.
- **Each space picks its connection by name** in Settings → Assistant, meetings' follow-ups included. A space whose connection was removed stops; it never switches to another connection on its own. Yesterday's extra Claude accounts become connections, with their sign-in and spaces kept.
- It now sees Home's latest messages and your to-dos (only from its own space's shared apps), so "who's waiting on me?" is answered at once; it can add a to-do or mark one done when you ask.
- **Memory per space:** notes about the client, the people and how you like to work, read at the start of every chat. The assistant asks before saving one; see and edit them in Settings → Assistant. One space's notes, messages and to-dos never reach another space's assistant (and "All spaces" has its own notes).
- **Skills:** instructions the assistant follows, either always (style and tone, like **Humanizer**) or when a request fits (a proposal, a follow-up, a meeting recap). Add them from Mission Desk's catalogue, import a SKILL.md from a link (GitHub links work), or write your own; the assistant can offer to save one too, and asks first. Each skill is on only in the spaces you choose. Type `/` in the chat to use one on purpose. Settings → Skills.
- `/brief` and `/waiting` start from Home's messages and your to-dos, so they answer faster.

### Meetings
- **The other side stays audible while transcribing:** recording a meeting took its sound away from your speakers (Chromium sends a captured tab's audio only to the recording). The call is now played back to you at full quality while it's transcribed.
- **Transcription on your Mac** for the meetings you join in Google Meet, Microsoft Teams and Zoom inside Mission Desk. Each space chooses **Always**, **Ask** or **Off** (Settings → Meetings). A bar over the meeting shows it's transcribing, with Pause, Stop, the meeting's language and **Copy notice** to tell the participants. The audio is never stored or sent anywhere: only the text is kept, in the meeting's space.
- **Three engines**, all on the Mac: Apple's (macOS 26, nothing to download), **Whisper large-v3 turbo** (the most accurate) and **Parakeet v3** (very fast), downloaded with one click in Settings → Meetings, checked file by file, and deleted when you ask.
- **When a meeting ends**, choose what the space's assistant does: the summary, your to-dos, what others owe you ("Waiting on"), a follow-up e-mail draft (opened in your Gmail or Outlook, never sent), notes for the space's memory and a follow-up event (both as proposals). The transcript goes to the assistant with no tools, so nothing said in a meeting can make it act.
- **Find them later** in the calendar event's card, on Home ("Meetings today") and on the new meetings page. Each space's assistant can read its own meetings ("what did we decide with Acme about pricing?"), never another space's.
- Removing a space deletes its meetings (Mission Desk asks first). Transcripts can be deleted after 30 or 90 days, keeping the summaries.
- **To-dos only for you:** after a meeting, "Your to-dos" keeps only concrete actions you took on or were asked to do, and "Waiting on" only what someone agreed to deliver to you. Status updates and everyone's own work in a stand-up go to the summary instead of your to-do list.
- **Insights during the meeting:** the space's assistant looks at the last minutes every couple of minutes and, only when it's clearly useful, shows a card under the bar: a link to the past, an open commitment or a contradiction, with the real text of its source (memory, past meetings, to-dos or recent messages of that space) and a question worth asking. **Open source**, **Not useful**, and **✦** on the bar for the list and **Pause insights**. On when the space has an assistant; off per space in Settings → Meetings. Each insight is checked before it shows (its source exists, its quote was really said, it doesn't repeat), and nothing said in the meeting can make the assistant act.

### Fixes
- An app no longer goes blank when one of its pages closes itself (as some sign-in pages do when they finish): the page comes back where it was, and a tab that closes itself closes like a browser tab.
- With the assistant's model on **Default**, a model your Claude Code can't use now says so and how to fix it, instead of only "Something went wrong".
- A chat message starting with `/` that isn't a command was dropped without an answer; it's now sent as you wrote it.

### Security
- The assistant opens only Gmail, Calendar, Drive, Meet, Chat and Docs pages in a Google account (not Forms, Sites or Translate, where text it was tricked into writing could leave the account), a link with parameters counts as acting (Read & act, and your OK), and a page it opened can never redirect to your browser.
- "Never sends" is stricter: Send buttons in other languages, Schedule send, buttons with no name, and Space on a focused button are all refused.
- A blank sign-in popup opens only from the app's own page, never from something embedded in it, and its title shows who opened it.
- Notion's company SSO is followed only when it starts on Notion's sign-in page.
- **Join** on a Zoom meeting never uses another space's Zoom account; without one in the same space it opens in your browser.

### Other
- The svg-logos credit is gone from the README and Settings → About.

## 0.1.1 — 2026-11-21

### Quick actions
- The floating button is now a **+** for the quick actions: the page dims and **New meeting link**, **New event**, **New to-do** and **Ask the assistant** fan out from it (keys 1–4, arrows and Enter, Esc). ⌘J still opens the assistant directly. The sidebar's ⚡ button shows only when the floating button is turned off.
- **New meeting link** shows its progress beside the button, then "Meeting link copied" with the link, ready to paste. Adding a to-do or saving an event is confirmed there too.
- New to-do and New event pop-ups: a to-do picks its space with one click; an event has quick lengths (15 min to 2 h), All day, Google Meet and guests up front, with the calendar, place and notes under **More options**.

### Home
- The agenda shows **Next hours** on a time scale, from half an hour ago to four hours ahead, with a line for now and the free time between meetings. It stretches to the whole day on request.

### Fixes
- Repeating events: **This event** was missing from the Delete, Move and Edit questions (its button was white on white), so a single occurrence couldn't be changed on its own.

### Look
- A new app icon.

## 0.1.0 — 2026-11-19

The first version: an early preview, not yet a beta. (While it was being built, the app was called Weavedock.)

Free and open source under the GNU General Public License v3.0 or later (GPL-3.0-or-later). Website: [missiondesk.rumilabs.pt](https://missiondesk.rumilabs.pt).

### Apps, side by side
- Google (Gmail, Calendar, Drive, Meet), Microsoft 365 (Outlook, Teams), Slack, WhatsApp, Telegram, LinkedIn, Discord and any website, each signed in on its own, as many accounts as you like.
- Spaces group apps by company, project or part of your life, shown as folders, folders with a panel, or sections. A space can share one Google sign-in between its apps.
- Unread badges per app, per space and on the Dock icon; native notifications labelled with the app's name; mute any app.
- Low memory use: pages you don't use go to sleep.

### Home
- Your day at a glance: the agenda with what's next and one click to join a call (Meet, Teams, Zoom and more), your to-dos, and Messages, the latest chat or email of each conversation from every app.
- "Brief me" asks the assistant for a summary of your day.

### Calendar
- Every Google account's calendar in one Day, Week or Month view. Create, move, resize and delete events, answer invitations, and add Google Meet.

### Assistant
- A floating assistant you can move and resize, one per space (or one for everything), with saved conversations.
- Runs on your own Claude Code, OpenAI Codex or OpenRouter key. It reads only the apps you share with it, and asks before it acts.
- Claude Code and Claude Desktop can also connect to Mission Desk directly (Connect Claude).

### Setup
- A first-run setup: choose an assistant, create your spaces and pick the apps for each one. Run it again any time from Settings → General.

### Updates
- Mission Desk updates itself from its GitHub releases: it downloads a new version in the background and installs it when you restart (Settings → About, or the dot on Settings). A Linux .deb says a new version exists instead. Automatic checks can be turned off.

### Platforms
- macOS (Apple silicon and Intel): signed and notarized.
- Windows and Linux: first builds, less tested than macOS. Please report what doesn't work.
