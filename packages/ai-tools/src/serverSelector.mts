import { Helpers } from '@chainfuse/helpers';
import type { Coordinate } from '@chainfuse/types';
import type { azureCatalog } from '@chainfuse/types/ai-tools/catalog/azure';
import type { IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';
import haversine from 'haversine-distance';
import { AiBase } from './base.mts';
import type { PrivacyRegion } from './types.mjs';

export class ServerSelector extends AiBase {
	public static determinePrivacyRegion(country?: IncomingRequestCfProperties['country'], continent?: IncomingRequestCfProperties['continent']) {
		const regions = new Set<PrivacyRegion>();

		if (country) {
			switch (country.toUpperCase()) {
				case 'AU':
					regions.add('APPs');
					break;
				case 'BR':
					regions.add('LGPD');
					break;
				case 'CA':
					regions.add('PIPEDA');
					regions.add('GDPR');
					regions.add('revFADP');
					regions.add('UK-GDPR');
					break;
				case 'IN':
					regions.add('PDP');
					break;
				case 'JP':
					regions.add('APPI');
					regions.add('GDPR');
					regions.add('UK-GDPR');
					break;
				case 'KR':
					regions.add('PIPA');
					regions.add('GDPR');
					regions.add('UK-GDPR');
					break;
				case 'NO':
					regions.add('NPDA');
					regions.add('PIPEDA');
					regions.add('GDPR');
					regions.add('APPI');
					regions.add('PIPA');
					regions.add('revFADP');
					regions.add('UK-GDPR');
					break;
				case 'ZA':
					regions.add('PoPIA');
					break;
				case 'CH':
					regions.add('revFADP');
					regions.add('PIPEDA');
					regions.add('GDPR');
					regions.add('APPI');
					regions.add('PIPA');
					regions.add('NPDA');
					regions.add('revFADP');
					regions.add('UK-GDPR');
					break;
				case 'GB':
					regions.add('UK-GDPR');
					regions.add('PIPEDA');
					regions.add('GDPR');
					regions.add('APPI');
					regions.add('PIPA');
					regions.add('NPDA');
					regions.add('revFADP');
					regions.add('UK-GDPR');
					break;
			}
		}

		if (continent) {
			switch (continent.toUpperCase()) {
				case 'EU':
					regions.add('GDPR');
					regions.add('PIPEDA');
					regions.add('APPI');
					regions.add('PIPA');
					regions.add('NPDA');
					regions.add('revFADP');
					regions.add('UK-GDPR');
					break;
			}
		}

		return Array.from(regions);
	}

	public closestServers(
		servers: typeof azureCatalog,
		requiredCapability?: string,
		userCoordinate: Coordinate = {
			lat: this.config.geoRouting?.userCoordinate?.lat ?? '0',
			lon: this.config.geoRouting?.userCoordinate?.lon ?? '0',
		},
		privacyRegion: PrivacyRegion[] = ServerSelector.determinePrivacyRegion(this.config.geoRouting?.country, this.config.geoRouting?.continent),
	) {
		// Skip over the rest of logic if the server can't handle the incoming request
		// @ts-expect-error it's always strings, just sometimes string literals
		const featureFilteredServers = requiredCapability ? servers.filter((server) => server.languageModelAvailability.includes(requiredCapability) || server.textEmbeddingModelAvailability.includes(requiredCapability)) : servers;

		if (featureFilteredServers.length > 0) {
			// Skip over servers not in the save privacy region except if undefined, then you can use any
			const privacyRegionFilteredServers = featureFilteredServers.filter((server) => privacyRegion.length === 0 || ('privacyRegion' in server && privacyRegion.includes(server.privacyRegion)));

			if (privacyRegionFilteredServers.length > 0) {
				// Calculate distance for each server and store it as a tuple [Server, distance]
				const serversWithDistances: [(typeof servers)[number], number][] = privacyRegionFilteredServers.map((server) => {
					// Match decimal point length
					return [
						server,
						haversine(
							{
								lat: Helpers.precisionFloat(userCoordinate.lat),
								lon: Helpers.precisionFloat(userCoordinate.lon),
							},
							{
								lat: server.coordinate.lat,
								lon: server.coordinate.lon,
							},
						),
					];
				});

				// Sort the servers by distance
				serversWithDistances.sort((a, b) => a[1] - b[1]);

				// Extract the ids of the sorted servers
				const sortedServers = serversWithDistances.map(([server]) => server);

				return sortedServers;
			} else {
				throw new Error(`No server with the capability ${requiredCapability} available in a region covered under ${JSON.stringify(privacyRegion)}`);
			}
		} else {
			throw new Error(`No server with the capability ${requiredCapability} available`);
		}
	}
}
