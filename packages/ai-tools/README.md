[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/ChainFuse/packages/badge)](https://securityscorecards.dev/viewer/?uri=github.com/ChainFuse/packages)[![Socket Badge](https://socket.dev/api/badge/npm/package/@chainfuse/ai-tools)](https://socket.dev/npm/package/@chainfuse/ai-tools)

![NPM Downloads](https://img.shields.io/npm/dw/@chainfuse/ai-tools)![npm bundle size](https://img.shields.io/bundlephobia/min/@chainfuse/ai-tools)![NPM Unpacked Size](https://img.shields.io/npm/unpacked-size/@chainfuse/ai-tools)

[![Build & Test](https://github.com/ChainFuse/packages/actions/workflows/test.yml/badge.svg)](https://github.com/ChainFuse/packages/actions/workflows/test.yml)[![Release](https://github.com/ChainFuse/packages/actions/workflows/changeset-release.yml/badge.svg)](https://github.com/ChainFuse/packages/actions/workflows/changeset-release.yml)

# `@chainfuse/ai-tools`

Vercel AI SDK plugin for multi-model and provider selection built for edge runtimes. Just replace `model` property and continue using vercel ai sdk as normal.

## Compatability

- [x] `generateText()`
- [x] `streamText()`
- [x] `generateObject()`
- [x] `streamObject()`
- [x] `embed()`
- [ ] `generateImage()`

## Usage

```ts
import { AiModels } from '@chainfuse/types';
import { generateText } from 'ai';
import { AiModel } from '@chainfuse/ai-tools';

generateText({
	model: await new AiModel(
		{
			gateway: {
				accountId: 'cf account id',
				apiToken: 'cf ai gateway token with run permission',
			},
			geoRouting: {
				userCoordinate: {
					lat: 'latitude as a string to preserve 0 placement',
					lon: 'longitude as a string to preserve 0 placement',
				},
				country: 'ISO 3166-1 Alpha 2 country code',
				continent: 'two-letter code of continent',
				environment: 'the gateway to use',
				providers: {
					// api keys and any additional info needed for each service
				},
			},
		},
		// ...
	).wrappedLanguageModel(args, 'AiModels.LanguageModels enum or service name', 'if no enum, then model name (includes autofill typescript types based on service name)'),
	// ... (anything else vercel)
});

// Continue using vercel ai sdk as normal
```
