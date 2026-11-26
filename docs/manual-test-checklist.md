# Manual test checklist

Run with your real accounts before adopting a new version. Tick each line.

## First-run setup
- [ ] With no accounts, the setup's first screen shows **Language** set to the Mac's. Pick another: the whole app switches and the setup opens again on that screen, in the new language.
- [ ] The first screen asks your name (optional). After finishing, Home says "Good afternoon, <name>" and Settings → General shows it; clearing it there brings back the plain greeting.
- [ ] Pick the Mac's language again: Settings → General → Language shows "Same as the Mac".
- [ ] On a Mac, the first screen also lists **Meetings transcribed on your Mac**.
- [ ] The steps go Welcome → Spaces → Apps → **Assistant** → Ready. The assistant screen lists Claude Code (this Mac), Codex (this Mac), OpenRouter, every connection added in Settings → Integrations, and **Not now**.
- [ ] With two or more new spaces, **Choose an assistant for each space** shows one list per space ("Same as above", any connection, "No assistant"). Ready shows each space's assistant next to its apps.
- [ ] **+ Add another account** opens the same wizard as Settings → Integrations; once connected, the new connection is selected.
- [ ] After finishing, Settings → Assistant shows each space on the connection chosen; a space with "No assistant" is Off and its apps aren't shared with the assistant.
- [ ] With an app with calls (Google, Microsoft 365, Zoom), the assistant screen says the space's assistant can sum up its meetings.
- [ ] Run the setup again (Settings → General) and choose **Not now** with a new space: the spaces you already had keep their assistant.
- [ ] On a Mac, with Google, Microsoft 365 or Zoom chosen, the setup shows **Meetings** after the assistant; with only Slack or WhatsApp it doesn't. **No, thanks** hides the engine; **Choose for each space** sets one space to Always and another to Ask, and Ready shows each one's transcription. After finishing, Settings → Meetings shows the same modes and engine; choosing Parakeet or Whisper starts its download.

## Sign-in and isolation
- [ ] Add two different Google accounts. Both sign in (with 2FA) without "This browser or app may not be secure".
- [ ] Each Google account shows its own inbox. Switching never mixes them.
- [ ] Add a Slack workspace and sign in (including "Sign in with Google" if you use it).
- [ ] Add WhatsApp and scan the QR code.
- [ ] Quit (⌘Q) and reopen: every account is still signed in, same order, same account selected.
- [ ] Passkeys (release build on a Mac with Touch ID): in Gmail, **Manage your Google Account → Security → Create a passkey** asks for Touch ID ("Mission Desk is trying to sign in to google.com with a passkey"). Sign out and back in with **Use your passkey**: Touch ID, no password.
- [ ] The same Google account in another app or space isn't offered that passkey. Two passkeys for one site: Mission Desk asks which account.
- [ ] A Google account whose only passkey is in iCloud Keychain: Google offers **Try another way**, and the password + code sign-in works (nothing hangs).

## Unread counts and notifications
- [ ] Gmail badge matches the Inbox count. Opening "Sent" does not reset the badge.
- [ ] Slack badge appears for unread messages.
- [ ] WhatsApp badge matches the unread chats.
- [ ] Dock badge shows the total.
- [ ] A Slack DM from another device shows "<Account> · Slack". Clicking it opens that conversation.
- [ ] A muted account shows no notifications; its badge still counts.

## Google tabs and links
- [ ] Gmail, Calendar, Drive and Meet tabs work for each Google account.
- [ ] A Docs link in account A's email opens in a tab signed in as A; the same for account B.
- [ ] An external link in an email opens as a tab next to Gmail; ⌘-click opens it in the browser instead.
- [ ] A link in Slack opens as a tab next to Slack (the tab strip appears); closing the last link tab hides the strip.
- [ ] Inside a link tab, clicking around the site stays in the tab; clicking the orange address opens the page in the browser.
- [ ] Settings → General → Open links inside Mission Desk off: links go to the browser as before.
- [ ] Settings → Spaces shows each app's Chrome profile; ⌘-click opens that profile (Automatic and one chosen by hand).
- [ ] The selected tab per account is remembered after a restart.

## Calls
- [ ] Google Meet call with camera and microphone (allow the macOS prompts the first time).
- [ ] Screen sharing in Meet.
- [ ] Leave the Meet tab during a call for more than 10 minutes: the call keeps going.

## Speed and memory
- [ ] Calendar/Drive left unused for 10 minutes reload when selected again, at the same page.
- [ ] "Hibernate when not in use" dims an account after 10 minutes and it reloads when clicked.
- [ ] With all your accounts open, compare Mission Desk's memory with Shift in Activity Monitor.

## Edge cases
- [ ] More than 9 accounts: ⌘1–⌘9 select the first nine, the rest still work by clicking.
- [ ] Remove an account while it is hibernated: no error; adding the same service again asks for login.
- [ ] Remove an account right after adding it (while it is still loading): no error.
- [ ] Turn Wi-Fi off: pages show "Can't reach this page"; turn it back on: they recover by themselves.

## All calendars
- [ ] The calendar button appears at the top of the sidebar only when there is a Google account; ⌘0 opens it.
- [ ] This week's events of every Google account match each account's own Google Calendar.
- [ ] Day, Week and Month views; Today, ‹ › and the keys T, D, W, M, J, K work.
- [ ] An all-day event shows on its day only (not also the next day); a multi-day event spans its days.
- [ ] Unticking an account hides its events; it stays hidden after a restart.
- [ ] Two accounts with the same colour get different colours in the calendar.
- [ ] Clicking an event shows its card; **Open in …** opens the event in that account's Calendar tab; **Join with Google Meet** opens Meet in that account.
- [ ] Selecting any account in the sidebar leaves the calendar; the page appears as before.
- [ ] Sign out of one account (in its own Gmail): the calendar shows "Signed out — open" under it, and the others still load.
- [ ] Wi-Fi off: the last events stay, with "Offline — showing the last update".

## Spaces
- [ ] Dragging an account onto the middle of another asks for a name and creates a space; Cancel changes nothing.
- [ ] Dragging an account to the top or bottom edge of another places it there, inside or outside a space.
- [ ] Right-click an account → Move to space → a space / None / New space… works.
- [ ] Right-click a space → Rename…, Always open, Ungroup work; Ungroup keeps every account.
- [ ] A closed folder shows the unread total of its accounts (muted accounts not counted).
- [ ] The folder of the account on screen stays open; Always open spaces stay open.
- [ ] View → Sidebar style: Folders, Folders with panel and Sections all work and survive a restart.
- [ ] Folders with panel: the panel appears above the page, and closes on choosing an account, Esc, clicking elsewhere, or clicking the folder again.
- [ ] ⌘1–⌘9 count accounts top to bottom, including those inside closed folders.
- [ ] Removing the last account of a space removes the space.

## Shared Google sign-in (spaces)
- [ ] A space with a signed-in Gmail and a Slack: Slack's "Sign in with Google" shows the account chooser, not a password prompt.
- [ ] Signing out of Google in the space's Gmail: Slack's Google sign-in asks for the email again.
- [ ] Moving the Slack out of the space: its Google sign-in asks for the email again; its own Slack session stays.
- [ ] Two Google accounts in one space: "Google sign-in from" switches which one is shared; the other's Gmail stays signed in as itself.
- [ ] "Share Google sign-in" off: the space's apps stop sharing.
- [ ] A WhatsApp in the space keeps working (it's never touched).

## Calendar editing (use a test account)
- [ ] Click an empty time: the quick card opens there for 1 hour; Save creates it in the chosen account.
- [ ] Drag over empty time: the quick card has the dragged length.
- [ ] Month view: clicking an empty day creates an all-day event.
- [ ] + Create → full editor: calendar list shows only calendars you can write to; Meet, location, description, guests.
- [ ] With guests, saving asks "Send invitation emails to guests?".
- [ ] Edit from the card; Meet on/off; changing calendar within the account.
- [ ] Drag to move (across days in Week view) and Undo; drag the bottom edge to resize.
- [ ] Events you don't organise have no Edit/Delete and can't be dragged.
- [ ] Repeating event: This event / All events / This and following (opens Google Calendar).
- [ ] Delete asks first; with guests it asks whether to notify them.
- [ ] Yes / No / Maybe on an invitation updates your answer.
- [ ] Offline: a save shows "You're offline" and nothing changes.

## Meetings (macOS)
- [ ] Settings → Meetings: a space on **Ask**. Join a Meet call in that space's Google account: the bar asks; **Yes** starts it (bar: Transcribing · space · language). **Never in this space** turns the space Off.
- [ ] A space on **Always** starts at once in Meet, Teams (web) and Zoom (web client).
- [ ] The other side stays audible while transcribing; your voice is "Me", theirs "Others".
- [ ] Mute in the call: what you say while muted isn't in the transcript.
- [ ] **Pause** / **Resume** leaves a marked gap; **Stop** ends it and shows "The meeting ended".
- [ ] **Copy notice** pastes the notice (yours if set) into the meeting chat.
- [ ] A second call while one is transcribed asks "Transcribe this one instead?".
- [ ] Reload the meeting page mid-call: it continues the same meeting, no dialog.
- [ ] Quit Mission Desk mid-meeting and reopen: the meeting is there as "Not run"; **Run actions** works.
- [ ] "The meeting ended" → **Run** with the space's assistant: summary, to-dos (and "Waiting on" on Home), a draft that opens in Gmail/Outlook unsent; **Save note** and **Create event** ask first.
- [ ] The meeting shows in its calendar card, on Home and on the meetings page; **View transcript**, **Copy summary**, **Delete** (asks).
- [ ] Ask the space's assistant about the meeting; another space's assistant can't see it.
- [ ] Settings → Meetings: download Whisper and Parakeet (progress, Cancel), **Use** each in a call, **Delete** (asks, frees the space).
- [ ] Apple's language missing (e.g. Portuguese): the bar and Settings offer to download it.
- [ ] Ungroup a space with meetings: Mission Desk asks; Cancel keeps everything.
- [ ] A stand-up where everyone gives an update: "Your to-dos" has only what you took on or were asked to do; "Waiting on" has only what someone agreed to deliver to you; the others' updates are in the summary.
- [ ] Insights: add the memory note "Acme reviews billing in December" to a space with an assistant. In a call in that space, say "o atraso na faturação" (or "the billing delay") a few times over two minutes: within ~30 s a card shows under the bar, with that note as its source.
- [ ] Insights: **Open source** opens the memory window; **Not useful** closes the card, and the meeting page lists the insight marked Not useful.
- [ ] Insights: the card hides after 20 s, but not while the pointer is over it; it never takes the keyboard from the call.
- [ ] Insights: **✦** opens the list; **Pause insights** stops new cards while the transcript continues; **Resume insights** brings them back.
- [ ] Insights: with **Insights during meetings** off for the space there's no ✦; a space with no assistant shows the switch disabled.
- [ ] Insights: a new space with nothing in its memory, meetings, to-dos or messages never shows a card.

## Assistant connections
- [ ] A build from 2026-11-22 with an extra Claude account: after the update the account is in Settings → Integrations with its name, still signed in, and its space still uses it.
- [ ] Integrations → **+ New connection** → Claude Code: the name is filled in ("Claude 2"); sign in in the browser; it shows the account's email and organisation.
- [ ] Same, then **Cancel** while the browser waits: nothing is added.
- [ ] A name another connection has (any case) is refused before signing in.
- [ ] OpenRouter: a wrong key says why and keeps the wizard; a good one adds the connection.
- [ ] Codex (when installed): add a second ChatGPT account; both sign in, each in its own space.
- [ ] Choose a connection in one space's card: that space's assistant answers with it; another space still uses this Mac's.
- [ ] A meeting follow-up in that space runs with that connection.
- [ ] Rename a built-in ("Claude Code (this Mac)" → "Claude pessoal"): the space selects show the new name.
- [ ] Remove a connection a space uses: Mission Desk asks, saying 1 space uses it; that space then says its connection was removed and never answers with another.

