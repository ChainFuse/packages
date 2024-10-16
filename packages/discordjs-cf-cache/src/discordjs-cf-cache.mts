import { AsyncCollection } from './AsyncCollection.mjs';

export function cfCache() {
	return () => new AsyncCollection();
}
