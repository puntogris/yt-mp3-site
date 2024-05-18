<script lang="ts">
	import { writable } from 'svelte/store';

	export let data;

	const downloads = writable(data.downloads);

	let url = '';
	let downloading = false;

	$: downloadText = downloading ? 'Descargando mp3' : 'Descargar mp3';

	async function startDownload() {
		downloading = true;

		if (!url) {
			downloading = false;
			return;
		}

		const body = JSON.stringify({ url });

		const infoResponse = await fetch('/api/info', { method: 'post', body });
		if (!infoResponse.ok) {
			downloading = false;
			return;
		}

		const { title } = await infoResponse.json();
		let audioChunks: Uint8Array[] = [];

		fetch('/api/audio', { method: 'post', body })
			.then((response) => {
				if (!response.body || !response.ok) {
					throw Error('Ocurrio un error!');
				}
				const reader = response.body.getReader();

				function read() {
					return reader.read().then(({ value, done }) => {
						if (done) {
							return;
						}
						audioChunks.push(value);
						return read();
					});
				}
				return read();
			})
			.then(() => {
				const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
				const blobUrl = URL.createObjectURL(audioBlob);
				console.log(audioBlob.size);
				downloadToBrowser(blobUrl, title);
				downloading = false;
				url = '';
				audioChunks = [];

				fetch('api/downloads', { method: 'post' }).then(() => {
					downloads.update((n) => n + 1);
				});
			})
			.catch((error) => {
				console.error('Error:', error);
			});
	}

	function downloadToBrowser(url: string, title: string) {
		const link = document.createElement('a');
		link.href = url;
		link.download = title + '.mp3';
		link.click();
	}
</script>

<div class="flex min-h-screen flex-col">
	<div class="flex grow flex-col items-center justify-center gap-5 px-4">
		<input
			class="mt-14 w-full text-center text-lg focus:outline-none sm:text-3xl"
			placeholder="link de youtube"
			bind:value={url}
		/>
		<button
			class="w-full max-w-2xl rounded-md bg-green-400 p-2 font-medium text-gray-800 hover:bg-green-300"
			disabled={downloading}
			on:click={startDownload}>{downloadText}</button
		>
	</div>

	<footer class="mt-auto flex w-full justify-between p-4">
		<a class="text-gray-400 max-sm:text-sm" href="https://www.puntogris.com/" target="_blank"
			>Puntogris</a
		>
		<div class="text-gray-400 max-sm:text-sm">Descargas totales {$downloads}</div>
	</footer>
</div>
