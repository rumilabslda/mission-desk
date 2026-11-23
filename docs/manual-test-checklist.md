# Manual test checklist

Run with your real accounts before adopting a new version. Tick each line.

## First-run setup
- [ ] With no accounts, the setup's first screen shows **Language** set to the Mac's. Pick another: the whole app switches and the setup opens again on that screen, in the new language.
- [ ] Pick the Mac's language again: Settings → General → Language shows "Same as the Mac".

## Sign-in and isolation
- [ ] Add two different Google accounts. Both sign in (with 2FA) without "This browser or app may not be secure".
- [ ] Each Google account shows its own inbox. Switching never mixes them.
- [ ] Add a Slack workspace and sign in (including "Sign in with Google" if you use it).
- [ ] Add WhatsApp and scan the QR code.
- [ ] Quit (⌘Q) and reopen: every account is still signed in, same order, same account selected.

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
- [ ] An external link in an email opens in the default browser.
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

## Claude accounts
- [ ] Settings → Assistant → **Add a Claude account**: name it, sign in in the browser; it shows the account's email and organisation.
- [ ] Choose it in one space's card: that space's assistant answers with it; another space still uses this Mac's account.
- [ ] A meeting follow-up in that space runs with that account.
- [ ] Sign the account out (or remove it): its space asks to sign in / to choose an account; it never answers with the personal account.

