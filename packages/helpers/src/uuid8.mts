import { DOCombinedLocations } from '@chainfuse/types';
import { ShardType } from '@chainfuse/types/d0';
import { v7 } from 'uuid';
import * as z from 'zod/mini';
import { BufferHelpersInternals } from './bufferInternals.mts';

const v8OptionsBase = z.object({
	/**
	 * RFC "timestamp" field
	 */
	msecs: z.optional(
		z.union([
			z.int().check(z.nonnegative()),
			// Allow converting from Date object
			z.pipe(
				z.date(),
				z.transform((date) => date.getTime()),
			),
		]),
	),
	/**
	 * 32-bit sequence Number between 0 - 0xffffffff. This may be provided to help ensure uniqueness for UUIDs generated within the same millisecond time interval. Default = random value.
	 */
	seq: z.optional(z.int().check(z.minimum(0), z.maximum(0xffffffff))),
	location: z.union([
		//
		z._default(z.hex().check(z.length(2)), '00'),
		z.pipe(
			z._default(z.enum(DOCombinedLocations), DOCombinedLocations.none),
			z.transform((l) => l.toString(16).padStart(2, '0').slice(-2)),
		),
	]),
	shardType: z.union([
		//
		z._default(z.hex().check(z.length(1)), '0'),
		z.pipe(
			z._default(z.enum(ShardType), ShardType.Director),
			z.transform((st) => st.toString(16).padStart(1, '0')),
		),
	]),
	suffix: z.union([
		z._default(z.hex().check(z.length(3)), '000'),
		// It's technically 1.5 bytes, but we round up to nearest integer
		z.pipe(
			z._default(z.instanceof(Uint8Array).check(z.refine((arr) => arr.byteLength === 2, { message: 'suffix must be a Uint8Array of 2 bytes' })), new Uint8Array(2)),
			z.transform((arr) => BufferHelpersInternals.browser_bufferToHex(arr.buffer).padStart(3, '0').slice(-3)),
		),
	]),
});
export const v8Options = z.union([
	z.extend(v8OptionsBase, {
		/**
		 * Array of 16 random bytes (0-255) used to generate other fields
		 */
		random: z.optional(z.instanceof(Uint8Array).check(z.refine((arr) => arr.byteLength === 16, { message: '`random` must be a Uint8Array of 16 random bytes' }))),
	}),
	z.extend(v8OptionsBase, {
		/**
		 * Alternative to options.random, a Function that returns an Array of 16 random bytes (0-255)
		 */
		rng: z.optional(
			z.pipe(
				z.unknown(),
				z.transform((fn) => fn as () => Uint8Array),
			),
		),
	}),
]);
export type Version8Options = z.input<typeof v8Options>;

function replaceByIndex(input: string, start: number, end: number, replacement: string) {
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
