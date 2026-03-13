# Phase 3 Home Follow-ups

## Producto y UX
- Limpieza final de copy residual no visible pero todavia presente en fuente/comentarios.
- Refinamiento opcional del mensaje `noscript` sobre JavaScript solo si producto decide suavizar ese copy; no tratarlo como bug durante estabilizacion.
- Performance y CLS de la home, con foco en mobile/tablet.
- Accesibilidad del dock y del focus visible.
- Disponibilidad real de embeds y calidad de los fallbacks.
- Refinamiento fino de header/banner post-auth.

## Follow-ups tecnicos detectados
- Revisar si el override agresivo sobre `body` en la shell puede reemplazarse por una solucion menos invasiva despues de la estabilizacion.
- Limpiar el comentario HTML residual que referencia `CONFIG (app.js)`.
- Mantener sin cambios de runtime el bloque `noscript` durante estabilizacion salvo decision expresa de producto.
- Evaluar automatizacion minima para release record, tag sugerido y build stamp.
- Revisar observabilidad de service worker y cache stale post-release.
- Consolidar una smoke test repetible para auth/hash/dock/orientacion.

## Regla de entrada a Phase 3
- No abrir estos cambios durante la ventana de estabilizacion salvo que se conviertan en bug bloqueante real.
- Priorizar primero estabilidad operativa y evidencia de comportamiento en `live`.
