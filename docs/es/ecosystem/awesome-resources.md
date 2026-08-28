---
title: Recursos del ecosistema Awesome DeepSeek Harness por capacidad
locale: es
source: docs/en/ecosystem/awesome-resources.md
source_revision: 4
status: reviewed
verified_at: 2026-08-28
---

# Recursos de DeepSeek Harness por capacidad

[Awesome DeepSeek Harness](https://github.com/0xsline/awesome-deepseek-harness) reúne plugins, herramientas y recursos operativos de DSH. Esta página no duplica todo el catálogo: selecciona referencias útiles para diseñar y verificar flujos de trabajo de Agent.

## Referencias para flujos de Agent

| Área | Recurso | Qué revisar primero |
|---|---|---|
| Comparación de Agents | [dsh-agent-arena](https://github.com/LeemanCheung/dsh-agent-arena) | Aislamiento de worktrees y validación determinista. |
| Multi-Agent | [dsh-collaboration](https://github.com/Socialist-Sister/dsh-collaboration) | Protocolo de dispatch, roster de modelos y permisos. |
| Agents en segundo plano | [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | Vida del Session hijo, scope y cancelación. |
| Contexto | [dsh-context](https://github.com/bowenliang123/dsh-context) | Medición de tokens y evidencia de compresión. |
| Descubrimiento MCP | [dsh-mcp-lens](https://github.com/labmimors/dsh-mcp-lens) | Conexiones lazy, schemas y límites de caché. |
| Gobernanza de memoria | [dsh-memory-gate](https://github.com/GIT121995/dsh-memory-gate) | Autoridad de claims, aislamiento y límite de inyección. |
| Búsqueda web | [dsh-free-web-search](https://github.com/delef/dsh-free-web-search) | Orden de fallback, envío externo y caché. |
| Gobernanza de producción | [dsh-security-audit](https://github.com/dsh-external/dsh-security-audit) | Provenance, red, redacción y rollback. |

## Cuatro rutas seguras para empezar

Para comparar Agents, empieza con `dsh-agent-arena`; para equipos supervisados, con `dsh-collaboration`; para investigación y memoria, con `dsh-deep-research` + `dsh-memory-gate`; para producción gobernada, con `dsh-security-audit`. No actives todo el catálogo a la vez: registra manifest, módulos cargados, red, token/cost y resultado de desinstalación.

Una entrada del catálogo no garantiza seguridad, compatibilidad ni mantenimiento. Antes de usar un profile real, lee README, licencia, manifest, script de instalación y cambios recientes; prueba un probe inocuo y rollback en un profile copiado.

## Proyectos comunitarios con alta señal de descubrimiento

Estos proyectos públicos tienen una señal de descubrimiento relevante en la comunidad. La popularidad no garantiza seguridad ni compatibilidad: verifica permisos, contrato de instalación e historial de releases.

| Enfoque | Recurso | Qué verificar primero |
|---|---|---|
| Catálogo de plugins | [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) | Estado público de cada entrada y versión de DSH. |
| Observabilidad de contexto | [dsh-context](https://github.com/bowenliang123/dsh-context) | Tokens, eventos de compresión y datos fuera de la sesión. |
| Puente de visión | [modlens](https://github.com/liustack/modlens) | Ruta de imágenes, envíos externos y salida estructurada. |
| Equipos de Agents | [dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | Autoridad de hijos, workspace compartido y cancelación. |
| Acceso móvil | [dsh-pocket](https://github.com/shaobeichen/dsh-pocket) | Exposición LAN/pública y límites de autenticación. |
| Guía práctica | [DeepSeek Harness Orange Book](https://github.com/alchaincyf/deepseek-harness-orange-book) | Experimentos fijados por versión frente a consejos informales. |

## Fuentes

- [README de Awesome DeepSeek Harness](https://github.com/0xsline/awesome-deepseek-harness/blob/main/README.md)
- [Catálogo completo](https://github.com/0xsline/awesome-deepseek-harness/blob/main/CATALOG.md)
- [Guía comunitaria de auditoría de plugins](../../en/security/community-plugin-audit.md)
