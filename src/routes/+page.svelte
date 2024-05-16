<script lang="ts">
	let url = '';
	let downloading = false;

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

<div class="flex h-screen flex-col items-center justify-center gap-5">
	<input
		class="mt-14 w-full text-center text-3xl focus:outline-none"
		placeholder="link a descargar"
		bind:value={url}
	/>
	<button
		class="w-full max-w-2xl rounded-md bg-green-400 p-2 font-medium"
		disabled={downloading}
		on:click={startDownload}>Descargar</button
	>
</div>
