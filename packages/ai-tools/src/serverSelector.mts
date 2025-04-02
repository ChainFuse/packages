import type { Coordinate } from '@chainfuse/types';
import type { IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';
import { AiBase } from './base.mts';
import type { PrivacyRegion, Servers } from './types.mjs';

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

	public async determineLocation(geoRouting = this.config.geoRouting): Promise<{
		coordinate: Coordinate;
		country: IncomingRequestCfProperties['country'];
		continent: IncomingRequestCfProperties['continent'];
	}> {
		if (!geoRouting?.userCoordinate?.lat || !geoRouting?.userCoordinate?.lon || !geoRouting?.country || !geoRouting?.continent) {
			console.warn('Location not provided, falling back to nearest Cloudflare POP', 'WARNING: This is slow');

			try {
				const geoJson = await fetch(new URL('https://workers.cloudflare.com/cf.json')).then((geoResponse) => geoResponse.json().then((json) => json as IncomingRequestCfProperties));

				return {
					coordinate: {
						lat: geoRouting?.userCoordinate?.lat ?? geoJson.latitude ?? '0',
						lon: geoRouting?.userCoordinate?.lon ?? geoJson.longitude ?? '0',
					},
					country: geoRouting?.country ?? geoJson.country,
					continent: geoRouting?.continent ?? geoJson.continent,
				};
			} catch (error) {
				console.error('Failed to use nearest Cloudflare POP, service distance and privacy regions will be wrong', error);
			}
		}

		return {
			coordinate: {
				lat: geoRouting?.userCoordinate?.lat ?? '0',
				lon: geoRouting?.userCoordinate?.lon ?? '0',
			},
			country: geoRouting?.country,
			continent: geoRouting?.continent,
		};
	}

	public async closestServers(servers: Servers, requiredCapability?: string, userCoordinate?: Coordinate, privacyRegion?: PrivacyRegion[]): Promise<Servers> {
		if (!userCoordinate || !privacyRegion) {
			const { coordinate, country, continent } = await this.determineLocation();

			if (!userCoordinate) userCoordinate = coordinate;
			if (!privacyRegion) privacyRegion = ServerSelector.determinePrivacyRegion(country, continent);
		}

		// Skip over the rest of logic if the server can't handle the incoming request
		// @ts-expect-error it's always strings, just sometimes string literals
		const featureFilteredServers = requiredCapability ? servers.filter((server) => server.languageModelAvailability.map((model) => model.name).includes(requiredCapability) || server.textEmbeddingModelAvailability.map((model) => model.name).includes(requiredCapability)) : servers;

		if (featureFilteredServers.length > 0) {
			// Skip over servers not in the save privacy region except if undefined, then you can use any
			const privacyRegionFilteredServers = featureFilteredServers.filter((server) => privacyRegion.length === 0 || ('privacyRegion' in server && privacyRegion.includes(server.privacyRegion)));

			if (privacyRegionFilteredServers.length > 0) {
				// Calculate distance for each server and store it as a tuple [Server, distance]
				const serversWithDistances: [(typeof servers)[number], number][] = await Promise.all([import('haversine-distance'), import('@chainfuse/helpers')]).then(([{ default: haversine }, { Helpers }]) =>
					privacyRegionFilteredServers.map((server) => {
						// Match decimal point length
						return [
							server,
							haversine(
								{
									lat: Helpers.precisionFloat(userCoordinate.lat),
									lon: Helpers.precisionFloat(userCoordinate.lon),
								},
								{
									lat: Helpers.precisionFloat(server.coordinate.lat),
									lon: Helpers.precisionFloat(server.coordinate.lon),
								},
							),
						];
					}),
				);

				// Sort the servers by distance
				serversWithDistances.sort((a, b) => a[1] - b[1]);

				// Extract the ids of the sorted servers
				const sortedServers = serversWithDistances.map(([server]) => server);

				return sortedServers as unknown as Servers;
			} else {
				throw new Error(`No server with the capability ${requiredCapability} available in a region covered under ${JSON.stringify(privacyRegion)}`);
			}
		} else {
			throw new Error(`No server with the capability ${requiredCapability} available`);
		}
	}
}
