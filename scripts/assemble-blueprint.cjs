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

  let phaseOrderCounter = 0;

  files.forEach((file) => {
    const filePath = path.join(absoluteDir, file);
    let fileData;
    try {
      fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
      console.error(`❌ Error al analizar el archivo de fase '${file}':`, err.message);
      process.exit(1);
    }

    // Identificar si contiene múltiples fases o una sola
    const rawPhases = fileData.phases && Array.isArray(fileData.phases)
      ? fileData.phases.map(p => ({ ...p, block: p.block || fileData.block }))
      : [fileData];

    rawPhases.forEach((phase) => {
      // Normalizar nombres de llaves informales de la fase
      if (phase.phase && !phase.title) {
        phase.title = phase.phase;
      }
      if (phase.phaseTitle && !phase.title) {
        phase.title = phase.phaseTitle;
      }
      if (phase.phaseId && !phase.id) {
        phase.id = phase.phaseId;
      }
      
      if (!phase.id && phase.title) {
        // Slugify el título de la fase para generar el ID de forma limpia
        phase.id = "fase-" + phase.title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
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
      phase.order = phaseOrderCounter++;

      // Normalizar y validar pasos de la fase
      const steps = phase.steps || [];
      phase.steps = steps.map((step, stepIndex) => {
        // Normalizar nombres de llaves informales del paso
        if (step.stepId && !step.id) {
          step.id = step.stepId;
        }
        if (step.stepTitle && !step.title) {
          step.title = step.stepTitle;
        }

        // Normalizar estructura del paso si viene en formato informal (ej: con "guide" en la raíz)
        if (step.guide && !step.content) {
          step.content = {
            overview: {
              title: step.title,
              summary: step.title,
              body: step.guide.whyItMatters || ""
            },
            objective: {
              description: ""
            },
            whyItMatters: step.guide.whyItMatters || "",
            bestPractices: step.guide.bestPractices || [],
            commonMistakes: step.guide.commonMistakes || [],
            tip: step.guide.tip || "",
            recommendedTools: step.guide.recommendedTools || [],
            registroFields: step.registroFields || [],
            checklist: (step.checklist || []).map((item, idx) => ({
              id: item.id || `chk-${step.id}-${idx}`,
              task: item.text || item.task || ""
            }))
          };

          // Limpiar campos del nivel raíz del paso
          delete step.guide;
          delete step.registroFields;
          delete step.checklist;
        }

        // Rellenar valores por defecto para campos obligatorios
        if (!step.type) {
          step.type = "one_time";
        }
        if (step.estimatedHours === undefined) {
          step.estimatedHours = 0;
        }
        if (!step.difficulty) {
          step.difficulty = "easy";
        }
        if (!step.priority) {
          step.priority = "normal";
        }
        if (!step.dependencies) {
          step.dependencies = [];
        }
        // Limpiar campos nulos o indefinidos en registroFields para evitar que Zod falle
        if (step.content && Array.isArray(step.content.registroFields)) {
          step.content.registroFields = step.content.registroFields.map((field) => {
            const normalizedField = { ...field };
            if (normalizedField.placeholder === null || normalizedField.placeholder === undefined) {
              delete normalizedField.placeholder;
            }
            if (normalizedField.helpText === null || normalizedField.helpText === undefined) {
              delete normalizedField.helpText;
            }
            if (normalizedField.unit === null || normalizedField.unit === undefined) {
              delete normalizedField.unit;
            }
            if (normalizedField.options === null || normalizedField.options === undefined) {
              delete normalizedField.options;
            }
            if (normalizedField.required === null) {
              normalizedField.required = false;
            }
            return normalizedField;
          });
        }

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

      console.log(`   ✅ Fase ${phase.order + 1}: "${phase.title}" [Bloque: ${phase.block}] (${phase.steps.length} pasos)`);
      roadmap.push(phase);
    });
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
