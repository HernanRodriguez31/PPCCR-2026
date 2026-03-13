# Release Record: v2026-03-13-home-mobile-phase2

## Objetivo
Cerrar formalmente la release de home mobile/tablet fase 2 y dejar el proyecto en modo de estabilizacion controlada durante 24-48 horas, sin cambios funcionales nuevos.

## Estado publicado
- Fecha de cierre documental: `2026-03-13`
- Publicacion a `live`: `2026-03-12 22:40:32` ART (`2026-03-13T01:40:32Z`)
- Commit publicado: `16d324e`
- Version Firebase Hosting: `31590a703f3f1f0a`
- URL `live`: `https://ppccr-2026.web.app`
- URL `preview`: `https://ppccr-2026--phase2-release-20260313-5koj3rgz.web.app`
- URL `backup`: `https://ppccr-2026--live-backup-20260313-1-w15nvmb2.web.app`
- Token de assets: `20260313-home-phase2-release-blockers1`
- SW cache shell: `ppccr-shell-v20260313-release-blockers-1`
- SW cache static: `ppccr-static-v20260313-release-blockers-1`

## Evidencia de paridad repo/live
- `public/index.html` SHA256 local/live:
  - `b8ff8dcbe6d54ff6c60b5c0be4de50a551ec72d0ec7cac71831924c94f0893cc`
- `public/sw.js` SHA256 local/live:
  - `d0398b68bc979d3e9127e351c075512d4602953381902355aef5a1421b4a1b2b`
- `backup` sigue apuntando a la release previa:
  - token `20260312-home-phase2-polish1`
  - conserva copy tecnica visible vieja (`CONFIG.embeds...`, `app.js`, `requiere JavaScript`)

## Smoke test ejecutada
- Preview `390x844`: login real `Parque Saavedra` + `marzo31`, banner fijo, dock fijo y `KPIs/Reporte` navegando a `#kpis`.
- Preview deep link `/#kpis`: post-auth queda en KPIs, con `hash=#kpis` y estado activo correcto en nav fuente y dock.
- Preview resize/orientation: `390x844 -> 844x390 -> 390x844`, identidad visible, dock visible, hash estable y active state estable.
- Preview `back-to-top`: limpia hash y vuelve a `scrollY=0` con `Inicio` activo.
- Live `390x844`: login real OK, banner fijo, dock fijo, active state correcto.
- Live deep link `/#kpis`: post-auth queda en KPIs, `hash=#kpis`, banner y dock visibles.
- Live resize/orientation: `390x844 -> 844x390 -> 390x844`, identidad y dock visibles en todo el flujo.
- Live `back-to-top`: `hash=""`, `scrollY=0`, `Inicio` activo.
- Consola en preview y live: `Errors: 0`.

## Copy tecnica visible
- La verificacion sobre texto visible en DOM de `live` dio negativa para:
  - `CONFIG.embeds`
  - `app.js`
  - referencias a configuracion interna
- `live` sigue mostrando un mensaje visible dentro de `noscript`:
  - `Los reportes y otras visualizaciones interactivas requieren JavaScript habilitado.`
- Ese mensaje se considera copy funcional de usuario final, no leakage tecnica ni instruccion interna de configuracion.
- Nota: `curl` sobre el HTML sigue encontrando `app.js` por tags de assets y un comentario no visible (`CONFIG (app.js)`); eso no esta expuesto al usuario final.

## Resultado final
- Estado final: release estable y publicada.
- Blockers funcionales abiertos: ninguno.
- Modo operativo: estabilizacion 24-48h.
- Ventana de estabilizacion:
  - inicio: `2026-03-12 22:40:32` ART
  - cierre sugerido: `2026-03-14 22:40:32` ART

## Rollback
```bash
firebase hosting:clone ppccr-2026:live-backup-20260313-1 ppccr-2026:live
```

## Tag local sugerido
```bash
git tag -a v2026.03.13-home-mobile-phase2 -m "Release v2026.03.13-home-mobile-phase2"
```

## Alternativa segura si el tag ya existiera
```bash
git tag -a v2026.03.13-home-mobile-phase2-r1 -m "Release v2026.03.13-home-mobile-phase2-r1"
```
