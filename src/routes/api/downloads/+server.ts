import { error, json } from '@sveltejs/kit';
import { kv } from '../../lib/server/kv';

/** @type {import('./$types').RequestHandler} */
export async function POST() {
	try {
		await kv.incr('downloads');

		return json('All good');
	} catch (err) {
		console.error(err);
		error(500, 'Ocurrio un error al incrementar la cantidad de descargas.');
	}
}
