import { defaultSocketPath } from '../src/main/claude/server';
import { cliLookup, claudeCandidates, lookupResult } from '../src/main/platform';
import { appMenuItems } from '../src/main/menu/app-menu-items';

describe('Windows and Linux', () => {
  test('Windows has no Unix sockets: a private named pipe instead, stable per data folder', () => {
    const p = defaultSocketPath('C:\\Users\\x\\AppData\\Roaming\\Mission Desk', 'claude.sock', 'win32');
    expect(p).toMatch(/^\\\\\.\\pipe\\missiondesk-[0-9a-f]{12}-claude\.sock$/);
    expect(defaultSocketPath('C:\\Users\\x\\AppData\\Roaming\\Mission Desk', 'claude.sock', 'win32')).toBe(p);
    expect(defaultSocketPath('C:\\other', 'claude.sock', 'win32')).not.toBe(p);
    expect(defaultSocketPath('/home/x/.config/Mission Desk', 'claude.sock', 'linux')).toBe('/home/x/.config/Mission Desk/claude.sock');
  });

  test('finding claude or codex: the user\'s own shell on macOS and Linux, "where" on Windows', () => {
    expect(cliLookup('claude', 'darwin', '/bin/zsh')).toEqual({ cmd: '/bin/zsh', args: ['-ilc', 'command -v claude'] });
    expect(cliLookup('codex', 'linux', undefined)).toEqual({ cmd: '/bin/sh', args: ['-lc', 'command -v codex'] });
    expect(cliLookup('claude', 'win32', undefined)).toEqual({ cmd: 'where', args: ['claude'] });
  });

  test('where Claude Code is usually installed, per system', () => {
    expect(claudeCandidates('/Users/x', 'darwin')).toContain('/opt/homebrew/bin/claude');
    expect(claudeCandidates('C:\\Users\\x', 'win32').some((p) => p.endsWith('claude.exe'))).toBe(true);
    expect(claudeCandidates('/home/x', 'linux')).not.toContain('/opt/homebrew/bin/claude');
  });

  test('the app menu leaves out macOS-only items elsewhere', () => {
    const roles = (p: NodeJS.Platform): (string | undefined)[] => appMenuItems(p).map((i) => i.role);
    expect(roles('darwin')).toEqual(expect.arrayContaining(['services', 'hide', 'hideOthers', 'unhide']));
    expect(roles('win32')).not.toEqual(expect.arrayContaining(['services']));
    expect(roles('linux').filter((r) => r === 'hide')).toEqual([]);
  });
});

test('reading the lookup: the shell\'s last line, or Windows\' first match', () => {
  expect(lookupResult('Welcome!\n/usr/local/bin/claude\n', 'darwin')).toBe('/usr/local/bin/claude');
  expect(lookupResult('C:\\a\\claude.exe\r\nC:\\b\\claude.cmd\r\n', 'win32')).toBe('C:\\a\\claude.exe');
  expect(lookupResult('  \n', 'linux')).toBeNull();
});

test('About opens Mission Desk\'s own About, where the website is a link (the system panel can\'t have links)', () => {
  const opened: string[] = [];
  const [about] = appMenuItems('darwin', [], () => opened.push('about'));
  expect(about.role).toBeUndefined();
  expect(about.label).toBe('About Mission Desk');
  (about.click as () => void)();
  expect(opened).toEqual(['about']);
});

test('the menu says Mission Desk', () => {
  const items = appMenuItems('darwin');
  expect(items.find((i) => i.role === 'hide')?.label).toBe('Hide Mission Desk');
  expect(items.find((i) => i.role === 'quit')?.label).toBe('Quit Mission Desk');
  expect(appMenuItems('win32').find((i) => i.role === 'quit')?.label).toBeUndefined(); // the system's own word
});
