import type { Msg } from '../types';

/** Meeting transcription: the bar, the Meeting ended window, the meeting views and Settings → Meetings. */
export const meetings = {
  'meetings.title': 'Meetings',
  'meetings.defaultTitle': '{provider} · {account}',
  'meetings.notice.fellBack': '{reason} Using Apple’s transcription.',
  'meetings.notice.localeMissing': '{language} isn’t downloaded for Apple’s transcription yet.',
  'meetings.notice.missingMe': 'Your microphone isn’t being transcribed.',
  'meetings.notice.missingCall': 'The other participants aren’t being transcribed.',
  'meetings.notice.probeUnreliable': 'Names and mute can’t be read from this meeting: others show as “Others”.',
  'meetings.notice.failed': 'Transcription stopped: {reason}',
} satisfies Record<string, Msg>;
