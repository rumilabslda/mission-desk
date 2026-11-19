import { APP_ID, APP_NAME } from '../src/shared/about';
import { bridgeDefaultSocket } from '../src/main/claude/server';

// The data folder and the keychain entry that encrypts sign-ins are named after APP_NAME; changing it signs everyone out.
test('the data folder, keychain and app id use the name Mission Desk', () => {
  expect(APP_NAME).toBe('Mission Desk');
  expect(APP_ID).toBe('pt.rumilabs.missiondesk');
  expect(bridgeDefaultSocket('/Users/x')).toBe('/Users/x/Library/Application Support/Mission Desk/claude.sock');
});
