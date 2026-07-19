#!/usr/bin/env node
/**
 * Script de Utilidad — Ensamblador de Blueprints a partir de fragmentos (chunks)
 * 
 * Este script lee una carpeta que contiene los fragmentos de un blueprint generados
 * iterativamente por una IA y los cose en un único archivo JSON válido y ordenado.
 * 
 * Estructura de la carpeta de origen:
 *   - meta.json: Contiene los metadatos de la raíz del blueprint (slug, name, etc.)
 *   - 01-nombre-fase.json, 02-nombre-fase.json, etc.: Cada fase en su propio archivo JSON.
 *     Se ordenan alfabéticamente por nombre de archivo para definir el 'order' secuencial.
 * 
 * Uso:
 *   node scripts/assemble-blueprint.cjs [ruta-a-la-carpeta-de-fragmentos]
 * Ej:
 *   node scripts/assemble-blueprint.cjs blueprints/chunks/cultivo-hongos
 */

const fs = require("fs");
const path = require("path");

const ALLOWED_BLOCKS = ["strategy", "operations", "business", "customers"];
const ALLOWED_DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const ALLOWED_STEP_TYPES = [
  "one_time", "daily", "weekly", "monthly", "quarterly", "semester", "yearly", "milestone", "custom"
];

function main() {
  const targetDir = process.argv[2];
  if (!targetDir) {
    console.error("❌ Error: Debes especificar la ruta de la carpeta que contiene los fragmentos JSON.");
    console.log("Uso: node scripts/assemble-blueprint.cjs blueprints/chunks/mi-proyecto");
    process.exit(1);
  }

  const absoluteDir = path.resolve(targetDir);
  if (!fs.existsSync(absoluteDir) || !fs.statSync(absoluteDir).isDirectory()) {
    console.error(`❌ Error: La ruta especificada no existe o no es una carpeta: ${targetDir}`);
    process.exit(1);
  }

  // 1. Cargar metadatos principales
  const metaPath = path.join(absoluteDir, "meta.json");
  if (!fs.existsSync(metaPath)) {
    console.error(`❌ Error: No se encontró el archivo de metadatos globales 'meta.json' en la carpeta.`);
    process.exit(1);
  }

  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (err) {
    console.error(`❌ Error al analizar 'meta.json':`, err.message);
    process.exit(1);
  }

  // Validaciones básicas de metadatos
  if (!meta.slug || !meta.name) {
    console.error(`❌ Error en 'meta.json': Los campos 'slug' y 'name' son obligatorios.`);
    process.exit(1);
  }

  console.log(`📦 Ensamblando Blueprint: "${meta.name}" (${meta.slug})`);

  // 2. Leer y ordenar los archivos de fases (excluyendo meta.json)
  const files = fs.readdirSync(absoluteDir)
    .filter(file => file.endsWith(".json") && file !== "meta.json")
    .sort(); // Orden alfabético (ej. 01-..., 02-..., 03-...)

  if (files.length === 0) {
    console.error("❌ Error: No se encontraron archivos de fases (.json) en la carpeta.");
    process.exit(1);
  }

  console.log(`🔍 Se encontraron ${files.length} archivos de fases. Procesando en orden alfabético...`);

  const roadmap = [];
  let totalStepsCount = 0;

  files.forEach((file, phaseIndex) => {
    const filePath = path.join(absoluteDir, file);
    let phase;
    try {
      phase = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
      console.error(`❌ Error al analizar el archivo de fase '${file}':`, err.message);
      process.exit(1);
    }

    // Validar estructura de la fase
    if (!phase.id || !phase.title || !phase.block) {
      console.error(`❌ Error en '${file}': La fase debe tener 'id', 'title' y 'block'.`);
      process.exit(1);
    }

    if (!ALLOWED_BLOCKS.includes(phase.block)) {
      console.error(`❌ Error en '${file}': El bloque '${phase.block}' no es válido. Debe ser uno de: ${ALLOWED_BLOCKS.join(", ")}`);
      process.exit(1);
    }

    // Asignar order de fase secuencial
    phase.order = phaseIndex;

    // Normalizar y validar pasos de la fase
    const steps = phase.steps || [];
    phase.steps = steps.map((step, stepIndex) => {
      if (!step.id || !step.title || !step.type) {
        console.error(`❌ Error en paso de la fase '${phase.title}': El paso debe tener 'id', 'title' y 'type'.`);
        process.exit(1);
      }

      if (!ALLOWED_STEP_TYPES.includes(step.type)) {
        console.error(`❌ Error en paso '${step.title}': El tipo de paso '${step.type}' no es válido. Debe ser uno de: ${ALLOWED_STEP_TYPES.join(", ")}`);
        process.exit(1);
      }

      // Autocalcular orden de paso
      step.order = stepIndex;
      totalStepsCount++;

      // Analizar advertencia de coherencia entre checklist y registroFields
      const checklistTasks = (step.content?.checklist || []).map(t => t.task.toLowerCase());
      const registroIds = (step.content?.registroFields || []).map(f => f.id);
      
      const requiresFields = checklistTasks.some(task => 
        task.includes("definir") || 
        task.includes("calcular") || 
        task.includes("redactar") || 
        task.includes("establecer") || 
        task.includes("registrar")
      );

      if (requiresFields && registroIds.length === 0) {
        console.log(`⚠️  Advertencia: El paso "${step.title}" pide definir o calcular información en su checklist, pero no tiene ningún 'registroField' en su formulario de registro.`);
      }

      return step;
    });

    console.log(`   ✅ Fase ${phaseIndex + 1}: "${phase.title}" [Bloque: ${phase.block}] (${phase.steps.length} pasos)`);
    roadmap.push(phase);
  });

  // 3. Crear el blueprint unificado
  const finalBlueprint = {
    ...meta,
    roadmap
  };

  // 4. Escribir el archivo final
  const outputFileName = `${meta.slug}.json`;
  const outputPath = path.join(__dirname, "..", "blueprints", outputFileName);

  fs.writeFileSync(outputPath, JSON.stringify(finalBlueprint, null, 2), "utf8");

  console.log("\n=======================================================");
  console.log(`🎉 ¡Ensamblado Completado Exitosamente!`);
  console.log(`📁 Blueprint unificado guardado en: blueprints/${outputFileName}`);
  console.log(`📊 Estadísticas: ${roadmap.length} fases (subcategorías) | ${totalStepsCount} pasos en total`);
  console.log("=======================================================");
  console.log("👉 Para sembrar este blueprint en Firestore, corre el comando:");
  console.log(`   node scripts/seed-blueprint.cjs blueprints/${outputFileName}`);
  console.log("=======================================================\n");
}

main();
