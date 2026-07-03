# Blueprint — Roadmap de Desarrollo

Basado en el Prompt 14 (Development Roadmap) del spec pack original, ajustado con las decisiones de `blueprint-master-spec.md` (stack Firebase, exclusión de Riesgos/Tareas/Dependencias/Entregables/Hitos, Desktop First).

Principio: **arquitectura antes que interfaz, componentes antes que pantallas, reutilización antes que duplicación**. Nunca empezar un sprint sin haber estabilizado el anterior.

| Sprint | Nombre            | Objetivo                                                                                                                                                                                                                                                                 | Estado                       |
| ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| 0      | Foundation        | Infraestructura del proyecto: Next.js, TS, Tailwind, shadcn/ui, tooling de calidad, Firebase SDK (sin credenciales), estructura de carpetas, documentación de referencia.                                                                                                | ✅ En curso (este documento) |
| 1      | Core Architecture | Modelo de datos en Firestore + Security Rules, Firebase Auth, Organizations, Users, Roles/Permissions, capa `services/` base, providers de sesión/organización activa.                                                                                                   | Pendiente                    |
| 2      | Component System  | Implementar visualmente los 25 componentes oficiales (Prompt 5) sobre shadcn/ui ya instalado, con los design tokens de `blueprint-master-spec.md` §9. Estados universales (Default/Hover/Focus/Active/Disabled/Loading/Error/Success), variantes y tamaños.              | Pendiente                    |
| 3      | Navigator Engine  | Árbol jerárquico Organization→...→Card, breadcrumb, persistencia de estado, búsqueda/filtros, renderizado virtual.                                                                                                                                                       | Pendiente                    |
| 4      | Workspace Engine  | Autosave, historial de versiones, comentarios por Card, Modo Focus, Split View, Assistant Panel (UI, sin IA real todavía).                                                                                                                                               | Pendiente                    |
| 5      | Card System       | Los 20 tipos de Card sobre la anatomía universal, relaciones entre Cards, reutilización cross-Workspace/Blueprint/Project.                                                                                                                                               | Pendiente                    |
| 6      | Knowledge Engine  | Knowledge Base: categorías, relaciones tipo grafo, promoción automática Card→Knowledge Item, búsqueda.                                                                                                                                                                   | Pendiente                    |
| 7      | Documents Engine  | Documents Center: plantillas, constructor visual no destructivo, vista previa, exportación (PDF/Word/Markdown/HTML/JSON).                                                                                                                                                | Pendiente                    |
| 8      | AI Engine         | Integración real con Anthropic Claude API vía Cloud Functions/API routes: Context → Knowledge → Prompt → Action → Document Engine. Vector search para RAG (decisión pendiente: Vertex AI Vector Search vs. extensión de Firebase — se resuelve al llegar a este sprint). | Pendiente                    |
| 9      | Mission Control   | Dashboard con los 10 Widgets oficiales, personalización de layout, aislamiento de fallos por widget.                                                                                                                                                                     | Pendiente                    |
| 10     | Marketplace       | Publicación/descubrimiento de recursos, alcance Público vs. Biblioteca Privada de Empresa.                                                                                                                                                                               | Pendiente                    |
| 11     | Optimización + QA | Rendimiento, caché, accesibilidad, seguridad, pruebas, documentación de usuario. Preparación para producción.                                                                                                                                                            | Pendiente                    |

## Fuera de alcance de v1 (revisar en versiones futuras)

- Riesgos, Dependencias, Entregables, Tareas, Hitos como entidades de primer nivel (aparecían solo en el prototipo visual).
- Monetización/planes de pago en Marketplace (el spec menciona recursos "premium" pero no define billing).
- Aplicación móvil nativa, extensión de navegador (mencionadas como visión a futuro en Prompt 12/13, no en v1).
- API pública con API Keys para terceros (visión "Platform API" del Prompt 12 — la arquitectura de servicios ya se diseña para soportarlo más adelante, pero no se expone en v1).

## Definition of Done por sprint

Un sprint se considera terminado cuando: cumple sus criterios funcionales, respeta el Design System (`blueprint-master-spec.md` §9), reutiliza el Component System en vez de crear componentes nuevos, pasa lint/build, mantiene accesibilidad básica (navegación por teclado, foco visible), y no introduce deuda técnica sin documentar.
