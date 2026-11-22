import type { Msg } from '../types';

/** Meeting transcription: the bar, the Meeting ended window, the meeting views and Settings → Meetings. */
export const meetings = {
  'meetings.title': 'Meetings',
  'meetings.defaultTitle': '{provider} · {account}',
  'meetings.bar.transcribing': 'Transcribing',
  'meetings.bar.paused': 'Paused',
  'meetings.bar.pause': 'Pause',
  'meetings.bar.resume': 'Resume',
  'meetings.bar.stop': 'Stop',
  'meetings.bar.copyNotice': 'Copy notice',
  'meetings.bar.copied': 'Copied',
  'meetings.bar.language': 'Meeting language',
  'meetings.bar.ask': 'Transcribe this meeting?',
  'meetings.bar.askSwitch': 'Transcribe this one instead?',
  'meetings.bar.yes': 'Yes',
  'meetings.bar.no': 'No',
  'meetings.bar.never': 'Never in this space',
  'meetings.bar.download': 'Download {language} (macOS)',
  'meetings.bar.downloading': 'Downloading {language}… {percent}',
  'meetings.notice.default': 'Note: I’m transcribing this meeting for my own notes.',
  'meetings.notice.fellBack': '{reason} Using Apple’s transcription.',
  'meetings.notice.localeMissing': '{language} isn’t downloaded for Apple’s transcription yet.',
  'meetings.notice.missingMe': 'Your microphone isn’t being transcribed.',
  'meetings.notice.missingCall': 'The other participants aren’t being transcribed.',
  'meetings.notice.probeUnreliable': 'Names and mute can’t be read from this meeting: others show as “Others”.',
  'meetings.notice.failed': 'Transcription stopped: {reason}',
} satisfies Record<string, Msg>;
