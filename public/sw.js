const CACHE_NAME = "shubhprompt-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/favicon.png",
  "/logo.png",
  "/manifest.json"
];

// Perform install & cache static boilerplate assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate & clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch events
self.addEventListener("fetch", (event) => {
  const reqUrl = new URL(event.request.url);

  // Skip POST, PUT, DELETE or non-http requests (like extension-specific schemas)
  if (event.request.method !== "GET" || !reqUrl.protocol.startsWith("http")) {
    return;
  }

  // Handle API dynamic data retrieval (/api/data)
  if (reqUrl.pathname === "/api/data" || reqUrl.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        // Stale-While-Revalidate execution: match first, fetch and update cache in background
        const match = cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            // Handled offline graceful fallback
            return match || Response.error();
          });

        return match.then((cachedResponse) => {
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Handle Unsplash images or local public images
  if (
    reqUrl.hostname.includes("images.unsplash.com") || 
    reqUrl.pathname.startsWith("/uploads/") || 
    reqUrl.pathname.includes(".png") ||
    reqUrl.pathname.includes(".jpg") ||
    reqUrl.pathname.includes(".jpeg") ||
    reqUrl.pathname.includes(".webp")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Fetch clean copy in the background to update cache, but serve immediately
            fetch(event.request).then((networkRes) => {
              if (networkRes && networkRes.status === 200) {
                cache.put(event.request, networkRes);
              }
            }).catch(() => {});
            return cachedResponse;
          }
          return fetch(event.request).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(event.request, networkRes.clone());
            }
            return networkRes;
          }).catch(() => {
            // Placeholder standard grey square image for offline mode
            return new Response(
              `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#1e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-family="sans-serif">Offline Asset</text></svg>`,
              { headers: { "Content-Type": "image/svg+xml" } }
            );
          });
        });
      })
    );
    return;
  }

  // Standard static assets / build bundles (cache with fallback to network)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache static build assets if appropriate
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          (reqUrl.pathname.includes("/assets/") || reqUrl.pathname.endsWith(".css") || reqUrl.pathname.endsWith(".js"))
        ) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline asset fallback index.html for SPA page loads
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
        return Response.error();
      });
    })
  );
});
