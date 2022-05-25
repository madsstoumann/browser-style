/**
 * buildSW
 * @version 1.0.00
 * @summary 05-25-2022
 * @author Mads Stoumann
 * @description Builds a serviceWorker with the given paths (for file-cache) and version
*/
import { readdirSync, writeFileSync } from 'fs'

function cacheList(paths, version) {
	const arr = [];
	for (const path of paths) {
		const files = readdirSync(path, { withFileTypes: true })
		for (const file of files) {
			if (!file.name.startsWith('.') ) {
				arr.push(`'${path}/${file.name}${version}'`)
			}
		}
	}
	return arr;
}

function buildServiceWorker(paths, version) {
	return `const CACHE_NAME = 'static-cache-v${version ? version : '0'}';
const FILES_TO_CACHE = [
	${cacheList(paths, (version ? `?v=${version}` : '')).join(',\n\t')}
];

self.addEventListener('install', (evt) => {
	evt.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(FILES_TO_CACHE);
		}).then(self.skipWaiting())
	);
});

self.addEventListener('activate', (evt) => {
	evt.waitUntil(
		caches.keys().then((keyList) => {
			return Promise.all(keyList.map((key) => {
				if (key !== CACHE_NAME) {
					return caches.delete(key);
				}
			}));
		})
	);
	self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
	evt.respondWith(
		caches.open(CACHE_NAME).then(async cache => {
			const cacheResponse = await cache.match(evt.request);
			if (evt.request.cache === 'only-if-cached' && evt.request.mode !== 'same-origin') {
				return;
			}
			return cacheResponse || fetch(evt.request).then(networkResponse => {
				cache.put(evt.request, networkResponse.clone());
				return networkResponse;
			}).catch(function(e){
				return new Response("", { "status" : 500 , "statusText" : "offline" });
		 });
		})
	)
});`
}

/*
Fill out correct paths for files to cache, then in a node-prompt run:
$ node cachelist.mjs

In `main.js` or similar, add:
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
*/

const paths = [
	'components',
	'css',
	'css/components',
	'js',
	'svg',
	'tags'
];

writeFileSync('sw.js', buildServiceWorker(paths, ''))