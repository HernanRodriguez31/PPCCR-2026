# Post-Release Checklist

## Ventana de observacion
- Duracion objetivo: 24-48 horas desde la publicacion a `live`.
- Inicio de referencia: `2026-03-12 22:40:32` ART.
- Objetivo: detectar regresiones reales sin abrir trabajo cosmetico ni nuevas features.

## Pruebas manuales prioritarias
- [ ] Login real en mobile `390x844`.
- [ ] Deep link real a `/#kpis` con login posterior.
- [ ] Rotacion `390x844 -> 844x390 -> 390x844`.
- [ ] `back-to-top` limpiando hash y reactivando `Inicio`.
- [ ] Hard refresh y reapertura de la URL para validar SW/cache.
- [ ] Links criticos:
  - [ ] Guías
  - [ ] Registro por rol
  - [ ] KPIs / reporte
  - [ ] Cronograma
- [ ] Fallbacks de embeds sin copy tecnica visible.
- [ ] Mensaje `noscript` verificado: la guia sobre JavaScript para reportes interactivos sigue siendo copy funcional esperada y no se clasifica como regresion.

## Que monitorear
- Flujo auth/login y persistencia de sesion.
- Hash post-auth y sincronizacion de active states.
- Dock fijo y banner de identidad en mobile y tablet.
- Cambios de orientacion y resize sin perdida de UI auth.
- Links criticos y formularios clave.
- Carga de KPIs/reportes y fallbacks de calendario/embeds.
- Service worker sirviendo el token correcto y sin cache vieja visible.

## Criterios de aceptacion
- No hay errores de consola en los flujos tocados.
- `live` sigue sirviendo el token `20260313-home-phase2-release-blockers1`.
- No reaparece copy tecnica visible al usuario (`CONFIG.embeds`, `app.js`, instrucciones internas).
- El mensaje visible sobre reportes interactivos que requieren JavaScript se mantiene estable y no se clasifica como leakage tecnica.
- Auth, hash, dock, orientacion y `back-to-top` se mantienen estables en mobile/tablet.
- No aparece necesidad de rollback ni hotfix urgente.

## Criterios de hotfix
- Aparece una regresion verificable en `live` sobre:
  - auth/login
  - hash post-auth
  - dock fijo
  - orientacion/resize
  - links criticos
  - fallos de carga que bloquean uso operativo
- El fix es pequeno, acotado y re-smokeable.

## Checklist corta por dispositivo

### Mobile
- [ ] Login real OK.
- [ ] Banner fijo visible.
- [ ] Dock fijo visible.
- [ ] `KPIs/Reporte` lleva a `#kpis`.
- [ ] `back-to-top` limpia hash.

### Tablet
- [ ] Identidad visible en landscape.
- [ ] Dock visible en landscape.
- [ ] Hash y active state no se desincronizan.
- [ ] Rotacion ida y vuelta sin UI oculta.

### Desktop
- [ ] Home carga sin copy tecnica visible.
- [ ] Nav fuente mantiene active state correcto.
- [ ] Links criticos y reportes accesibles.
- [ ] Sin errores de consola en la home.
