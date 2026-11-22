# Changelog

All notable changes to Mission Desk. Versions follow [Semantic Versioning](https://semver.org). Until 1.0.0 Mission Desk is an early preview: a new minor number (0.2.0) adds features and may change how things work, a patch (0.1.1) fixes bugs. 1.0.0 will be the first version ready for everyone.

## 0.1.2 — 2026-11-22

### Apps
- **Zoom**: add a Zoom account (its web version: Team Chat, meetings, calendar), with its unread count, notifications, camera and microphone for calls, and "Sign in with Google, Microsoft or Apple" or your company's SSO. **Join** on a Zoom meeting opens the Zoom app when it's installed, and otherwise your Zoom account in Mission Desk.

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
