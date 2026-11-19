import { moveId } from '../src/renderer/src/reorder';

test('dragging down places the item after the target', () => {
  expect(moveId(['a', 'b', 'c', 'd'], 'a', 'c')).toEqual(['b', 'c', 'a', 'd']);
});
test('dragging up places the item before the target', () => {
  expect(moveId(['a', 'b', 'c', 'd'], 'd', 'b')).toEqual(['a', 'd', 'b', 'c']);
});
test('unknown target leaves the order unchanged', () => {
  expect(moveId(['a', 'b'], 'a', 'z')).toEqual(['a', 'b']);
});
