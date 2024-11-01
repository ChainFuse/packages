import type { CronExport, UndefinedProperties } from '@chainfuse/types';
import { fieldsToExpression, parseExpression, type CronExpression } from 'cron-parser';

export class CronHelpers {
	public static cronConvert(input: CronExport['string']): CronExport;
	public static cronConvert(input: CronExport['array']): CronExport;
	public static cronConvert(input: CronExport['object']): CronExport;
	public static cronConvert(input: undefined): UndefinedProperties<CronExport>;
	public static cronConvert(input?: CronExport['string'] | CronExport['array'] | CronExport['object']): CronExport | UndefinedProperties<CronExport> {
		if (input) {
			let parsed: CronExpression<false>;

			if (typeof input === 'string') {
				parsed = parseExpression(input, { utc: true });
			} else if (Array.isArray(input)) {
				parsed = parseExpression(input.join(' '), { utc: true });
			} else {
				parsed = fieldsToExpression(input, { utc: true });
			}

			return {
				string: parsed.stringify(true) as CronExport['string'],
				array: [parsed.fields.second, parsed.fields.minute, parsed.fields.hour, parsed.fields.dayOfMonth, parsed.fields.month, parsed.fields.dayOfWeek],
				object: parsed.fields,
			};
		} else {
			return {
				string: undefined,
				array: undefined,
				object: undefined,
			};
		}
	}
}
