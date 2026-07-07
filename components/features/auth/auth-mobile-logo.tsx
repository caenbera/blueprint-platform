import { Layers } from "lucide-react";

/** Logo compacto para Login/Registro/Recuperar contraseña en mobile, donde AuthBranding se oculta (Prompt 4.1). */
export function AuthMobileLogo() {
  return (
    <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
      <Layers className="text-primary h-8 w-8" strokeWidth={2.5} />
      <span className="text-h3 font-bold">Blueprint</span>
    </div>
  );
}
