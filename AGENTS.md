# AGENTS.md

## Contexto de producto
Este repositorio soporta el Programa de Prevencion Cancer Colorrectal (PP CCR).
Objetivo UX: una web estatica (hosting) que se sienta dinamica, clara y confiable usando JavaScript progresivo.

## Formato obligatorio de salida del agente
Toda entrega debe usar este orden exacto:
1. PLAN
2. PATCH
3. RUNBOOK
4. CHECKLIST

Reglas:
- PLAN: alcance, riesgos, criterios de aceptacion.
- PATCH: diff o contenido exacto de archivos.
- RUNBOOK: comandos reproducibles para ejecutar/verificar.
- CHECKLIST: estado final y pendientes.

## Guardrails de implementacion
- Cambios pequenos e incrementales por entrega.
- Prohibidas reescrituras masivas o refactors big-bang.
- Si un cambio es grande, dividir en fases y entregar por pasos.
- Accesibilidad minima obligatoria:
  - HTML semantico.
  - Navegacion por teclado.
  - Focus visible.
  - Contraste suficiente.
  - Labels/alt/aria correctos.
- Performance minima obligatoria:
  - Evitar JS bloqueante.
  - Minimizar trabajo en main thread.
  - Evitar dependencias pesadas sin necesidad.
  - Mantener o mejorar carga percibida en movil.

## Restricciones de plataforma
- Base tecnica: sitio web estatico en hosting.
- La sensacion de dinamismo debe lograrse con JS sobre HTML/CSS existentes.
- No agregar frameworks ni librerias grandes sin justificar en PLAN:
  - problema que resuelve,
  - impacto en peso/caching,
  - alternativa nativa descartada.

## Arquitectura limpia incremental (sin romper estructura actual)
Objetivo por capas:
- domain: reglas de negocio puras, validaciones, entidades. Sin DOM ni red.
- app: casos de uso y orquestacion.
- ui: render, eventos, accesibilidad, estado visual.
- infra: adaptadores (Firebase, storage, red, config).

Direccion de dependencias:
- ui -> app -> domain
- app -> infra
- domain no depende de ui ni infra

Estrategia incremental obligatoria:
- No mover todo de golpe.
- Al tocar una feature existente, extraer una pieza pequena a la capa correcta.
- Mantener compatibilidad con estructura actual mientras migra.
- Cada extraccion debe validar funcionamiento basico.

## Regla critica de cache en assets
En firebase hosting, `assets/**` tiene cache immutable (`max-age=31536000, immutable`).
Por lo tanto:
- Prohibido colocar JS de logica de producto dentro de `/assets`.
- `/assets` solo para recursos estaticos versionados (imagenes, iconos, fuentes, etc.).
- El JS funcional debe vivir fuera de `/assets` (raiz, `scripts/`, o carpetas de capas).

## Seguridad de publicacion
- `hosting.public` apunta a `"."`; casi todo en raiz puede ser publico si no se ignora.
- Nunca subir secretos, llaves privadas, logs sensibles o `.env`.
- Verificar exclusiones antes de deploy.

## Definition of Done por cambio
- Entrega en formato PLAN -> PATCH -> RUNBOOK -> CHECKLIST.
- Sin regresiones visuales en desktop y movil.
- Sin errores de consola en las pantallas tocadas.
- Accesibilidad y performance no degradan respecto del baseline.
