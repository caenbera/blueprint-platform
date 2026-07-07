import Image from "next/image";

const BRANDING_IMAGE_URL = "https://i.postimg.cc/76dZDVMM/01-1.png";

/**
 * Panel de branding compartido por Login y Registro (Prompt 4.1). Solo
 * visible en desktop (lg+) - la imagen es una pieza de diseño panorámica
 * completa (logo/texto a la izquierda, mockup del dashboard a la derecha)
 * que no se ve bien reducida a un banner angosto de mobile, así que en
 * mobile se usa AuthMobileLogo en su lugar. Ancho de columna fijo (no
 * derivado de aspect-ratio) con next/image en modo `fill` + object-cover
 * (llena todo el panel sin dejar franjas vacías, igual que en
 * OrellaApp/AuthCarousel) - el contenido importante de la imagen tiene
 * margen de sobra arriba/abajo, así que el recorte cae en zonas vacías.
 * Imagen servida desde hosting externo (postimg.cc) por pedido del usuario,
 * no se descarga localmente al proyecto (ver next.config.ts remotePatterns).
 */
export function AuthBranding() {
  return (
    <div className="relative hidden h-screen w-full flex-shrink-0 overflow-hidden lg:block lg:w-[58%] xl:w-3/5">
      <Image src={BRANDING_IMAGE_URL} alt="Blueprint" fill className="object-cover" priority />
    </div>
  );
}
