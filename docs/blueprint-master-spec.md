# Blueprint — Especificación Maestra

Documento de referencia permanente. Consolida el "Blueprint Master Prompt Pack" (24 documentos de especificación) y el prototipo visual en una única fuente de verdad para el desarrollo. Cualquier sesión de trabajo futura debe partir de aquí en vez de releer los 24 prompts originales.

> **Lema**: "Construye una vez. Reutiliza para siempre."

## 1. Identidad y filosofía

Blueprint es un **Business Operating System (Business OS)**, no un CRM, no un ERP, no un gestor de proyectos, no un gestor documental. Su propósito es ayudar a empresas a construir, organizar y reutilizar conocimiento empresarial.

Principio rector para cualquier funcionalidad nueva: **¿esto ayuda al usuario a construir mejor su empresa?** Si no, se descarta.

Prioridades fijas, nunca invertidas: **Claridad > Simplicidad > Consistencia > Productividad > Escalabilidad > Reutilización del conocimiento.**

Prohibido explícitamente en toda la plataforma: convertirse en CRM tradicional, formularios largos, duplicar información, modales innecesarios, sidebar tradicional, componentes distintos para el mismo problema, dashboards saturados de gráficos, parecerse a Notion/ClickUp/Monday/Asana en su paradigma de gestión de tareas.

## 2. Jerarquía de dominio (oficial, nunca otra)

```
Organization → Project → Blueprint → Phase → Module → Chapter → Workspace → Card
```

Todo dato del sistema pertenece a esta cadena. La Card es la unidad atómica de información y de interacción — no la pantalla.

**Fuera de alcance en v1** (aparecían solo en el prototipo visual, nunca en las especificaciones de texto, y contradicen la filosofía "no es un gestor de proyectos"): Riesgos, Dependencias, Entregables, Tareas, Hitos como entidades de primer nivel. Se revisarán en versiones futuras, posiblemente como tipos de Card.

## 3. Los 5 motores núcleo (ADN de la plataforma)

Todo lo demás (Knowledge Base, Documents Center, Marketplace, Settings) se construye reutilizando estos 5 motores, nunca reimplementando su lógica:

1. **Mission Control Engine** — centro de mando / Dashboard. Basado en Widgets independientes y componibles (Continue Working, Progress Overview, Projects, Blueprint Health, Recent Activity, Knowledge Insights, Documents Center, Assistant Recommendations, Notifications, Team Activity). Si un widget falla, los demás siguen funcionando. KPIs accionables únicamente — nunca un panel lleno de gráficos.
2. **Blueprint Navigator Engine** — navegación principal, **nunca un sidebar tradicional**. Árbol jerárquico expandible/filtrable/buscable con renderizado virtual, breadcrumb sincronizado, persistencia de estado (nodos abiertos, scroll, filtros) entre sesiones.
3. **Blueprint Workspace Engine** — entorno de trabajo tipo IDE. Todo el contenido vive en Cards dentro de un único entorno continuo (nunca páginas separadas). Autosave, historial, comentarios por Card, Modo Focus, Split View, Assistant Panel siempre disponible.
4. **Blueprint Card System** — unidad universal de información. Anatomía fija: Header → Objetivo → Contenido → Recursos relacionados → Comentarios → Assistant IA → Footer. 20 tipos oficiales (Información, Objetivo, Pregunta, Respuesta, Checklist, Formulario, Documento, Archivo, Imagen, Video, Audio, Tabla, Timeline, KPI, Canvas, IA, Resumen, Comparación, Proceso, Plantilla).
5. **Blueprint AI Engine** — copiloto contextual, nunca un chatbot genérico. Cadena de 5 sub-motores: Context Engine (recopila toda la jerarquía antes de responder) → Knowledge Engine (consulta Knowledge Base primero) → Prompt Engine (construye prompts automáticamente) → Action Engine (ejecuta acciones aprobables) → Document Engine (genera entregables vía Documents Center). 6 modos de comportamiento sobre un único motor: Consultor, Redactor, Analista, Investigador, Estratega, Presentador. **Nunca modifica contenido sin aprobación explícita del usuario. Siempre explica de dónde proviene la información que usó.**

## 4. Módulos satélite

- **Knowledge Base**: memoria empresarial reutilizable. Se alimenta automáticamente de Cards/Workspaces/documentos aprobados (nunca copiado manual). Categorías ampliables, relaciones tipo grafo entre elementos, búsqueda semántica.
- **Documents Center**: fábrica de entregables (plantillas, constructor visual no destructivo, vista previa, exportación). 3 pestañas internas: Templates / Documents / Exports (mismo módulo, no 3 módulos separados). Nunca edita la Knowledge Base directamente — flujo unidireccional KB → documento.
- **Settings Center**: 8 categorías (Empresa, Usuarios, Seguridad, IA, Notificaciones, Documentos, Integraciones, Apariencia), panel lateral + contenido, sin nuevas páginas.
- **Marketplace**: recursos reutilizables (Blueprints, plantillas, checklists...) con alcance Público o Biblioteca Privada de Empresa (misma interfaz, distinto scope). Incorporar un recurso nunca modifica el original.
- **User Profile**: identidad del usuario, distinto de Settings (evitar duplicar gestión de seguridad entre ambos — Profile es más bien de solo lectura/resumen, Settings es donde se gestiona).

## 5. Modelo de estados (dos taxonomías separadas, no una)

1. **Estado de progreso/navegación** (nodos del Navigator: Phase/Module/Chapter/Workspace): `No iniciado | En progreso | Revisado | Aprobado | Bloqueado`.
2. **Estado de ciclo de vida de contenido** (varía por tipo de entidad — Card, Document, KnowledgeItem, MarketplaceResource tienen cada uno su propio set, generalmente basado en `Borrador → En edición/revisión → Aprobado → Publicado/Archivado`).

No mezclar ambas taxonomías en el modelo de datos.

## 6. Permisos

Roles: `Owner, Administrator, Manager, Editor, Collaborator, Viewer`. Permisos atómicos (`read, write, update, delete, approve, publish, export, share`) agrupados por rol — nunca hardcodeados. Evaluados en 4 niveles: Organización → Proyecto → Workspace → Card. La API es la única autoridad — el frontend nunca decide permisos, solo los refleja.

## 7. Reglas de arquitectura de datos y comunicación

- Nunca duplicar información — preferir referencia/reutilización.
- Soft delete universal (`active | archived | deleted`); nunca borrado físico salvo proceso administrativo explícito.
- Versionado obligatorio en Cards, Documentos, Knowledge Items, Blueprints.
- Toda acción relevante genera un evento de auditoría (quién, cuándo, qué cambió) — alimenta Actividad Reciente y automatizaciones futuras.
- El frontend nunca accede a Firestore/Storage directamente desde lógica de negocio sin pasar por `services/` (capa única de acceso a datos).
- La IA nunca accede a datos directamente — siempre vía los mismos `services/` que usa el resto de la app.

## 8. Stack técnico

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui (Radix) + Lucide Icons + Framer Motion + React Hook Form + Zod.
- **Backend**: Firebase — Firestore (base documental), Firebase Auth, Firebase Storage (archivos), Cloud Functions (lógica de servidor, triggers de eventos, integración IA).
- **Deploy**: GitHub → Vercel (build/preview/producción). Proyecto Firebase gestionado por separado en su consola.
- **IA**: Anthropic Claude API, invocada solo desde servidor (API routes / Cloud Functions), nunca desde el cliente.
- **Responsive**: Desktop First — tablet/mobile se adaptan después sin cambiar la lógica de navegación.

### Modelo de datos Firestore (subcolecciones anidadas por organización)

```
organizations/{orgId}
  ├─ users/{userId}                    (membership: rol, permisos)
  ├─ projects/{projectId}
  │    └─ blueprints/{blueprintId}
  │         └─ phases/{phaseId}
  │              └─ modules/{moduleId}
  │                   └─ chapters/{chapterId}
  │                        └─ workspaces/{workspaceId}
  │                             └─ cards/{cardId}
  │                                  ├─ versions/{versionId}
  │                                  └─ comments/{commentId}
  ├─ knowledgeItems/{itemId}
  ├─ documents/{documentId}
  ├─ aiConversations/{conversationId}
  └─ activityLog/{eventId}
marketplaceResources/{resourceId}      (top-level, visibilidad publica u organizacional)
```

### Folder structure del frontend

```
app/            → rutas (App Router), page containers, solo ensamblan
components/
  ui/           → Nivel 1: componentes puros (shadcn extendido), sin logica de negocio
  features/     → Nivel 2: Navigator, MissionControl, Workspace, CardSystem, AssistantPanel...
hooks/          → logica de estado/efectos reutilizable
services/       → unica capa que habla con Firestore/Auth/Storage/Cloud Functions
lib/            → utilidades e inicializacion (firebase/client.ts, firebase/admin.ts)
providers/      → contexto global (auth, organizacion activa, tema)
types/          → contratos de dominio compartidos
config/         → constantes (colecciones, catalogos, limites)
```

## 9. Design tokens (extraídos del prototipo visual, Sprint 0/2)

- **Color** (light): Primary `#2563EB`, Secondary `#6366F1`, Accent `#14B8A6`, Success `#16A34A`, Info `#2563EB`, Warning `#F59E0B`, Error `#EF4444`. Escala de neutros `neutral-50…neutral-950` propia (no es la escala `slate` de Tailwind por defecto).
- **Color** (dark): Primary `#3B82F6`, Secondary `#818CF8`, Accent `#2DD4BF`, Success `#22C55E`, Info `#3B82F6`, Warning `#FBBF24`, Error `#F87171`. Misma estructura, solo cambian valores (nunca el layout).
- **Tipografía**: Inter, escala `H1 40/48/700 → H2 28/36/600 → H3 20/28/600 → H4 16/24/500 → Body Large 16/24/400 → Body 14/20/400 → Small 12/16/400 → Caption 11/16/400`. Definida como tokens `text-h1…text-caption` en `app/globals.css`.
- **Espaciado**: sistema base 8pt. La escala por defecto de Tailwind (`space-1=4px, space-2=8px, space-4=16px, space-6=24px...`) ya coincide 1:1 — no requiere config adicional.
- **Grid**: 12 columnas desktop / 8 tablet / 4 mobile.
- Todos estos tokens ya están implementados en `app/globals.css` (bloque `@theme inline` + `:root` / `.dark`).

## 10. Decisiones de resolución de conflictos (texto vs. prototipo)

Documentadas para que nadie las re-abra sin motivo:

1. El prototipo se usa **solo** como fuente de tokens visuales. La arquitectura de información sigue el texto (Navigator sin sidebar tradicional, Dashboard basado en Widgets, sin panel de gráficos denso).
2. Riesgos/Dependencias/Entregables/Tareas/Hitos: **excluidos de v1**.
3. Responsive: **Desktop First**.
4. Backend: **Firebase**, no Postgres. Deploy con **Vercel + GitHub**.
