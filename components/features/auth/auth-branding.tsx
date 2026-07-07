const BRANDING_IMAGE_URL = "https://i.postimg.cc/76dZDVMM/01-1.png";

/**
 * Panel de branding compartido por Login y Registro (Prompt 4.1).
 * La imagen es una pieza de diseño panorámica completa (logo/texto a la
 * izquierda, mockup del dashboard a la derecha) - no se recorta (object-contain)
 * para no perder ninguna de las dos mitades. El fondo del panel usa el mismo
 * azul marino oscuro de la imagen para que el espacio sobrante se funda en
 * vez de notarse como un borde.
 * Imagen servida desde hosting externo (postimg.cc) por pedido del usuario,
 * no se descarga localmente al proyecto.
 */
export function AuthBranding() {
  return (
    <div className="flex h-64 w-full items-center justify-center bg-[#050914] lg:h-full lg:w-3/5">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen alojada en hosting externo, no en /public */}
      <img src={BRANDING_IMAGE_URL} alt="Blueprint" className="h-full w-full object-contain" />
    </div>
  );
}
