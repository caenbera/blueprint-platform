// Stub para pruebas (Sprint 11): el paquete real "server-only" lanza un
// error si Vite lo resuelve por su condicion de "browser"/"client
// component" en vez de la de Node - en Vitest eso pasa incluso para
// codigo que solo corre en el servidor. Aqui no hace falta ninguna
// verificacion real: los propios tests ya solo importan modulos de
// servidor deliberadamente.
export {};
