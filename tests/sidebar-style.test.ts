import { sidebarStyleOf } from '../src/shared/spaces';

test('Sections is the default sidebar style; a choice is kept', () => {
  expect(sidebarStyleOf(undefined)).toBe('sections');
  expect(sidebarStyleOf('folders')).toBe('folders');
  expect(sidebarStyleOf('panel')).toBe('panel');
});
