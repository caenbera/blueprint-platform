# Services

Única capa autorizada para hablar con Firestore/Firebase Auth/Storage/Cloud Functions. Ningún componente ni hook accede a Firebase directamente — siempre pasa por un service (Prompt 11/12/13: "el Frontend nunca accede directamente a la base de datos").

Organizado por dominio: `organizations.ts`, `projects.ts`, `blueprints.ts`, `workspaces.ts`, `cards.ts`, `knowledge.ts`, `documents.ts`, `ai.ts`, `marketplace.ts`.
