import { endGroup, info, startGroup, warning } from '@actions/core';
import { CognitiveServicesManagementClient, type BillingMeterInfo } from '@azure/arm-cognitiveservices';
import { SubscriptionClient } from '@azure/arm-resources-subscriptions';
import { ClientSecretCredential } from '@azure/identity';

const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_SUB_ID } = process.env;

const credential = new ClientSecretCredential(AZURE_TENANT_ID!, AZURE_CLIENT_ID!, AZURE_CLIENT_SECRET!);

startGroup('Azure Pricing API');
interface PricingItem extends Record<string, any> {
	meterId: string;
	unitPrice: number;
	unitOfMeasure: string;
}
const pricing = await (async () => {
	let url: URL | null = new URL('api/retail/prices', 'https://prices.azure.com');
	url.searchParams.set('$filter', "productName eq 'Azure OpenAI'");
	let page = 0;

	const pricing = [];

	while (url) {
		info(`Fetching pricing page ${++page}`);
		const response = await fetch(url);

		if (response.ok) {
			const { Items, NextPageLink } = (await response.json()) as {
				BillingCurrency: string;
				CustomerEntityId: string;
				CustomerEntityType: string;
				Items: PricingItem[];
				NextPageLink: string | null;
				Count: number;
			};

			pricing.push(...Items);

			if (NextPageLink) {
				url = new URL(NextPageLink);
			} else {
				url = null;
			}
		} else {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`, { cause: url.toString() });
		}
	}

	info(`Fetched ${pricing.length} pricing items from ${page} pages`);
	return pricing;
})();
endGroup();

startGroup('Azure Locations API');
const locations = await (async () => {
	const subClient = new SubscriptionClient(credential);
	const locations = [];

	info('Fetching locations');
	for await (const location of subClient.subscriptions.listLocations(AZURE_SUB_ID!)) {
		locations.push(location);
	}

	info(`Fetched ${locations.length} locations`);
	return locations;
})();
endGroup();

startGroup('Deployed Azure AI Servers');
const rawServers = await (async () => {
	const aiClient = new CognitiveServicesManagementClient(credential, AZURE_SUB_ID!);

	const accounts = [];

	info('Fetching servers');
	for await (const account of aiClient.accounts.list()) {
		accounts.push(account);
	}

	info(`Fetched ${accounts.length} servers`);
	return accounts;
})();
endGroup();

function parseShorthandNumber(input: string) {
	const multipliers = Object.freeze({
		k: 1e3,
		m: 1e6,
		b: 1e9,
		t: 1e12,
	});

	const normalized = input.trim().toLowerCase();
	const match = new RegExp(/^([\d.,]+)([kmbt])?$/i).exec(normalized);

	if (!match) {
		throw new Error(`Invalid shorthand number format: "${input}"`);
	}

	const [, numberPart, suffix] = match;
	if (numberPart) {
		const numeric = parseFloat((numberPart ?? '').replace(/,/g, ''));

		if (isNaN(numeric)) {
			throw new Error(`Invalid numeric part in input: "${input}"`);
		}

		return numeric * (suffix ? multipliers[suffix as keyof typeof multipliers] : 1);
	} else {
		throw new Error(`Invalid numeric part in input: "${input}"`);
	}
}

startGroup('Generating catalog');
const json = (
	await Promise.all(
		rawServers.map(async (server) => {
			const aiClient = new CognitiveServicesManagementClient(credential, AZURE_SUB_ID!);
			const location = locations.find((location) => location.name === server.location);

			const [deployments, models] = await Promise.all([
				(async () => {
					const idParts = server.id?.split('/');
					const resourceGroupName = idParts?.[idParts.indexOf('resourceGroups') + 1];

					const deployments = [];
					for await (const deployment of aiClient.deployments.list(resourceGroupName!, server.name!)) {
						deployments.push(deployment);
					}

					return deployments;
				})(),
				(async () => {
					const models = [];
					for await (const model of aiClient.models.list(location!.name!)) {
						models.push(model);
					}

					return models;
				})(),
			]);

			info(`Server ${server.name} with ${deployments.length} models`);

			return {
				id: server.name,
				coordinate: {
					lat: location?.metadata?.latitude,
					lon: location?.metadata?.longitude,
				},
				privacyRegion: server.tags?.['privacy-region'],
				languageModelAvailability: deployments
					.filter((deployment) => deployment.properties?.capabilities?.['chatCompletion'] === 'true')
					.map((deployment) => {
						const model = models.find((model) => model.kind === server.kind && model.model?.format === deployment?.properties?.model?.format && model.model?.name === deployment?.properties?.model?.name && model.model?.version === deployment?.properties?.model?.version);

						const skuCost = model?.model?.skus?.find((sku) => sku.name === deployment?.sku?.name)?.costs as BillingMeterInfo[];

						const inputTokenMeter = skuCost?.find((costItem) => costItem.name === 'ContextToken' || costItem.name === 'NoCachedContextToken')?.meterId;
						const inputTokenPrice = pricing.find((price) => price.meterId === inputTokenMeter);
						const outputTokenMeter = skuCost?.find((costItem) => costItem.name === 'GeneratedToken')?.meterId;
						const outputTokenPrice = pricing.find((price) => price.meterId === outputTokenMeter);

						return {
							name: deployment.name,
							inputTokenCost: inputTokenPrice?.unitPrice ? parseFloat(inputTokenPrice?.unitOfMeasure ? (inputTokenPrice.unitPrice / parseShorthandNumber(inputTokenPrice.unitOfMeasure)).toFixed(20) : inputTokenPrice?.unitPrice.toFixed(20)) : undefined,
							outputTokenCost: outputTokenPrice?.unitPrice ? parseFloat(outputTokenPrice?.unitOfMeasure ? (outputTokenPrice.unitPrice / parseShorthandNumber(outputTokenPrice.unitOfMeasure)).toFixed(20) : outputTokenPrice?.unitPrice.toFixed(20)) : undefined,
						};
					})
					.sort((a, b) => a.name!.localeCompare(b.name!)),
				imageModelAvailability: deployments
					.filter((model) => model.properties?.capabilities?.['imageGenerations'] === 'true')
					.map((model) => model.name)
					.sort((a, b) => a!.localeCompare(b!)),
				textEmbeddingModelAvailability: deployments
					.filter((model) => model.properties?.capabilities?.['embeddings'] === 'true')
					.map((model) => model.name)
					.sort((a, b) => a!.localeCompare(b!)),
			};
		}),
	)
).sort((a, b) => a.id!.localeCompare(b.id!));
endGroup();

startGroup('Merging catalog');
const finalJson = await import('../packages/types/dist/ai-tools/azure/catalog.js')
	.then(({ azureCatalog }) => {
		info(`Loaded existing catalog with ${azureCatalog.length} items`);

		return import('deepmerge')
			.then(({ default: merge }) =>
				merge(azureCatalog, json, {
					arrayMerge: (target, source, options) => {
						const destination = target.slice();

						source.forEach((item) => {
							const existingIndex = destination.findIndex((destItem) => destItem.id === item.id);

							if (existingIndex === -1) {
								destination.push(options.cloneUnlessOtherwiseSpecified(item, options));
							} else if (options.isMergeableObject(item)) {
								destination[existingIndex] = merge(destination[existingIndex], item, options);
							}
						});

						return destination;
					},
				}),
			)
			.then((mergedJson) => {
				info(`Merged catalogs with ${mergedJson.length} items`);
				return mergedJson;
			})
			.catch((e) => {
				console.error(e);
				warning('Failed merge, using new catalog only');
				throw e;
			});
	})
	.catch((e) => {
		console.error(e);
		warning('Failed to load existing catalog found, using new catalog only');
		return json;
	});
endGroup();

startGroup('Saving catalog');
await import('node:fs').then(({ createWriteStream }) => {
	const writeStream = createWriteStream('packages/types/src/ai-tools/azure/catalog.ts', { encoding: 'utf8' });

	info(`Writing catalog with ${finalJson.length} items`);
	writeStream.write(`export const azureCatalog = ${JSON.stringify(finalJson, null, '\t')} as const`);

	writeStream.end();
	info('Catalog saved');
});
endGroup();
