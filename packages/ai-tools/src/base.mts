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

	protected get gatewayName() {
		if (this.config.billing.noCost) {
			return 'nocost' as const;
		} else {
			return `${this.config.billing.environment}-${this.config.billing.action}-${this.config.billing.user}` as const;
		}
	}

	protected get gatewayLog() {
		if (this.config.billing.noCost) {
			return true;
		} else {
			return this.config.billing.environment !== 'production';
		}
	}
}
