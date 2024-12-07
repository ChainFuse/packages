import { Helpers } from '@chainfuse/helpers';
import type { RawCoordinate } from '@chainfuse/types';
import type { IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';
import haversine from 'haversine-distance';
import { AiBase } from '../base.mjs';
import type { Server } from './types.mjs';

export enum PrivacyRegion {
	Australian_Privacy_Principles = 'APPs',
	Brazil_General_Data_protection_Law = 'LGPD',
	Canada_Personal_Information_Protection_and_Electronic_Documents_Act = 'PIPEDA',
	General_Data_Protection_Regulation = 'GDPR',
	Indian_Personal_Protection = 'PDP',
	Japan_Act_on_the_Protection_of_Personal_Information = 'APPI',
	Korean_Personal_Information_Protection_Act = 'PIPA',
	Norwegian_Personal_Data_Act = 'NPDA',
	SouthAfrica_Protection_Personal_Information_Act = 'PoPIA',
	Swiss_Federal_Act_on_Data_Protection = 'revFADP',
	UK_General_Data_Protection_Regulation = 'UK-GDPR',
}

export abstract class ServerSelector extends AiBase {
	public readonly servers = new Set<Server>();

	public static determinePrivacyRegion(country?: IncomingRequestCfProperties['country'], continent?: IncomingRequestCfProperties['continent']) {
		const regions = new Set<PrivacyRegion>();

		if (country) {
			switch (country.toUpperCase()) {
				case 'AU':
					regions.add(PrivacyRegion.Australian_Privacy_Principles);
					break;
				case 'BR':
					regions.add(PrivacyRegion.Brazil_General_Data_protection_Law);
					break;
				case 'CA':
					regions.add(PrivacyRegion.Canada_Personal_Information_Protection_and_Electronic_Documents_Act);
					regions.add(PrivacyRegion.General_Data_Protection_Regulation);
					regions.add(PrivacyRegion.Swiss_Federal_Act_on_Data_Protection);
					regions.add(PrivacyRegion.UK_General_Data_Protection_Regulation);
					break;
				case 'IN':
					regions.add(PrivacyRegion.Indian_Personal_Protection);
					break;
				case 'JP':
					regions.add(PrivacyRegion.Japan_Act_on_the_Protection_of_Personal_Information);
					regions.add(PrivacyRegion.General_Data_Protection_Regulation);
					regions.add(PrivacyRegion.UK_General_Data_Protection_Regulation);
					break;
				case 'KR':
					regions.add(PrivacyRegion.Korean_Personal_Information_Protection_Act);
					regions.add(PrivacyRegion.General_Data_Protection_Regulation);
					regions.add(PrivacyRegion.UK_General_Data_Protection_Regulation);
					break;
				case 'NO':
					regions.add(PrivacyRegion.Norwegian_Personal_Data_Act);
					regions.add(PrivacyRegion.Canada_Personal_Information_Protection_and_Electronic_Documents_Act);
					regions.add(PrivacyRegion.General_Data_Protection_Regulation);
					regions.add(PrivacyRegion.Japan_Act_on_the_Protection_of_Personal_Information);
					regions.add(PrivacyRegion.Korean_Personal_Information_Protection_Act);
					regions.add(PrivacyRegion.Swiss_Federal_Act_on_Data_Protection);
					regions.add(PrivacyRegion.UK_General_Data_Protection_Regulation);
					break;
				case 'ZA':
					regions.add(PrivacyRegion.SouthAfrica_Protection_Personal_Information_Act);
					break;
				case 'CH':
					regions.add(PrivacyRegion.Swiss_Federal_Act_on_Data_Protection);
					regions.add(PrivacyRegion.Canada_Personal_Information_Protection_and_Electronic_Documents_Act);
					regions.add(PrivacyRegion.General_Data_Protection_Regulation);
					regions.add(PrivacyRegion.Japan_Act_on_the_Protection_of_Personal_Information);
					regions.add(PrivacyRegion.Korean_Personal_Information_Protection_Act);
					regions.add(PrivacyRegion.Norwegian_Personal_Data_Act);
					regions.add(PrivacyRegion.Swiss_Federal_Act_on_Data_Protection);
					regions.add(PrivacyRegion.UK_General_Data_Protection_Regulation);
					break;
				case 'GB':
					regions.add(PrivacyRegion.UK_General_Data_Protection_Regulation);
					regions.add(PrivacyRegion.Canada_Personal_Information_Protection_and_Electronic_Documents_Act);
					regions.add(PrivacyRegion.General_Data_Protection_Regulation);
					regions.add(PrivacyRegion.Japan_Act_on_the_Protection_of_Personal_Information);
					regions.add(PrivacyRegion.Korean_Personal_Information_Protection_Act);
					regions.add(PrivacyRegion.Norwegian_Personal_Data_Act);
					regions.add(PrivacyRegion.Swiss_Federal_Act_on_Data_Protection);
					regions.add(PrivacyRegion.UK_General_Data_Protection_Regulation);
					break;
			}
		}

		if (continent) {
			switch (continent.toUpperCase()) {
				case 'EU':
					regions.add(PrivacyRegion.General_Data_Protection_Regulation);
					regions.add(PrivacyRegion.Canada_Personal_Information_Protection_and_Electronic_Documents_Act);
					regions.add(PrivacyRegion.Japan_Act_on_the_Protection_of_Personal_Information);
					regions.add(PrivacyRegion.Korean_Personal_Information_Protection_Act);
					regions.add(PrivacyRegion.Norwegian_Personal_Data_Act);
					regions.add(PrivacyRegion.Swiss_Federal_Act_on_Data_Protection);
					regions.add(PrivacyRegion.UK_General_Data_Protection_Regulation);
					break;
			}
		}

		return Array.from(regions);
	}

	public closestServers(
		requiredCapability?: (Server['languageModelAvailability'] | Server['textEmbeddingModelAvailability'])[number],
		userCoordinate: RawCoordinate = {
			lat: this.config.geoRouting?.userCoordinate?.lat ?? '0',
			lon: this.config.geoRouting?.userCoordinate?.lon ?? '0',
		},
		privacyRegion: PrivacyRegion[] = ServerSelector.determinePrivacyRegion(this.config.geoRouting?.country, this.config.geoRouting?.continent),
	) {
		// Skip over the rest of logic if the server can't handle the incoming request
		// @ts-expect-error it's always strings, just sometimes string literals
		const featureFilteredServers = requiredCapability ? Array.from(this.servers).filter((server) => server.languageModelAvailability.includes(requiredCapability) || server.textEmbeddingModelAvailability.includes(requiredCapability)) : Array.from(this.servers);

		if (featureFilteredServers.length > 0) {
			// Skip over servers not in the save privacy region except if undefined, then you can use any
			const privacyRegionFilteredServers = featureFilteredServers.filter((server) => privacyRegion.length === 0 || (server.region && privacyRegion.includes(server.region)));

			if (privacyRegionFilteredServers.length > 0) {
				// Calculate distance for each server and store it as a tuple [Server, distance]
				const serversWithDistances: [Server, number][] = privacyRegionFilteredServers.map((server) => {
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
