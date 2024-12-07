import { AiBase } from './base.mjs';
import { AiRawProviders } from './rawProviders.mjs';
import type { AiRequestConfig } from './types.mjs';

export class AiCustomProviders extends AiBase {
	public oaiOpenai(args: AiRequestConfig) {
		return new AiRawProviders(this.config).oaiOpenai(args);
	}
}
