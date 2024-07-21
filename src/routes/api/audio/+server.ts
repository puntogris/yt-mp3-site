import { error } from '@sveltejs/kit';
import ytdl from '@distube/ytdl-core';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { url } = await request.json();

		if (!url) {
			error(500, 'Error leyendo la url');
		}
		const audioStream = ytdl(url, { filter: 'audioonly' });

		const readableStream = new ReadableStream({
			start(controller) {
				audioStream.on('data', (chunk) => {
					controller.enqueue(chunk);
				});
				audioStream.on('end', () => {
					controller.close();
				});
				audioStream.on('error', (err) => {
					console.error(err);
					controller.error(err);
				});
			}
		});

		return new Response(readableStream, {
			headers: {
				'Content-Type': 'audio/mpeg',
				'Cross-Origin-Opener-Policy': 'same-origin',
				'Cross-Origin-Embedder-Policy': 'require-corp'
			}
		});
	} catch (err) {
		console.error(err);
		error(500, 'Ocurrio un error descargando el audio del video');
	}
}
