import { defaultAccountName } from '../src/shared/account-name';
import { parseNewAccount } from '../src/main/ipc-validation';

// The name is optional when adding an app: the space already says whose it is.
describe('an app added without a name', () => {
  test("is named after its service", () => {
    expect(defaultAccountName('linkedin')).toBe('LinkedIn');
    expect(defaultAccountName('google')).toBe('Google');
    expect(defaultAccountName('microsoft')).toBe('Microsoft 365');
  });

  test('a website is named after its address', () => {
    expect(defaultAccountName('custom', 'https://app.notion.so/x')).toBe('Notion');
    expect(defaultAccountName('custom', 'https://www.example.com/')).toBe('Example');
  });

  test('main fills it in too (an empty name is not refused)', () => {
    expect(parseNewAccount({ service: 'linkedin', name: '', color: '#0a66c2', space: { id: 'S' } })).toEqual({
      service: 'linkedin', name: 'LinkedIn', color: '#0a66c2', space: { id: 'S' },
    });
    expect(parseNewAccount({ service: 'google', name: '   ', color: '#000000' })?.name).toBe('Google');
    expect(parseNewAccount({ service: 'custom', name: '', color: '#000000', url: 'https://app.example.com/' })?.name).toBe('Example');
  });

  test('a name that is too long is still refused', () => {
    expect(parseNewAccount({ service: 'linkedin', name: 'x'.repeat(61), color: '#000000' })).toBeNull();
  });
});
