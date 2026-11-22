import { app } from './app';
import { assistant } from './assistant';
import { calendar } from './calendar';
import { common } from './common';
import { home } from './home';
import { main } from './main';
import { meetings } from './meetings';
import { settings } from './settings';
import { setup } from './setup';

/** The source of every interface text. Keys are "<area>.<name>"; the other languages mirror this. */
export const en = { ...common, ...app, ...home, ...calendar, ...settings, ...setup, ...assistant, ...main, ...meetings };
export const EN_NAMESPACES = { common, app, home, calendar, settings, setup, assistant, main, meetings };
