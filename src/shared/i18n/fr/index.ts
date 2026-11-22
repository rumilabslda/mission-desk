import { app } from './app';
import { assistant } from './assistant';
import { calendar } from './calendar';
import { common } from './common';
import { home } from './home';
import { main } from './main';
import { settings } from './settings';
import { setup } from './setup';

export const fr = { ...common, ...app, ...home, ...calendar, ...settings, ...setup, ...assistant, ...main };
