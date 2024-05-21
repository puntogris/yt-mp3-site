import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

function crossOriginIsolationMiddleware(_, response, next) {
	response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
	response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
	response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
	next();
}

const crossOriginIsolation = {
	name: 'cross-origin-isolation',
	configureServer: (server) => {
		server.middlewares.use(crossOriginIsolationMiddleware);
	},
	configurePreviewServer: (server) => {
		server.middlewares.use(crossOriginIsolationMiddleware);
	}
};

export default defineConfig({
	plugins: [crossOriginIsolation, sveltekit()]
});
