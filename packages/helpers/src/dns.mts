/**
 * Supported parameters for Cloudflare's 1.1.1.1 DNS over HTTPS API
 */
export interface DohBodyRequest {
	/** Query name (required) */
	name: string;

	/** Query type - either a numeric value or text. Default is 'A' */
	type?: string | number;

	/**
	 * DO bit - whether the client wants DNSSEC data.
	 * Either empty or one of `0`, `false`, `1`, or `true`. Default is `false`
	 */
	do?: string | number | boolean;

	/**
	 * CD bit - disable validation.
	 * Either empty or one of `0`, `false`, `1`, or `true`. Default is `false`
	 */
	cd?: string | number | boolean;
}

/**
 * A record structure with name, type, TTL, and data.
 */
interface Record {
	/** The record owner */
	name: string;
	/** The type of DNS record. Defined here: https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-4 */
	type: number;
	/** The number of seconds the answer can be stored in cache before it is considered stale */
	TTL: number;
	/** The value of the DNS record for the given name and type. The data will be in text for standardized record types and in hex for unknown types */
	data: string;
}

/**
 * A successful DNS response from Cloudflare's 1.1.1.1 DNS over HTTPS API
 */
export interface DohSuccessfulResponse {
	/** The Response Code of the DNS Query. Defined here: https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-6 */
	Status: number;
	/** True if the truncated bit was set. This happens when the DNS answer is larger than a single UDP or TCP packet */
	TC: boolean;
	/** True if the Recursive Desired bit was set. This is always set to true for Cloudflare DNS over HTTPS */
	RD: boolean;
	/** True if the Recursion Available bit was set. This is always set to true for Cloudflare DNS over HTTPS */
	RA: boolean;
	/** True if every record in the answer was verified with DNSSEC */
	AD: boolean;
	/** True if the client asked to disable DNSSEC validation. In this case, Cloudflare will still fetch the DNSSEC-related records, but it will not attempt to validate the records */
	CD: boolean;
	/** The record name requested */
	Question: Record[];
	/** The answer record */
	Answer?: Record[];
	/** The authority record */
	Authority: Record[];
	/** The additional record */
	Additional: Record[];
	/** List of EDE messages. Refer to Extended DNS error codes for more information */
	Comment?: string[];
}

/**
 * An error response from Cloudflare's 1.1.1.1 DNS over HTTPS API
 */
export interface DohErrorResponse {
	/** An explanation of the error that occurred */
	error: string;
}

export class DnsHelpers {
	private nameserver_url: URL;

	constructor(nameserver_url: string | URL) {
		this.nameserver_url = new URL(nameserver_url);
	}

	public query(qName: string, qType: string | number = 'A', qDo: string | number | boolean = false, qCd: string | number | boolean = false, timeout: number = 10 * 1000) {
		return new Promise<DohSuccessfulResponse | DohErrorResponse>((resolve, reject) => {
			this.sendDohMsg(timeout, this.makeGetQuery(this.nameserver_url, qName, qType, qDo, qCd))
				.then((response) => {
					if (response.ok) {
						response.json().then(resolve).catch(reject);
					} else {
						// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
						reject(response.status);
					}
				})
				.catch(reject);
		});
	}

	private makeGetQuery(url: URL, qName: string, qType: string | number = 'A', qDo: string | number | boolean = false, qCd: string | number | boolean = false): URL {
		url.searchParams.set('name', qName);
		url.searchParams.set('type', qType.toString());
		url.searchParams.set('do', qDo.toString());
		url.searchParams.set('cd', qCd.toString());

		return url;
	}

	private async sendDohMsg(timeout: number = 10 * 1000, url: URL = this.nameserver_url): Promise<Response> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeout);

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Accept: 'application/dns-json',
			},
			signal: controller.signal,
		});

		clearTimeout(timer);

		if (response.ok || response.status === 304) {
			return response;
		} else {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
	}
}
