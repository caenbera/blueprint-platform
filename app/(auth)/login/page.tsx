"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthBranding } from "@/components/features/auth/auth-branding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapAuthError, signIn } from "@/services/auth";

const loginSchema = z.object({
  email: z.string().min(1, "El correo es obligatorio.").email("Ingresa un correo válido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await signIn(values.email, values.password, values.remember);
      router.push("/dashboard");
    } catch (error) {
      setFormError(mapAuthError(error));
    }
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <AuthBranding />

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <h1 className="text-h3">Bienvenido nuevamente</h1>
            <p className="text-body text-muted-foreground">
              Inicia sesión para continuar construyendo tu empresa.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
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
                    autoComplete="current-password"
                    placeholder="••••••••"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Controller
                    name="remember"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="remember"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    )}
                  />
                  <Label htmlFor="remember" className="text-body font-normal">
                    Recordarme
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-body text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {formError && (
                <p className="bg-error/10 text-error text-body rounded-md px-3 py-2" role="alert">
                  {formError}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Iniciar sesión
              </Button>

              <p className="text-body text-muted-foreground text-center">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Crear una cuenta
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
