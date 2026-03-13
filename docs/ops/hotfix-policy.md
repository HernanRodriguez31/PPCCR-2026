# Hotfix Policy During Stabilization

## Alcance permitido
Durante estabilizacion solo se puede tocar lo que corrija una regresion verificada en `live` sobre:
- auth/login
- hash post-auth
- dock fijo
- orientacion o resize
- links criticos
- fallos de carga operativa

## Alcance no permitido
Durante estabilizacion no se toca:
- redisenos
- cambios cosmeticos amplios
- nuevas features
- refactors amplios
- limpieza oportunista fuera del problema reportado

## Flujo de decision
1. Reproducir el problema en `live`.
2. Confirmar impacto y alcance operativo.
3. Clasificar:
   - severidad alta: auth, hash/dock, orientacion, links criticos, carga bloqueada
   - severidad media/baja: problemas no bloqueantes o cosmeticos
4. Elegir camino:
   - hotfix si el cambio es pequeno, seguro y reversible
   - rollback si el impacto es alto y el fix seguro no es evidente
5. Ejecutar re-smoke obligatoria sobre:
   - login
   - `/#kpis`
   - orientacion
   - `back-to-top`
   - ausencia de copy tecnica visible

## Regla de hotfix
- Debe ser un diff minimo.
- Debe tocar solo la zona del bug.
- Debe dejar evidencia concreta de verificacion.
- No debe mezclar mejoras de backlog.

## Regla de rollback
Usar rollback cuando:
- falla auth/login de forma amplia
- falla hash/dock/navigation de forma amplia
- la home queda operativamente inutilizable
- el hotfix pequeno y seguro no es claro

## Comando de rollback
```bash
firebase hosting:clone ppccr-2026:live-backup-20260313-1 ppccr-2026:live
```

## Cierre de incidente
- Documentar causa, evidencia, decision tomada y resultado.
- Si hubo rollback, dejar nuevo plan de correccion fuera de la ventana de estabilizacion salvo urgencia real.
