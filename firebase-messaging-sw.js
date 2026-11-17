/* Service worker de notificaciones · MIS GESTIONES */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
importScripts('firebase-config.js');
firebase.initializeApp(self.FIREBASE_CONFIG);
var messaging = firebase.messaging();
// Los mensajes llevan "notification", así que el navegador los muestra solo.
messaging.onBackgroundMessage(function () {});
self.addEventListener('notificationclick', function (ev) {
  ev.notification.close();
  var url = (ev.notification.data && ev.notification.data.FCM_MSG && ev.notification.data.FCM_MSG.fcmOptions && ev.notification.data.FCM_MSG.fcmOptions.link) || self.registration.scope;
  ev.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (ws) {
    for (var i = 0; i < ws.length; i++) { if (ws[i].url.indexOf(self.registration.scope) === 0 && 'focus' in ws[i]) return ws[i].focus(); }
    return clients.openWindow(url);
  }));
});
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (ev) { ev.waitUntil(self.clients.claim()); });
