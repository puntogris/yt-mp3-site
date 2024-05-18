import { kv } from './lib/server/kv';

export async function load() {
	try {
		const downloads = await kv.get('downloads');

		return {
			downloads: getNumberOrZero(downloads)
		};
	} catch (error) {
		return {
			downloads: 0
		};
	}
}

function getNumberOrZero(value: unknown): number {
	if (typeof value === 'number' && !Number.isNaN(value)) {
		return value;
	} else {
		return 0;
	}
}
