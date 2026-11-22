import type { Msg } from '../types';

/** Words used all over the interface. Area-specific text lives in its own namespace. */
export const common = {
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.saveChanges': 'Save changes',
  'common.remove': 'Remove',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.done': 'Done',
  'common.add': 'Add',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.skip': 'Skip',
  'common.create': 'Create',
  'common.delete': 'Delete',
  'common.keep': 'Keep',
  'common.loading': 'Loading…',
  'common.on': 'On',
  'common.off': 'Off',
  'common.none': 'None',
  'common.today': 'Today',
  'common.tomorrow': 'Tomorrow',
  'common.yesterday': 'Yesterday',
  'common.allSpaces': 'All spaces',
  'common.noSpace': 'No space',
} satisfies Record<string, Msg>;
