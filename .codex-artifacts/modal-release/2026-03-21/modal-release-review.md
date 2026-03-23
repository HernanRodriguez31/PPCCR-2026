# Modal Release Review

## Resumen ejecutivo

El modal `Entrevista Inicial` quedó estable en desktop sobre un origen limpio sin caché. En Chromium local sobre macOS, los pasos `1`, `2` y `4` no requieren scroll vertical en los viewports objetivo, el paso `3` sí scrollea como se espera, no aparece scroll horizontal y el footer se mantiene estable durante navegación y resize.

Durante este gate apareció un bug real de accesibilidad: el tab order del modal incluía controles ocultos de pasos no visibles y permitía escapar del diálogo. Eso se corrigió en runtime con un patch mínimo en [public/app.js](/Users/hernanrodriguez/Documents/Workspaces/Creacion%20de%20Paginas%20Web/PP%20CCR%202026%20Interinstitucional/public/app.js) para filtrar elementos ocultos por ancestros `[hidden]` / `[aria-hidden="true"]`. Revalidado en un origen nuevo, `Tab` y `Shift+Tab` quedan contenidos dentro del modal.

## Veredicto final

`CONDITIONAL GO`

## Qué fue validación directa y qué fue simulación

- Validación directa: Chromium local sobre macOS, servido desde `http://127.0.0.1:8091/index.html?qa=release-gate-final`.
- Simulación Windows: override temporal scoped del modal con `font-family: "Segoe UI", Arial, sans-serif`, sin persistir ningún hack en el repo.
- No hubo validación en una PC Windows física en esta fase.

## Viewports validados

- `1280x720`
- `1366x768`
- `1440x900`
- `1536x864`
- Barrida de monotonicidad adicional: `1366x720`, `1366x736`, `1366x760`, `1366x768`, `1366x800`, `1366x864`, `1366x900`
- Smoke mobile: `390x844`

## Estado por paso

| Viewport | Paso 1 | Paso 2 | Paso 3 | Paso 4 |
| --- | --- | --- | --- | --- |
| `1280x720` | PASS `496/496 delta 0` | PASS `496/496 delta 0` | PASS `496/764 delta 268` | PASS `496/496 delta 0` |
| `1366x768` | PASS `543/543 delta 0` | PASS `543/543 delta 0` | PASS `543/764 delta 221` | PASS `543/543 delta 0` |
| `1440x900` | PASS `558/558 delta 0` | PASS `558/558 delta 0` | PASS `558/764 delta 206` | PASS `558/558 delta 0` |
| `1536x864` | PASS `558/558 delta 0` | PASS `558/558 delta 0` | PASS `558/764 delta 206` | PASS `558/558 delta 0` |

## Smoke del modal como componente

- Apertura: correcta.
- Navegación pasos `1 -> 2 -> 3 -> 4`: correcta.
- Reinicio: vuelve a paso `1`, `maxUnlockedStep` vuelve a `1`, `scrollTop` vuelve a `0`.
- Cierre con botón visual: correcto, foco restaurado al opener `#startInterviewBtn`.
- Cierre con `Escape`: correcto, foco restaurado al opener `#startInterviewBtn`.
- Tab order: contenido dentro del modal con `Tab` y `Shift+Tab`.
- Overflow hints del paso `3`: correctos arriba y abajo.
- Resize live `1440x900 -> 1366x768 -> 1280x720`: estable, sin cambio de altura del footer.

## Monotonicidad vertical

| Viewport | Card | Body útil |
| --- | ---: | ---: |
| `1366x720` | `698.40` | `496` |
| `1366x736` | `713.91` | `512` |
| `1366x760` | `737.20` | `535` |
| `1366x768` | `744.95` | `543` |
| `1366x800` | `760` | `558` |
| `1366x864` | `760` | `558` |
| `1366x900` | `760` | `558` |

No aparece una discontinuidad regresiva alrededor de `760/768`.

## Capturas

- `.codex-artifacts/modal-release/2026-03-21/direct-1366x768-step1.png`
- `.codex-artifacts/modal-release/2026-03-21/direct-1366x768-step2.png`
- `.codex-artifacts/modal-release/2026-03-21/direct-1366x768-step3.png`
- `.codex-artifacts/modal-release/2026-03-21/direct-1366x768-step4.png`
- `.codex-artifacts/modal-release/2026-03-21/direct-1440x900-step1.png`
- `.codex-artifacts/modal-release/2026-03-21/direct-1440x900-step2.png`
- `.codex-artifacts/modal-release/2026-03-21/direct-1440x900-step3.png`
- `.codex-artifacts/modal-release/2026-03-21/direct-1440x900-step4.png`
- `.codex-artifacts/modal-release/2026-03-21/simulated-segoe-1366x768-step2.png`

## Riesgos residuales

- No hubo validación visual en Windows físico.
- Hay una deuda operativa de cache busting: [public/index.html](/Users/hernanrodriguez/Documents/Workspaces/Creacion%20de%20Paginas%20Web/PP%20CCR%202026%20Interinstitucional/public/index.html#L31) carga `styles.css?v=20260315-cronograma-desktop-refine1`, mientras [public/sw.js](/Users/hernanrodriguez/Documents/Workspaces/Creacion%20de%20Paginas%20Web/PP%20CCR%202026%20Interinstitucional/public/sw.js#L10) sigue precacheando `styles.css?v=20260311-home-sponsors-spacing1`. Eso no invalida el layout actual, pero puede requerir hard refresh en clientes con cache vieja.

## Checklist manual de 5 minutos desde Mac

1. Abrí `direct-1366x768-step1.png` a `direct-1366x768-step4.png`.
2. Verificá que en pasos `1`, `2` y `4` no haya barra vertical visible dentro del cuerpo del modal.
3. En paso `3`, verificá que el contenido más largo siga siendo legible y no “rompa” footer ni stepper.
4. Abrí `direct-1440x900-step1.png` a `direct-1440x900-step4.png` para confirmar que el modal no quedó aplastado en pantallas más altas.
5. Abrí `simulated-segoe-1366x768-step2.png` y comparalo con `direct-1366x768-step2.png`. Lo que tenés que mirar es si la UI sigue entrando con una métrica tipográfica más cercana a Windows.

## Qué mirar en cada paso

- Paso 1:
  - inputs de estación, participante, fecha/hora, edad y sexo visibles sin corte;
  - botón primario visible sin scroll;
  - footer estable.
- Paso 2:
  - checklist entero visible sin scroll;
  - banner de estado y panel legibles;
  - sin wrapping torpe en el stepper.
- Paso 3:
  - scroll vertical presente y contenido no comprimido;
  - hints de overflow funcionando;
  - footer fijo y usable.
- Paso 4:
  - formulario de contacto completo visible sin scroll;
  - inputs y labels alineados;
  - CTA final visible y sin clipping.
