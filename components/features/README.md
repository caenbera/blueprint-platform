# Feature Components (Nivel 2)

Componentes funcionales que combinan varios UI Components (`components/ui`) y sí contienen lógica de presentación/orquestación. Cada Feature vive en su propia subcarpeta y evoluciona de forma independiente (Prompt 13).

Ejemplos previstos: `navigator/`, `mission-control/`, `workspace/`, `card-system/`, `assistant-panel/`, `knowledge-base/`, `documents-center/`, `marketplace/`.

Regla: nunca colocar lógica de negocio aquí directamente — debe vivir en `hooks/` y `services/`; estos componentes solo consumen esos hooks y renderizan.
