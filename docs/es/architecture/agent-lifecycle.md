---
title: Turn y ciclo de vida padre-hijo de un Agent en DeepSeek Harness
locale: es
source: docs/en/architecture/agent-lifecycle.md
source_revision: 4
status: reviewed
verified_at: 2026-08-28
verified_upstream: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Un turn de Agent y su ciclo de vida padre-hijo

Un **step** es una solicitud al modelo y las llamadas a herramientas que produce. Un **turn** puede contener varios steps y termina cuando el runtime ya no tiene trabajo pendiente. `turn/*`, `step/*`, `user/message`, `assistant/*` y `tool/*` son eventos durables; `agent/*` coordina el Agent vivo.

```text
entrada → inbox → driver → pre-step/contexto → modelo
       → pre-execute/execute/post-execute → resultado de herramienta
       → step/end → siguiente step o turn/end
```

## Empieza por el último evento durable

| Último evento | Frontera que debes revisar |
|---|---|
| No existe `turn/start` | wakeup del inbox o creación del Agent |
| Hay `turn/start`, pero no `step/start` | decisión pre-step o fallo de arranque |
| Hay `step/start`, pero no respuesta assistant | Provider o ruta de solicitud |
| Hay `tool/call`, pero no resultado | aprobación, política, Provider o ejecución |
| Hay `step/end`, pero no `turn/end` | input en cola, continuation o hook de parada |

Que el proceso siga vivo no demuestra que el turn avance. Conserva el último durable event, la versión, el Session ID y el primer error.

## El dispose del padre necesita un contrato propio

El informe upstream [#4909](https://github.com/deepseek-ai/deepseek-harness/discussions/4909) muestra que un child continuable puede quedar retenido por un service/factory scope después de que se destruya su Agent padre. `drainChildren()` explícito, un child que espera para siempre a `whenIdle()` y un callback de settlement que vuelve silenciosamente cuando el padre ya no existe crean cuatro brechas: ownership, limpieza en cascada, recuperación de hijos bloqueados y entrega del settlement.

```text
dispose del padre
  → decisión del hijo (cascade | handoff | reject)
  → drain / recuperación con límite
  → disposition de settlement durable
```

El fixture mínimo debe iniciar un child sin settlement, destruir primero al padre y comprobar tanto la finalización normal como el timeout del child. No debe quedar ningún activation huérfano; el settlement no puede perderse en silencio y el Session del padre debe registrar handoff, cancelación o recuperación. Un parche comunitario de referencia no demuestra que main ya ofrezca este contrato.

## Mantén la búsqueda frontier fuera del driver lineal

Beam search, poda y presupuesto de coste deben vivir en un controller externo que gestione la lineage de Session, scores, límites de anchura/profundidad/tokens/tiempo y disposition final. No entregues Agents mutables a un scorer externo: persiste IDs de candidatos, state digests, versión del scorer, tie-break estable y estados selected/pruned/failed/cancelled. Los candidatos con efectos secundarios deben limitarse a capacidades read-only o simuladas.

## Lista de verificación

- El dispose del padre produce cascade, handoff o reject explícito.
- Un child bloqueado tiene timeout/force-reclaim y no espera indefinidamente a `whenIdle()`.
- Se pueden rastrear settlement delivered, handoff, cancelled y dropped.
- El replay de Session usa eventos durables, no el estado de un Agent vivo.
- Las herramientas atraviesan las fronteras de policy, approval, sandbox y telemetry.
- Hay pruebas para dispose del padre primero, finalización normal, timeout y dispose repetido.

## Fuentes

- [Guía canonical en inglés](../../en/architecture/agent-lifecycle.md)
- [Agent lifecycle oficial (rc.2)](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/agent-lifecycle.md)
- [Informe de handoff y child huérfano #4909](https://github.com/deepseek-ai/deepseek-harness/discussions/4909)
