# Registro de proveedores

Aplicación móvil-first para registrar proveedores con:

- Búsqueda y filtros por estado y fecha
- Orden por hora y día
- Calendario interactivo para visualizar días con actividad
- Historial persistente en navegador con almacenamiento local
- Edición rápida y eliminación
- Registro automático y resumen operativo
- Secciones adicionales: tareas pendientes, refrigerador, observaciones, cierre del día y entregas
- Soporte PWA para instalar como app en móvil o escritorio

## Ejecutar

Abre el archivo `index.html` directamente en el navegador o sirve la carpeta con un servidor local:

```bash
python3 -m http.server 8000
```

Y luego visita:

```text
http://localhost:8000
```

## Archivos principales

- `index.html` — estructura y layout
- `styles.css` — diseño visual y responsive
- `app.js` — lógica de registro, historial, filtros y calendario
- `manifest.webmanifest` — configuración de la PWA
- `sw.js` — caché para uso sin conexión
