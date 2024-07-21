import { error, json } from '@sveltejs/kit';
import ytdl from '@distube/ytdl-core';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { url } = await request.json();

		if (!url) {
			error(500);
		}

		const info = await ytdl.getBasicInfo(url);

		return json({ title: info.videoDetails.title });
	} catch (err) {
		console.error(err);
		error(500, 'Ocurrio un error al buscar la información del video');
	}
}
