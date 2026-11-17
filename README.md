# MIS GESTIONES

App del repartidor: paquetes entregados, efectivo cobrado (PDA) e ingresado (tickets de Prosegur), y comparación con el extracto y la liquidación de SEUR.

- **App:** https://josemanuelluzardo4-design.github.io/mis-gestiones/
- **Datos:** Firebase (proyecto `mis-gestiones`), solo accesibles con la cuenta del repartidor. Reglas en `firestore.rules`.
- **Avisos:** `.github/workflows/avisos.yml` ejecuta `notificaciones/enviar.js` cada 30 minutos por la tarde. Necesita el secreto `FIREBASE_SERVICE_ACCOUNT` (clave de cuenta de servicio de Firebase) en *Settings → Secrets and variables → Actions*.
