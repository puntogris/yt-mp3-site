import { error, json } from '@sveltejs/kit';
import ytdl from 'ytdl-core';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { url } = await request.json();

		if (!url) {
			error(500, 'Error leyendo la url');
		}

		const info = await ytdl.getBasicInfo(url);

		return json({ title: info.videoDetails.title });
	} catch (err) {
		console.error(err);
		error(500, 'Ocurrio un error al buscar la información del video');
	}
}
