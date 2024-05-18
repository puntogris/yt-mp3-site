import { PRIVATE_KV_REST_API_TOKEN, PRIVATE_KV_REST_API_URL } from '$env/static/private';
import { createClient } from '@vercel/kv';

export const kv = createClient({
	url: PRIVATE_KV_REST_API_URL,
	token: PRIVATE_KV_REST_API_TOKEN
});

export const KV_DOWNLOADS_KEY = 'downloads';
