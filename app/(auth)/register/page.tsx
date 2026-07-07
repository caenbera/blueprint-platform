"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthBranding } from "@/components/features/auth/auth-branding";
import { AuthMobileLogo } from "@/components/features/auth/auth-mobile-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapAuthError, signUp } from "@/services/auth";
import { createOrganization } from "@/services/organizations";

const registerSchema = z.object({
  displayName: z.string().min(1, "Tu nombre es obligatorio."),
  organizationName: z.string().min(1, "El nombre de tu empresa es obligatorio."),
  email: z.string().min(1, "El correo es obligatorio.").email("Ingresa un correo válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", organizationName: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      await signUp(values.email, values.password, values.displayName);
      await createOrganization(values.organizationName);
      router.push("/dashboard");
    } catch (error) {
      setFormError(mapAuthError(error));
    }
  }

  return (
    <div className="flex min-h-screen">
      <AuthBranding />

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <AuthMobileLogo />

        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <h1 className="text-h3">Crea tu cuenta</h1>
            <p className="text-body text-muted-foreground">
              Empieza a construir tu empresa paso a paso.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="displayName">Nombre completo</Label>
                <Input
                  id="displayName"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  aria-invalid={!!errors.displayName}
                  {...register("displayName")}
                />
                {errors.displayName && (
                  <p className="text-error text-small">{errors.displayName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="organizationName">Nombre de tu empresa</Label>
                <Input
                  id="organizationName"
                  autoComplete="organization"
                  placeholder="Mi Empresa S.A."
                  aria-invalid={!!errors.organizationName}
                  {...register("organizationName")}
                />
                {errors.organizationName && (
                  <p className="text-error text-small">{errors.organizationName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@empresa.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && <p className="text-error text-small">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    aria-invalid={!!errors.password}
                    className="pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-error text-small">{errors.password.message}</p>
                )}
              </div>

              {formError && (
                <p className="bg-error/10 text-error text-body rounded-md px-3 py-2" role="alert">
                  {formError}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear cuenta
              </Button>

              <p className="text-body text-muted-foreground text-center">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-caption text-muted-foreground mt-8 text-center">
          © Blueprint — Sistema Operativo para Construir Empresas
        </p>
      </div>
    </div>
  );
}
