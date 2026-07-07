const BRANDING_IMAGE_URL = "https://i.postimg.cc/76dZDVMM/01-1.png";

/**
 * Panel de branding compartido por Login y Registro (Prompt 4.1).
 * Desktop: columna izquierda (60%). Mobile: banner superior.
 * Imagen servida desde hosting externo (postimg.cc) por pedido del usuario,
 * no se descarga localmente al proyecto. La imagen ya contiene el branding,
 * sin texto superpuesto.
 */
export function AuthBranding() {
  return (
    <div className="flex h-56 w-full items-center justify-center overflow-hidden bg-neutral-950 lg:h-auto lg:w-3/5">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen alojada en hosting externo, no en /public */}
      <img src={BRANDING_IMAGE_URL} alt="Blueprint" className="h-full w-full object-contain" />
    </div>
  );
}
