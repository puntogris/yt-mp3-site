<script lang="ts">
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';

	export let data;

	const downloads = writable(data.downloads);

	let url = '';
	let error = '';
	let downloading = false;
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
		const blobUrl = await getBloblUrlFromBody(audioResponse.body);

		downloadToBrowser(blobUrl, title);
		resetDownloadingAndUrl();
		incrementDownloads();
	}

	async function getBloblUrlFromBody(body: ReadableStream<Uint8Array>): Promise<string> {
		const reader = body.getReader();
		const audioChunks: Uint8Array[] = [];

		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				break;
			}
			audioChunks.push(value);
		}

		const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
		return URL.createObjectURL(audioBlob);
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

	function downloadToBrowser(url: string, title: string) {
		const link = document.createElement('a');
		link.href = url;
		link.download = title + '.mp3';
		link.click();
	}
</script>

{#if error}
	<div
		transition:fade
		class="absolute right-0 top-0 m-4 flex max-w-lg items-center gap-2 overflow-hidden rounded border border-red-500 bg-red-50 pe-2"
	>
		<div class="h-8 w-2 bg-red-500" />
		<p>{error}</p>
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
			class="w-full max-w-2xl rounded-lg bg-green-600 p-3 font-medium text-white hover:bg-green-700 disabled:bg-green-700"
			disabled={downloading || !url}
			on:click={startDownload}
		>
			{downloading ? 'Descargando mp3' : 'Descargar mp3'}
		</button>
	</div>
	<footer class="mt-auto flex w-full justify-between p-4">
		<a class="text-sm text-gray-500" href="https://www.puntogris.com/" target="_blank">Puntogris</a>
		<div class="text-sm text-gray-500">
			Descargas totales {$downloads}
		</div>
	</footer>
</div>
