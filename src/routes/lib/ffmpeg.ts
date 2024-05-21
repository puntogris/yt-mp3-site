import { createFFmpeg } from '@ffmpeg/ffmpeg';

let loaded = false;

const ffmpeg = createFFmpeg({ log: false });

export async function getFFmpegInstance() {
	if (!loaded) {
		await ffmpeg.load();
		loaded = true;
	}
	return ffmpeg;
}
