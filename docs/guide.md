# Mission Desk user guide

Shortcuts use ⌘ on macOS and Ctrl on Windows and Linux.

## Getting started

The first time you open Mission Desk, a short setup asks three things: whether you'd like an assistant (and connects it), how you'd like to organise your work in spaces, and which apps go in each space. Then each app opens in turn so you can sign in. Each one stays signed in from then on.

You can skip the setup and add apps one by one with the **+** at the bottom of the sidebar, or run the setup again from **Settings → General**. Running it again only adds: a space with the same name as one you have gets the new apps.

## Updates

Mission Desk looks for new versions on GitHub a minute after it starts and every few hours. A new version downloads in the background; when it's ready, a notification says so and a dot appears on **Settings**. It installs when you restart Mission Desk (**Settings → About → Restart to update**), or the next time you quit.

- **Mission Desk → Check for Updates…** looks right away.
- To stop the automatic checks, turn off **Check for updates automatically** in **Settings → About**. Nothing about you or your accounts is sent; GitHub only sees the request for the latest version.
- On Linux, the AppImage updates itself; if you installed the `.deb`, Mission Desk tells you a new version exists and you install it as usual.

## Apps

- Add Google, Microsoft 365, Slack, WhatsApp, Telegram, LinkedIn, Discord, Zoom, Notion, Proton Mail, iCloud Mail, Fastmail or any website from the **+** button. Zoom is its web version (Team Chat, meetings, calendar); a **Join** on a Zoom meeting still opens the Zoom app when it's installed, and otherwise your Zoom account here. Notion opens the pages it links to as tabs, like any website. Proton Mail, iCloud Mail and Fastmail show the Inbox's unread count when their page shows it in its title. Add the same service as many times as you like (two Google accounts, three Slack workspaces).
- Every app is isolated: its own cookies, logins and storage.
- Google apps get Gmail, Calendar, Drive and Meet tabs; Microsoft 365 gets Outlook and Teams. Document links open inside the same account.
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

- It shows the calendars you have ticked in each account's Google Calendar. Untick an account in the left panel to hide it from this view only.
- Each account keeps its own colour. If two accounts share one, the calendar gives the second a different colour.
- **Create:** click an empty time (or drag to choose the length), click an empty day in Month view, or use **+ Create**. Pick the account, add Google Meet, or open **More options** for the calendar, guests, location and description.
- **Change:** drag an event to move it, drag its bottom edge to change its length (with **Undo**), or open it and edit or delete it. Repeating events ask *This event* or *All events*.
- **Invitations:** answer **Yes · No · Maybe** from the event's card. With guests, Mission Desk asks before Google emails them, as Google does.
- Keys: T today, D / W / M for day, week or month, J / K or the arrows for next and previous.

It reads and writes the calendar the same way Google's own Calendar web page does. That method isn't documented by Google, so if Google changes it, an account shows "Couldn't load this calendar" (or a save fails with a link to open it in Google Calendar) until Mission Desk is updated. Everything else keeps working.

## Assistant

The round **+** button floats over your apps. Click it for the quick actions: **New meeting link** (copied for you, with a confirmation beside the button), **New event**, **New to-do** and **Ask the assistant**. Press 1–4 or the arrows and Enter to pick one, Esc to close. ⌘J opens and closes the assistant directly. Drag the button to move it; drag the chat's edges to resize it. With the button turned off, the ⚡ button in the sidebar holds the quick actions.

- **Which assistant:** connect one or more in **Settings → Integrations**: Claude (your own Claude Code and Claude plan), OpenAI Codex (your own Codex CLI and ChatGPT plan) or OpenRouter (GPT, Gemini, Llama, Claude and more, with your own key). Then choose which one each space uses in **Settings → Assistant**.
- **Per space:** by default each space has its own assistant, which sees only that space's apps. "All spaces" sees everything you share, for briefs across your day. Or choose one assistant for everything.
- **What it may read:** nothing until you allow it. Right-click an app → **Claude access** → *Read* or *Read & act*.
- **Acting:** before it clicks or types in an app, Mission Desk asks "Allow Claude to act in *Acme* for 30 minutes?". While it may act, a banner says so, with **Stop** (⌘.). Creating calendar events always asks you first.
- **What it knows:** Home's latest messages and your to-dos, only from its own space's shared apps, so "who's waiting on me?" is quick. It can add a to-do or mark one done when you ask.
- **Memory:** each space keeps its own notes (who is who, projects, how you like to work), and the assistant reads them at the start of every chat. It asks before saving one; see, change or remove them in **Settings → Assistant**. A space's notes, messages and to-dos never reach another space's assistant, and "All spaces" has notes of its own.
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
