import { app } from './app';
import { assistant } from './assistant';
import { calendar } from './calendar';
import { common } from './common';
import { home } from './home';
import { main } from './main';
import { meetings } from './meetings';
import { settings } from './settings';
import { setup } from './setup';

export const es = { ...common, ...app, ...home, ...calendar, ...settings, ...setup, ...assistant, ...main, ...meetings };
