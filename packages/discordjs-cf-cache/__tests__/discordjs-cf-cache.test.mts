import discordjsCfCache from '../src/discordjs-cf-cache.js';
import { strict as assert } from 'assert';

assert.strictEqual(discordjsCfCache(), 'Hello from discordjsCfCache');
console.info('discordjsCfCache tests passed');
