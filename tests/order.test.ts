import { moveBy } from '../src/main/accounts/order';

test('moves an account up and down by one', () => {
  expect(moveBy(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
  expect(moveBy(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
});
test('does nothing past the ends or for unknown ids', () => {
  expect(moveBy(['a', 'b'], 'a', -1)).toEqual(['a', 'b']);
  expect(moveBy(['a', 'b'], 'b', 1)).toEqual(['a', 'b']);
  expect(moveBy(['a', 'b'], 'z', 1)).toEqual(['a', 'b']);
});
