/**
 * Layout para Login/Registro (Prompt 4.1): unica excepcion a la estructura
 * permanente Top Navigation + Navigator + Workspace + Assistant + Status Bar.
 * Antes de autenticarse no hay Blueprint que navegar.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
