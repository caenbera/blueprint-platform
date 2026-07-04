import path from "path";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vitest (Sprint 11): `vite-tsconfig-paths` resuelve el alias `@/*` a
 * partir de tsconfig.json directamente, sin duplicar el mapeo aqui.
 *
 * "server-only" se alias a un stub vacio: el paquete real lanza un error
 * bajo la condicion de resolucion de Vite que Vitest usa por defecto,
 * incluso para modulos que genuinamente solo se importan desde codigo de
 * servidor - ver test/stubs/server-only.ts.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
