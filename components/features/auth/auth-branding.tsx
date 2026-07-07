const BRANDING_IMAGE_URL = "https://i.postimg.cc/76dZDVMM/01-1.png";

/**
 * Panel de branding compartido por Login y Registro (Prompt 4.1).
 * Desktop: columna izquierda, ancho derivado de la altura completa según la
 * proporción real de la imagen (1536x1024 = 3/2), para no dejar espacio
 * vacío ni recortar. Mobile: banner superior, misma proporción.
 * Imagen servida desde hosting externo (postimg.cc) por pedido del usuario,
 * no se descarga localmente al proyecto. La imagen ya contiene el branding,
 * sin texto superpuesto.
 */
export function AuthBranding() {
  return (
    <div className="aspect-[3/2] w-full overflow-hidden bg-neutral-950 lg:h-full lg:w-auto">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen alojada en hosting externo, no en /public */}
      <img src={BRANDING_IMAGE_URL} alt="Blueprint" className="h-full w-full object-cover" />
    </div>
  );
}
