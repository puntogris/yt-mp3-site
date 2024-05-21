import { error } from '@sveltejs/kit';
import ytdl from 'ytdl-core';
import ffmpeg from '../../lib/server/ffmpeg.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { url } = await request.json();

		if (!url) {
			error(500, 'Error leyendo la url');
		}

		const audioStream = ytdl(url, { filter: 'audioonly' });

		const mp3Stream = ffmpeg(audioStream).audioCodec('libmp3lame').format('mp3').pipe();

		const readableStream = new ReadableStream({
			start(controller) {
				mp3Stream.on('data', (chunk) => {
					controller.enqueue(chunk);
				});
				mp3Stream.on('end', () => {
					controller.close();
				});
				mp3Stream.on('error', (err) => {
					console.error(err);
					controller.error(err);
				});
			}
		});

		return new Response(readableStream, {
			headers: {
				'Content-Type': 'audio/mpeg'
			}
		});
	} catch (err) {
		console.error(err);
		error(500, 'Ocurrio un error descargando el audio del video');
	}
}
