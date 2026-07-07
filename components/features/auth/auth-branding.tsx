import { Layers } from "lucide-react";

const BRANDING_IMAGE_URL = "https://i.postimg.cc/76dZDVMM/01-1.png";

/**
 * Panel de branding compartido por Login y Registro (Prompt 4.1).
 * Desktop: columna izquierda (60%). Mobile: banner superior.
 * Imagen servida desde hosting externo (postimg.cc) por pedido del usuario,
 * no se descarga localmente al proyecto.
 */
export function AuthBranding() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-6 overflow-hidden bg-neutral-950 px-8 py-12 text-white lg:w-3/5 lg:py-24">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen alojada en hosting externo, no en /public */}
      <img
        src={BRANDING_IMAGE_URL}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-neutral-950/60" />

      <div className="relative flex items-center gap-3">
        <Layers className="text-primary h-9 w-9" strokeWidth={2.5} />
        <span className="text-h2 font-bold">Blueprint</span>
      </div>
      <div className="relative max-w-md text-center">
        <p className="text-body-lg font-medium">Sistema Operativo para Construir Empresas</p>
        <p className="text-body mt-3 text-neutral-400 italic">
          &ldquo;Construye una vez. Reutiliza para siempre.&rdquo;
        </p>
      </div>
    </div>
  );
}
