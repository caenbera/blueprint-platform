"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { AuthBranding } from "@/components/features/auth/auth-branding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase/client";
import { mapAuthError } from "@/services/auth";

const schema = z.object({
  email: z.string().min(1, "El correo es obligatorio.").email("Ingresa un correo válido."),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setSent(true);
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
            <h1 className="text-h3">Recuperar contraseña</h1>
            <p className="text-body text-muted-foreground">
              Te enviaremos un enlace para restablecerla.
            </p>
          </CardHeader>
          <CardContent>
            {sent ? (
              <p
                className="bg-success/10 text-success text-body rounded-md px-3 py-2"
                role="status"
              >
                Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu
                contraseña.
              </p>
            ) : (
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

                {formError && (
                  <p className="bg-error/10 text-error text-body rounded-md px-3 py-2" role="alert">
                    {formError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar enlace
                </Button>
              </form>
            )}

            <p className="text-body text-muted-foreground mt-4 text-center">
              <Link href="/login" className="text-primary hover:underline">
                Volver a iniciar sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
