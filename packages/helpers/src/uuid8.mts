import { DOCombinedLocations } from '@chainfuse/types';
import { ShardType } from '@chainfuse/types/d0';
import { v7 } from 'uuid';
import { z } from 'zod/v4';
import { BufferHelpersInternals } from './bufferInternals.mts';

const v8OptionsBase = z.object({
	/**
	 * RFC "timestamp" field
	 */
	msecs: z
		.union([
			z.int().nonnegative(),
			// Allow converting from Date object
			z.date().transform((date) => date.getTime()),
		])
		.optional(),
	/**
	 * 32-bit sequence Number between 0 - 0xffffffff. This may be provided to help ensure uniqueness for UUIDs generated within the same millisecond time interval. Default = random value.
	 */
	seq: z.int().min(0).max(0xffffffff).optional(),
	location: z.union([
		//
		z.hex().length(2).default('00'),
		z
			.enum(DOCombinedLocations)
			.default(DOCombinedLocations.none)
			.transform((r) => r.toString(16).padStart(2, '0').slice(-2)),
	]),
	shardType: z.union([
		//
		z.hex().length(1).default('0'),
		z
			.enum(ShardType)
			.default(ShardType.Director)
			.transform((st) => st.toString(16).padStart(1, '0')),
	]),
	suffix: z.union([
		z.hex().length(3).default('000'),
		// It's technically 1.5 bytes, but we round up to nearest integer
		z
			.instanceof(Uint8Array)
			.refine((arr) => arr.byteLength === 2, { message: 'suffix must be a Uint8Array of 2 bytes' })
			.default(new Uint8Array(2))
			.transform((arr) => BufferHelpersInternals.browser_bufferToHex(arr.buffer).padStart(3, '0').slice(-3)),
	]),
});
export const v8Options = z.union([
	v8OptionsBase.extend({
		/**
		 * Array of 16 random bytes (0-255) used to generate other fields
		 */
		random: z
			.instanceof(Uint8Array)
			.refine((arr) => arr.byteLength === 16, { message: '`random` must be a Uint8Array of 16 random bytes' })
			.optional(),
	}),
	v8OptionsBase.extend({
		/**
		 * Alternative to options.random, a Function that returns an Array of 16 random bytes (0-255)
		 */
		rng: z
			.function({
				input: [],
				output: z.instanceof(Uint8Array).refine((arr) => arr.byteLength === 16, { message: '`random` must be a Uint8Array of 16 random bytes' }),
			})
			.optional(),
	}),
]);
export type Version8Options = z.input<typeof v8Options>;

function replaceByIndex(_input: string, _start: number, _end: number, _replacement: string) {
	const input = z.string().parse(_input);
	const end = z.int().max(input.length).parse(_end);
	const start = z.int().min(0).max(end).parse(_start);
	const replacement = z.string().parse(_replacement);

	return input.slice(0, start) + replacement + input.slice(end);
}

/**
 * Generates a UUID version 8 with custom fields for location, shard type, and suffix.
 *
 * This function creates a UUID v8 by starting with a UUID v7 and then injecting custom fields into specific positions to encode regional information, shard types, and additional suffixes for distributed system identification.
 *
 * @param options - Configuration options for UUID generation
 * @param options.msecs - RFC "timestamp" field - milliseconds since epoch or Date object
 * @param options.seq - 32-bit sequence number (0 - 0xffffffff) for uniqueness within same millisecond
 * @param options.location - Location identifier as hex string or DOCombinedLocations enum
 * @param options.shardType - Shard type as hex string or ShardType enum
 * @param options.suffix - Custom suffix as hex string or Uint8Array of 2 bytes
 * @param options.random - Array of 16 random bytes for UUID generation
 * @param options.rng - Alternative random number generator function
 *
 * @returns A UUID v8 string with embedded location, shard type, and suffix information
 */
export function v8(_options?: Version8Options) {
	const options = v8Options.parse(_options ?? {});

	// 36 character string including hyphens
	const uuid7 = v7(options);
	// Swap version
	const uuid8 = replaceByIndex(uuid7, 14, 15, '8');
	// Inject
	const uuid8Suffix = replaceByIndex(uuid8, 15, 18, options.suffix);
	const uuid8SuffixLocation = replaceByIndex(uuid8Suffix, 20, 22, options.location);
	const uuid8SuffixLocationShard = replaceByIndex(uuid8SuffixLocation, 22, 23, options.shardType);

	return uuid8SuffixLocationShard;
}

export default v8;
