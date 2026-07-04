# Auditoría de Seguridad — Sprint 11

Auditoría end-to-end de `firestore.rules`, `storage.rules`, y los endpoints de servidor (`app/api/**`), realizada al cierre del roadmap original (Sprints 0-10 ya construidos). Documenta qué se revisó, qué se encontró, qué se corrigió, y qué riesgos se aceptan deliberadamente por ahora.

## Aislamiento multi-tenant (Firestore)

**Revisado**: todas las colecciones de negocio viven bajo `organizations/{orgId}/...`, y la regla wildcard genérica (`match /{businessCollection}/{docId=**}` dentro de `match /organizations/{orgId}`) condiciona lectura/escritura a `isOrgMember(orgId)`, donde `orgId` es el **segmento de la URL**, no un campo dentro del documento.

**Conclusión**: esto es correcto y suficiente. Firestore no permite direccionar una escritura a la ruta de otra organización aunque el payload declare un `orgId` distinto en sus campos — el control de acceso real lo determina la ruta solicitada, que Firestore valida contra las reglas antes de aceptar cualquier operación. Un campo `orgId` "mentiroso" dentro de un documento (si el cliente lo mandara mal) sería un bug de integridad de datos, nunca una vía de acceso cruzado entre organizaciones. Varias colecciones anidadas (`comments`, `versions`, `activityLog`, `aiConversations/*/messages`, exports de documentos) deliberadamente no llevan un campo `orgId` propio — no hace falta, ya están scopeadas por la ruta.

**No se encontraron vulnerabilidades.** No se modificó `firestore.rules` en este sprint.

## Marketplace (`marketplaceResources`, Sprint 10)

**Revisado**: es la única colección top-level del proyecto (no anidada bajo `organizations/{orgId}`), porque un recurso "público" debe ser legible por cualquier organización.

- Lectura: `visibility == 'public'` (cualquiera autenticado) o `isOrgMember(resource.data.orgId)` cuando `visibility == 'organization'` — correcto, sin ruta para leer contenido "organizacional" de otra organización.
- Escritura: solo miembros de `orgId` con rol `owner`/`administrator`/`editor`, y la regla de `update` impide cambiar `orgId`, `publishedBy`, o `resourceType` después de creado.
- `delete` deshabilitado (`if false`) — el soft-delete es un cambio de `status` vía `update`, consistente con el resto de la plataforma.

**No se encontraron vulnerabilidades.**

## Storage

**Gap real encontrado**: `storage.rules` no tenía ningún límite de tamaño de archivo — cualquier miembro de una organización podía subir un archivo de cualquier tamaño (usado hoy por Cards tipo "archivo"/"imagen" y por las exportaciones de Documentos), lo cual es tanto un vector de abuso de costo de almacenamiento como un vector de denegación de servicio de bajo esfuerzo.

**Corregido**: se agregó `request.resource.size < 25MB` a las operaciones `create`/`update` del bloque `organizations/{orgId}/{allPaths=**}`. `services/storage.ts` valida el tamaño en el cliente antes de subir (mejor UX) y también atrapa el rechazo de las reglas con un mensaje claro, en vez de propagar el error crudo de Firebase.

## Endpoints de servidor con IA (`app/api/assistant/*`)

**Revisado**: ambas rutas (`/api/assistant/chat`, `/api/assistant/recommendations`) verifican el ID token de Firebase Auth antes de cualquier trabajo, y resuelven `orgId` **desde `userOrgIndex` en el servidor** (nunca confían en un `orgId` enviado por el cliente) — no hay manera de que un usuario autenticado como miembro de la organización A obtenga una respuesta usando el contexto/Knowledge Base de la organización B.

**Gap real encontrado**: ninguna de las dos rutas tenía límite de solicitudes. Cada llamada invoca a un proveedor de IA de pago (Anthropic/OpenAI/Google) — sin límite, un usuario (malicioso o con un bug en su cliente) podía generar un costo de API sin techo.

**Corregido**: nuevo `lib/rate-limit.ts` — contador de ventana fija por usuario en Firestore (`rateLimits/{uid}_{key}`), leído/escrito **solo con el Admin SDK** (el cliente nunca lo toca, así que no hizo falta ninguna regla de Firestore nueva), protegido con una transacción para evitar condiciones de carrera entre solicitudes casi simultáneas del mismo usuario.

- `/api/assistant/chat`: 20 solicitudes / 10 minutos por usuario.
- `/api/assistant/recommendations`: 5 / hora por usuario (ya estaba detrás de un botón "Generar" en el cliente, pero igual necesitaba un techo del lado del servidor).

Al excederse, la ruta responde `429` con un mensaje en español indicando cuánto falta para poder reintentar.

## Riesgos aceptados (decisión consciente, no bugs)

- **Sin protección anti-bot (CAPTCHA) en registro/login** — Firebase Auth ya aplica sus propios límites de tasa a nivel de proyecto; se acepta el riesgo residual por ahora.
- **Sin cuota de almacenamiento por organización** más allá del límite de 25MB por archivo individual — una organización con muchos archivos grandes podría acumular un uso de Storage considerable. Se pospone hasta tener datos reales de uso.
- **Rate limiting solo en los 2 endpoints de IA** — el resto de la plataforma (Cards, Documentos, Knowledge Base) no llama a una API de pago por solicitud, así que el costo de abuso es órdenes de magnitud menor; no se instrumentó.
- **Sin pruebas de `firestore.rules`/`storage.rules` con el emulador de Firebase** (`@firebase/rules-unit-testing`) — la auditoría de este sprint fue manual (lectura + razonamiento sobre el modelo de reglas de Firestore), no automatizada. Requeriría tener Java instalado para el emulador; queda documentado como mejora futura.
- **Sin flujo de aprobación de `supportAccessGrants`** — la regla existe desde el Sprint 1, pero su UI (solicitar/aprobar acceso de Super Admin) nunca se construyó. No es un hallazgo de seguridad (la regla en sí es correcta), es una funcionalidad no construida.
