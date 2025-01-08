import { Chalk } from 'chalk';
import type { AiConfig } from './types.mjs';

export class AiBase {
	protected readonly chalk = new Chalk({ level: 3 });
	protected _config: AiConfig;

	constructor(config: AiConfig) {
		this._config = config;
	}

	public get config() {
		return Object.freeze(this._config);
	}
}
