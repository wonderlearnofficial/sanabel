self.addEventListener("push", function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }
  const title = data.title || "تنبيه جديد";
  const options = {
    body: data.body || "إشعار من تطبيق سنابل الإحسان.",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    dir: "rtl",
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    requireInteraction: true,
    data: { url: typeof data.url === "string" ? data.url : "/notifications" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const requestedUrl = event.notification.data?.url || "/notifications";
  const targetUrl = new URL(requestedUrl, self.location.origin);
  const safePath = targetUrl.origin === self.location.origin
    ? `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
    : "/notifications";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && "focus" in client) {
          return client.navigate(safePath).then(() => client.focus());
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(safePath);
      }
    })
  );
});
