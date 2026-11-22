/** Channels between main and the hidden capture page (#capture). */
export const CAPTURE_IPC = {
  start: 'capture:start',
  stop: 'capture:stop',
  pcm: 'capture:pcm',
  state: 'capture:state',
} as const;
