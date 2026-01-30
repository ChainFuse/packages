import { ok, strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DnsHelpers, DNSRecordType } from '../dist/dns.mjs';

class MemoryCache {
	private requestIndex = new Map<string, Request>();
	private responses = new WeakMap<Request, Response>();
	public putCalls = 0;

	public match(request: Request): Promise<Response | undefined> {
		const indexedRequest = this.requestIndex.get(request.url);
		if (!indexedRequest) {
			return Promise.resolve(undefined);
		}
		const response = this.responses.get(indexedRequest);
		return Promise.resolve(response?.clone());
	}

	public put(request: Request, response: Response): Promise<void> {
		this.putCalls++;
		this.requestIndex.set(request.url, request);
		this.responses.set(request, response.clone());
		return Promise.resolve();
	}

	public delete(request: Request): Promise<boolean> {
		const indexedRequest = this.requestIndex.get(request.url);
		if (!indexedRequest) {
			return Promise.resolve(false);
		}
		this.requestIndex.delete(request.url);
		this.responses.delete(indexedRequest);
		return Promise.resolve(true);
	}
}

class MemoryCacheStorage {
	public readonly cache = new MemoryCache();

	public open(name: string): Promise<Cache> {
		void name;
		return Promise.resolve(this.cache as unknown as Cache);
	}
}

void describe('DnsHelpers', () => {
	void it('resolves via https with expected response shape', async () => {
		const dns = new DnsHelpers({ nameservers: ['https://dns.google/dns-query', 'https://cloudflare-dns.com/dns-query'] }, null);
		const result = await dns.query({
			questions: [
				{
					hostname: 'microsoft.com',
					recordType: DNSRecordType['A (IPv4 Address)'],
				},
			],
		});

		strictEqual(typeof result.flags['Official Authority'], 'boolean');
		strictEqual(typeof result.flags['Recursion Available'], 'boolean');
		ok((result.answers ?? []).filter((answer) => String(answer.type) === 'A').length >= 1);
	});

	void it('supports multiple questions in a single request', async () => {
		const dns = new DnsHelpers({ nameservers: ['https://dns.google/dns-query', 'https://cloudflare-dns.com/dns-query'] }, null);
		const result = await dns.query({
			questions: [
				{
					hostname: 'microsoft.com',
					recordType: DNSRecordType['A (IPv4 Address)'],
				},
				{
					hostname: 'microsoft.com',
					recordType: DNSRecordType['AAAA (IPv6 Address)'],
				},
			],
		});

		strictEqual(typeof result.flags['Official Authority'], 'boolean');
		ok((result.answers ?? []).filter((answer) => String(answer.type) === 'A').length >= 1);
		ok((result.answers ?? []).filter((answer) => String(answer.type) === 'AAAA').length < 1);
	});

	void it('resolves via tls with expected response shape', async () => {
		const dns = new DnsHelpers({ nameservers: ['tls://dns.google', 'tls://cloudflare-dns.com'] }, null);
		const result = await dns.query({
			questions: [
				{
					hostname: 'microsoft.com',
					recordType: DNSRecordType['A (IPv4 Address)'],
				},
			],
		});

		strictEqual(typeof result.flags['Official Authority'], 'boolean');
		strictEqual(typeof result.flags['Recursion Available'], 'boolean');
		ok((result.answers ?? []).filter((answer) => String(answer.type) === 'A').length >= 1);
	});

	void it('supports multiple questions via tls', async () => {
		const dns = new DnsHelpers({ nameservers: ['tls://dns.google', 'tls://cloudflare-dns.com'] }, null);
		const result = await dns.query({
			questions: [
				{
					hostname: 'microsoft.com',
					recordType: DNSRecordType['A (IPv4 Address)'],
				},
				{
					hostname: 'microsoft.com',
					recordType: DNSRecordType['AAAA (IPv6 Address)'],
				},
			],
		});

		strictEqual(typeof result.flags['Official Authority'], 'boolean');
		ok((result.answers ?? []).filter((answer) => String(answer.type) === 'A').length >= 1);
		ok((result.answers ?? []).filter((answer) => String(answer.type) === 'AAAA').length === 0);
	});

	void it('uses cache on subsequent lookups', async () => {
		const cacheStorage = new MemoryCacheStorage();

		const dns = new DnsHelpers({ nameservers: ['https://dns.google/dns-query', 'https://cloudflare-dns.com/dns-query'] }, cacheStorage);
		const result1 = await dns.query({
			questions: [
				{
					hostname: 'microsoft.com',
					recordType: DNSRecordType['A (IPv4 Address)'],
				},
			],
		});

		const result2 = await dns.query({
			questions: [
				{
					hostname: 'microsoft.com',
					recordType: DNSRecordType['A (IPv4 Address)'],
				},
			],
		});

		strictEqual(cacheStorage.cache.putCalls, 1);

		strictEqual(typeof result1.flags['Official Authority'], 'boolean');
		strictEqual(typeof result1.flags['Recursion Available'], 'boolean');
		ok((result1.answers ?? []).filter((answer) => String(answer.type) === 'A').length >= 1);

		strictEqual(typeof result2.flags['Official Authority'], 'boolean');
		strictEqual(typeof result2.flags['Recursion Available'], 'boolean');
		ok((result2.answers ?? []).filter((answer) => String(answer.type) === 'A').length >= 1);
	});

	void it('rejects when aborted', () => {
		const dns = new DnsHelpers({ nameservers: ['https://dns.google/dns-query', 'https://cloudflare-dns.com/dns-query'] }, null);
		const controller = new AbortController();
		controller.abort(new Error('Abort test'));

		throws(
			() =>
				dns.query({
					questions: [
						{
							hostname: 'microsoft.com',
							recordType: DNSRecordType['A (IPv4 Address)'],
						},
					],
					timeout: controller.signal,
				}),
			/Abort test/,
		);
	});
});
