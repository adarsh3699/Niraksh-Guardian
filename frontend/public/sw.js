const STATIC_CACHE = "ng-static-v2";
const PAGE_CACHE = "ng-pages-v2";
const APP_SHELL = ["/", "/offline", "/manifest.webmanifest", "/brandLogo.png"];
const PROTECTED_PATH_PREFIXES = [
	"/dashboard",
	"/disease",
	"/drug-interaction",
	"/history",
	"/lab-reports",
	"/medicine",
	"/niraksh-ai",
	"/prescription",
	"/profile",
	"/reports",
	"/symptom-analysis",
];

function isProtectedPath(pathname) {
	return PROTECTED_PATH_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then((cache) => cache.addAll(APP_SHELL))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
						.map((key) => caches.delete(key)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return;

	const requestUrl = new URL(event.request.url);
	if (requestUrl.origin !== self.location.origin) return;
	if (requestUrl.pathname.startsWith("/api")) return;
	if (requestUrl.pathname.startsWith("/_next")) {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				if (cached) return cached;
				return fetch(event.request).then((response) => {
					if (!response || !response.ok || response.status !== 200) {
						return response;
					}
					const responseClone = response.clone();
					caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, responseClone));
					return response;
				});
			}),
		);
		return;
	}

	if (event.request.mode === "navigate") {
		const cacheableNavigation = !isProtectedPath(requestUrl.pathname);
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					if (cacheableNavigation && response && response.ok && response.status === 200) {
						const responseClone = response.clone();
						caches.open(PAGE_CACHE).then((cache) => cache.put(event.request, responseClone));
					}
					return response;
				})
				.catch(async () => {
					if (cacheableNavigation) {
						const cachedPage = await caches.match(event.request);
						if (cachedPage) return cachedPage;
					}
					return caches.match("/offline");
				}),
		);
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;
			return fetch(event.request).then((response) => {
				if (!response || response.status !== 200 || response.type !== "basic") {
					return response;
				}
				const responseClone = response.clone();
				caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, responseClone));
				return response;
			});
		}),
	);
});
