import { AiBase } from '../base.mjs';
import type { AiRequestConfig } from '../types.mjs';
import { AiRawProviders } from './rawProviders.mjs';

export class AiCustomProviders extends AiBase {
	public oaiOpenai(args: AiRequestConfig) {
		return new AiRawProviders(this.config).oaiOpenai(args);
	}

	public async azOpenai(args: AiRequestConfig) {
		return new AiRawProviders(this.config).azOpenai(args);
	}

	public anthropic(args: AiRequestConfig) {
		return new AiRawProviders(this.config).anthropic(args);
	}

	public async cfWorkersAi(args: AiRequestConfig) {
		return new AiRawProviders(this.config).workersAi(args);
	}

	public custom(args: AiRequestConfig) {
		return new AiRawProviders(this.config).custom(args);
	}

	public async googleAi(args: AiRequestConfig) {
		return new AiRawProviders(this.config).googleAi(args);
	}
}
