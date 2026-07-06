self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "تنبيه جديد";
  const options = {
    body: data.body || "إشعار من تطبيق سنابل الإحسان.",
    icon: data.icon || "/assets/snabel-logo.png",
    badge: "/assets/snabel-logo.png",
    dir: "rtl",
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If a window is open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
