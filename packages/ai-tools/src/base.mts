import { Chalk } from 'chalk';
import type { AiConfig } from './types.mjs';

export class AiBase {
	protected readonly chalk = new Chalk({ level: 2 });
	protected _config: AiConfig;

	constructor(config: AiConfig) {
		this._config = config;
	}

	public get config(): Readonly<Omit<AiConfig, 'backgroundContext'>> & Pick<AiConfig, 'backgroundContext'> {
		return {
			...Object.freeze(this._config),
			backgroundContext: this._config.backgroundContext,
		};
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
