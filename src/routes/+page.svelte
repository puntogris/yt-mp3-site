<script lang="ts">
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { getFFmpegInstance } from './lib/ffmpeg';

	export let data;

	const downloads = writable(data.downloads);

	let url = '';
	let error = '';
	let downloading = false;
	let progress = 0;
	let errorTimeout: NodeJS.Timeout;

	async function startDownload() {
		if (!url) return;

		downloading = true;
		error = '';

		const infoResponse = await fetch('/api/info', {
			method: 'post',
			body: JSON.stringify({ url })
		});
		if (!infoResponse.ok) {
			handleError();
			return;
		}
		const { title } = await infoResponse.json();

		const audioResponse = await fetch('/api/audio', {
			method: 'post',
			body: JSON.stringify({ url })
		});
		if (!audioResponse.body || !audioResponse.ok) {
			handleError();
			return;
		}
		const audioData = await getUint8ArrayFromBody(audioResponse.body);
		const mp3Data = await convertToMP3Format(audioData, title);
		downloadToBrowser(mp3Data, title);

		resetDownloadingAndUrl();
		incrementDownloads();
	}

	async function getUint8ArrayFromBody(body: ReadableStream<Uint8Array>): Promise<Uint8Array> {
		const reader = body.getReader();
		const buffers = [];
		let totalLength = 0;

		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				break;
			}

			buffers.push(value);
			totalLength += value.length;
		}

		const result = new Uint8Array(totalLength);
		let offset = 0;

		for (const buffer of buffers) {
			result.set(buffer, offset);
			offset += buffer.length;
		}

		return result;
	}

	async function convertToMP3Format(audioData: Uint8Array, title: string) {
		const ffmpeg = await getFFmpegInstance();

		ffmpeg.setProgress(({ ratio }) => {
			progress = Math.floor(ratio * 100);
		});

		const inputFileName = 'input.mp4';
		const outputFileName = title + '.mp3';

		ffmpeg.FS('writeFile', inputFileName, audioData);

		await ffmpeg.run('-i', inputFileName, '-c:a', 'libmp3lame', outputFileName);

		return ffmpeg.FS('readFile', outputFileName);
	}

	async function incrementDownloads() {
		const response = await fetch('api/downloads', { method: 'post' });
		if (response.ok) {
			downloads.update((n) => n + 1);
		}
	}

	function resetDownloadingAndUrl() {
		downloading = false;
		url = '';
	}

	async function handleError() {
		error = 'Ocurrio un error, valida el link e intenta nuevamente.';
		resetDownloadingAndUrl();
		clearTimeout(errorTimeout);
		errorTimeout = setTimeout(() => {
			error = '';
		}, 4000);
	}

	function downloadToBrowser(mp3Data: Uint8Array, title: string) {
		const blob = new Blob([mp3Data.buffer], { type: 'audio/mp3' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = title + '.mp3';
		link.click();
	}
</script>

{#if error}
	<div
		transition:fade
		class="absolute right-0 top-0 m-4 flex min-h-12 max-w-lg items-center overflow-hidden rounded-md border border-red-500 bg-red-50 pe-2"
	>
		<div class="absolute h-full w-1.5 bg-red-500" />
		<div class="ml-4">{error}</div>
	</div>
{/if}

<div class="flex min-h-dvh flex-col bg-amber-50">
	<div class="flex grow flex-col items-center justify-center gap-5 px-4">
		<input
			class="mt-14 w-full bg-amber-50 text-center text-lg focus:outline-none sm:text-3xl"
			placeholder="link de youtube"
			bind:value={url}
		/>
		<button
			class="relative w-full max-w-2xl overflow-hidden rounded-lg bg-green-600 p-3 font-medium text-white hover:bg-green-700 disabled:bg-green-700"
			disabled={downloading || !url}
			on:click={startDownload}
		>
			<div
				class="absolute left-0 top-0 h-full bg-green-600"
				style="width: {downloading ? `${progress}%` : '0%'}"
				hidden={!downloading}
			/>
			<span class="relative z-10"
				>{downloading ? `Descargando mp3 - ${progress}%` : 'Descargar mp3'}</span
			>
		</button>
	</div>
	<footer class="mt-auto flex w-full justify-between p-4">
		<a class="text-sm text-gray-500" href="https://www.puntogris.com/" target="_blank">Puntogris</a>
		<div class="text-sm text-gray-500">
			Descargas totales {$downloads}
		</div>
	</footer>
</div>
