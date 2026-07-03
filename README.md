# Blueprint

**Sistema Operativo para Construir Empresas.** Construye una vez. Reutiliza para siempre.

Blueprint es una plataforma SaaS multi-tenant que ayuda a empresas y consultores a construir, organizar, documentar y reutilizar su conocimiento empresarial, en lugar de duplicarlo cada vez en un documento nuevo.

## Documentación de referencia

Antes de tocar código, lee:

- [`docs/blueprint-master-spec.md`](./docs/blueprint-master-spec.md) — arquitectura, jerarquía de dominio, los 5 motores núcleo, modelo de datos, design tokens y decisiones de diseño ya resueltas.
- [`docs/roadmap.md`](./docs/roadmap.md) — los sprints de desarrollo, en orden de dependencia.

## Stack

- **Frontend**: Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Lucide Icons · Framer Motion · React Hook Form + Zod
- **Backend**: Firebase (Firestore, Auth, Storage, Cloud Functions)
- **IA**: Anthropic Claude API
- **Deploy**: GitHub → Vercel

## Desarrollo local

```bash
npm install
cp .env.local.example .env.local   # rellenar con credenciales reales de Firebase / Anthropic
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Otros scripts:

```bash
npm run lint          # ESLint
npm run format        # Prettier (escribe)
npm run format:check  # Prettier (solo verifica)
npm run build          # build de produccion
```

Un pre-commit hook (Husky + lint-staged) corre lint y format automáticamente sobre los archivos modificados.

## Estructura del proyecto

Ver `docs/blueprint-master-spec.md` §8 para el detalle completo de `app/`, `components/{ui,features}`, `hooks/`, `services/`, `lib/`, `providers/`, `types/`, `config/` y el modelo de datos en Firestore.
