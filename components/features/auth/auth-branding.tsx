import { Layers } from "lucide-react";

/**
 * Panel de branding compartido por Login y Registro (Prompt 4.1).
 * Desktop: columna izquierda (60%). Mobile: banner superior.
 */
export function AuthBranding() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6 bg-neutral-950 px-8 py-12 text-white lg:w-3/5 lg:py-24">
      <div className="flex items-center gap-3">
        <Layers className="text-primary h-9 w-9" strokeWidth={2.5} />
        <span className="text-h2 font-bold">Blueprint</span>
      </div>
      <div className="max-w-md text-center">
        <p className="text-body-lg font-medium">Sistema Operativo para Construir Empresas</p>
        <p className="text-body mt-3 text-neutral-400 italic">
          &ldquo;Construye una vez. Reutiliza para siempre.&rdquo;
        </p>
      </div>
    </div>
  );
}
