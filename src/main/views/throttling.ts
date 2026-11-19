/**
 * Chromium slows timers in hidden pages (to once a minute after a while), which
 * delays new-message notifications. These switches keep timers at full speed
 * while hidden pages still report `document.hidden` (so web apps keep sending
 * notifications and never mark chats read that the user hasn't seen).
 * Don't use `backgroundThrottling: false` instead: it makes hidden pages say they are visible.
 */
export const BACKGROUND_SWITCHES = ['disable-background-timer-throttling', 'disable-renderer-backgrounding'];
