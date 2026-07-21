#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 1. Cargar las tres fuentes de datos
const origPath = path.resolve('blueprints/asesoria-financiera.json');
const v3Path = path.resolve('blueprints/asesoria-financiera-v3-linear.json');
const profPath = path.resolve('blueprints/asesoria-financiera-profesional.json');
const targetDir = path.resolve('blueprints/Asesoria Financiera');

if (!fs.existsSync(origPath) || !fs.existsSync(v3Path) || !fs.existsSync(profPath)) {
  console.error("❌ Error: Faltan archivos de origen para realizar la fusión.");
  process.exit(1);
}

const orig = JSON.parse(fs.readFileSync(origPath, 'utf8'));
const v3 = JSON.parse(fs.readFileSync(v3Path, 'utf8'));
const prof = JSON.parse(fs.readFileSync(profPath, 'utf8'));

const origSteps = (orig.roadmap || []).flatMap(p => p.steps || []);
const v3Steps = (v3.roadmap || []).flatMap(p => p.steps || []);
const profSteps = (prof.roadmap || []).flatMap(p => p.steps || []);

console.log(`📊 Total Pasos - Original: ${origSteps.length} | v3-Linear: ${v3Steps.length} | Profesional: ${profSteps.length}`);

// Normalización de texto para búsqueda semántica
function cleanString(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
    .replace(/[^a-z0-9]/g, "") // Deja solo letras y números
    .trim();
}

// 2. Diccionario de mapeo de títulos v3 a las 14 fases estándar
const stepDestinationMap = {
  // 01-estrategia.json (Identidad y Rumbo Estratégico - strategy)
  'definir la mision y vision de la firma': '01-estrategia',
  'establecer el modelo de gobernanza': '01-estrategia',
  'desarrollar los kpis estrategicos': '01-estrategia',
  'realizar encuesta de necesidades del mercado': '01-estrategia',

  // 02-estrategia.json (Planificación y Viabilidad Financiera - strategy)
  'elaborar presupuesto inicial de operacion': '02-estrategia',
  'determinar el punto de equilibrio': '02-estrategia',

  // 03-estrategia.json (Diseño del Portafolio de Servicios - strategy)
  'disenar el catalogo de servicios': '03-estrategia',
  'definir estructura de tarifas': '03-estrategia',
  'disenar paquetes de asesoria': '03-estrategia',

  // 04-operaciones.json (Infraestructura y Herramientas - operations)
  'redactar politica de confidencialidad': '04-operaciones',
  'configurar almacenamiento seguro': '04-operaciones',
  'elegir software de planificacion financiera': '04-operaciones',
  'implementar herramienta de agendamiento': '04-operaciones',
  'contratar linea telefonica profesional': '04-operaciones',

  // 05-operaciones.json (Metodología de Atención - operations)
  'elegir crm para la firma': '05-operaciones',
  'implementar firma electronica': '05-operaciones',
  'disenar proceso de onboarding': '05-operaciones',
  'preparar cuestionario de descubrimiento financiero': '05-operaciones',
  'preparar primera reunion financiera': '05-operaciones',
  'construir el plan financiero del cliente': '05-operaciones',
  'revisar el plan financiero': '05-operaciones',
  'presentar el plan al cliente': '05-operaciones',
  'recopilar firma del cliente sobre el plan': '05-operaciones',

  // 06-operaciones.json (Recurrentes de Operaciones - operations)
  'revisar contratos vigentes': '06-operaciones',
  'auditoria de cumplimiento': '06-operaciones',
  'realizar copias de seguridad': '06-operaciones',
  'actualizar herramientas': '06-operaciones',
  'auditoria de accesos': '06-operaciones',
  'revisar licencias de software': '06-operaciones',
  'realizar reunion semanal de equipo': '06-operaciones',

  // 07-negocios.json (Constitución Legal y Cumplimiento - business)
  'definir la entidad juridica de la firma': '07-negocios',
  'registrar nombre comercial': '07-negocios',
  'realizar registro mercantil': '07-negocios',
  'investigar requisitos de certificacion': '07-negocios',
  'inscribirte al examen de certificacion': '07-negocios',
  'estudiar para el examen de certificacion': '07-negocios',
  'presentar y aprobar el examen': '07-negocios',
  'obtener numero de registro profesional': '07-negocios',
  'implementar politicas kyc/aml': '07-negocios',
  'definir politica de conflictos de interes': '07-negocios',
  'contratar seguro de responsabilidad profesional (e & o)': '07-negocios',
  'configurar calendario de renovacion': '07-negocios',
  'redactar contrato de servicios': '07-negocios',

  // 08-negocios.json (Infraestructura Administrativa - business)
  'abrir cuenta bancaria empresarial': '08-negocios',
  'elegir y configurar software contable': '08-negocios',

  // 09-negocios.json (Gestión de Riesgos - business)
  // (Nota: En asesoría pura esto puede ser muy similar a la protección de datos o seguros,
  // pero mantendremos este archivo como contenedor de los planes de contingencia si existen)

  // 10-negocios.json (Recurrentes de Negocios - business)
  'revision mensual de kpis': '10-negocios',
  'presentar informe trimestral': '10-negocios',
  'revisar y ajustar estrategia': '10-negocios',
  'realizar cierre contable': '10-negocios',
  'conciliacion bancaria': '10-negocios',
  'revisar margenes de rentabilidad': '10-negocios',
  'declaracion anual de impuestos': '10-negocios',
  'renovacion anual de matriculas mercantiles y certificaciones': '10-negocios',
  'declaracion y pago de impuestos y seguridad social': '10-negocios',
  'renovar certificaciones profesionales': '10-negocios',

  // 11-clientes.json (Branding y Visuales - customers)
  'definir paleta de colores': '11-clientes',
  'elegir tipografia': '11-clientes',
  'escribir el eslogan': '11-clientes',
  'disenar el logo': '11-clientes',
  'escribir tu biografia profesional': '11-clientes',
  'tomar fotografias profesionales': '11-clientes',

  // 12-clientes.json (Presencia Digital - customers)
  'registrar dominio y contratar hosting': '12-clientes',
  'publicar el sitio web': '12-clientes',
  'crear google business profile': '12-clientes',

  // 13-clientes.json (Captación y Fidelización - customers)
  'definir mapa del sitio': '13-clientes',
  'redactar contenido de pagina de inicio': '13-clientes',
  'crear perfil de linkedin': '13-clientes',
  'crear perfiles en redes sociales': '13-clientes',
  'crear calendario de contenido': '13-clientes',
  'implementar programa de referidos': '13-clientes',
  'registrar en sitios de resenas': '13-clientes',

  // 14-clientes.json (Recurrentes de Clientes - customers)
  'publicar contenido educativo': '14-clientes',
  'enviar boletin a clientes': '14-clientes',
  'analizar metricas de marketing': '14-clientes',
  'organizar taller o webinar': '14-clientes',
  'planificar marketing del ano': '14-clientes',
  'seguimiento mensual con clientes': '14-clientes',
  'solicitar retroalimentacion al cliente': '14-clientes',
  'solicitar referidos a clientes satisfechos': '14-clientes',
  'encuestas de satisfaccion': '14-clientes',
  'revision anual de planes financieros': '14-clientes'
};

const phasesMeta = {
  '01-estrategia': { title: 'Identidad y Rumbo Estratégico', block: 'strategy' },
  '02-estrategia': { title: 'Planificación y Viabilidad Financiera', block: 'strategy' },
  '03-estrategia': { title: 'Diseño del Portafolio de Servicios', block: 'strategy' },
  '04-operaciones': { title: 'Infraestructura y Herramientas de Trabajo', block: 'operations' },
  '05-operaciones': { title: 'Metodología de Atención al Cliente', block: 'operations' },
  '06-operaciones': { title: 'Fases Recurrentes de Operaciones', block: 'operations' },
  '07-negocios': { title: 'Constitución Legal y Cumplimiento', block: 'business' },
  '08-negocios': { title: 'Infraestructura Administrativa y Financiera', block: 'business' },
  '09-negocios': { title: 'Gestión de Riesgos y Protección', block: 'business' },
  '10-negocios': { title: 'Fases Recurrentes de Negocios', block: 'business' },
  '11-clientes': { title: 'Branding y Elementos Visuales', block: 'customers' },
  '12-clientes': { title: 'Presencia y Vitrina Digital', block: 'customers' },
  '13-clientes': { title: 'Estrategia de Captación y Fidelización', block: 'customers' },
  '14-clientes': { title: 'Fases Recurrentes de Clientes', block: 'customers' }
};

// 3. Fusión de Pasos
const mergedSteps = [];

v3Steps.forEach(v3s => {
  const cleanTitle = cleanString(v3s.title);
  
  // A. Buscar coincidencia exacta en profesional (36 pasos) - prioridad máxima
  const profMatch = profSteps.find(ps => cleanString(ps.title) === cleanTitle);
  
  // B. Buscar coincidencia en original (120 pasos)
  const origMatch = origSteps.find(os => cleanString(os.title) === cleanTitle);

  let finalStep = { ...v3s };

  if (profMatch) {
    console.log(`✅ Fusión Prof: "${v3s.title}"`);
    finalStep = {
      ...v3s,
      id: profMatch.id, // Conservar ID corto y limpio
      content: profMatch.content
    };
  } else if (origMatch) {
    console.log(`🔄 Fusión Orig: "${v3s.title}"`);
    finalStep = {
      ...v3s,
      content: origMatch.content
    };
  } else {
    console.log(`⚠️ Paso sin coincidencia detallada: "${v3s.title}" (se usará contenido lineal)`);
    // Asegurar que el paso tenga un content adecuado
    if (!finalStep.content) {
      finalStep.content = {
        overview: {
          title: v3s.title,
          summary: `Paso para ${v3s.title.toLowerCase()}.`,
          body: `Instrucciones detalladas para llevar a cabo el paso: ${v3s.title}.`
        },
        objective: {
          description: `Completar exitosamente la tarea de ${v3s.title.toLowerCase()}.`
        },
        whyItMatters: `Es fundamental para la organización y operación continua de la firma de asesoría.`,
        bestPractices: [
          "Documentar cada paso realizado para futuras referencias.",
          "Establecer recordatorios y alarmas si la tarea es periódica."
        ],
        commonMistakes: [
          "Ignorar u olvidar realizar el paso dentro del cronograma establecido."
        ],
        tip: "Lleva un registro digital organizado de este proceso.",
        checklist: (v3s.content && v3s.content.checklist) || [
          {
            id: `chk-${cleanString(v3s.title).slice(0, 20)}`,
            task: `Realizar la actividad de ${v3s.title.toLowerCase()}.`
          }
        ]
      };
    }
  }

  // Garantizar que todos los pasos tengan al menos un registroField para la interactividad
  if (!finalStep.content.registroFields || finalStep.content.registroFields.length === 0) {
    const isDate = cleanTitle.includes('renov') || cleanTitle.includes('excep') || cleanTitle.includes('venc');
    finalStep.content.registroFields = [
      {
        id: `${finalStep.id.replace('v2-step-', '').replace('v2-rec-', '')}-status`,
        label: `Estado de la tarea: ${finalStep.title}`,
        type: isDate ? 'date' : 'text',
        placeholder: isDate ? 'Selecciona la fecha' : 'Ej: Completado o Registrado',
        required: true
      }
    ];
  }

  // Asegurar que checklist referencias coincidan
  if (finalStep.content.checklist && finalStep.content.checklist.length > 0) {
    finalStep.content.checklist[0].registryFieldRef = finalStep.content.registroFields[0].id;
  }

  mergedSteps.push(finalStep);
});

// 4. Distribuir y Guardar los Archivos Fragmentados
const outputPhases = {};
Object.keys(phasesMeta).forEach(key => {
  outputPhases[key] = [];
});

// Limpiar las llaves del mapa para que coincidan con cleanTitle (sin espacios)
const cleanDestinationMap = {};
Object.entries(stepDestinationMap).forEach(([k, v]) => {
  cleanDestinationMap[cleanString(k)] = v;
});

// Mapeo manual
mergedSteps.forEach(s => {
  const cleanTitle = cleanString(s.title);
  const dest = cleanDestinationMap[cleanTitle];
  if (dest && outputPhases[dest]) {
    outputPhases[dest].push(s);
  } else {
    // Si no está en el mapa, clasificar por heurística
    console.log(`🚨 Heurística de emergencia para: "${s.title}" (cleanTitle: "${cleanTitle}")`);
    const type = s.type || 'one_time';
    if (type !== 'one_time') {
      outputPhases['06-operaciones'].push(s);
    } else {
      outputPhases['01-estrategia'].push(s);
    }
  }
});

// Asegurarse de que ningún archivo quede con 0 pasos (agregar algunos por defecto si es necesario)
if (outputPhases['02-estrategia'].length === 0) {
  console.log("Adding default financial steps to 02-estrategia.json");
  const defaultFinIds = ['step-definir-presupuesto-inicial', 'step-calcular-punto-equilibrio-kg', 'step-kpis-financieros'];
  const matched = origSteps.filter(s => defaultFinIds.some(id => s.id.includes(id) || s.title.toLowerCase().includes('equilibrio') || s.title.toLowerCase().includes('presupuesto')));
  matched.slice(0, 3).forEach(s => outputPhases['02-estrategia'].push(s));
}

if (outputPhases['03-estrategia'].length === 0) {
  console.log("Adding default services steps to 03-estrategia.json");
  const matched = origSteps.filter(s => s.title.toLowerCase().includes('servicios') || s.title.toLowerCase().includes('tarifas'));
  matched.slice(0, 3).forEach(s => outputPhases['03-estrategia'].push(s));
}

if (outputPhases['09-negocios'].length === 0) {
  console.log("Adding default risk steps to 09-negocios.json");
  const matched = origSteps.filter(s => s.title.toLowerCase().includes('riesgo') || s.title.toLowerCase().includes('seguro') || s.title.toLowerCase().includes('emergencia'));
  matched.slice(0, 2).forEach(s => outputPhases['09-negocios'].push(s));
}

// Guardar cada archivo
Object.entries(outputPhases).forEach(([key, steps]) => {
  const meta = phasesMeta[key];
  const filename = `${key}.json`;
  const filePath = path.join(targetDir, filename);

  const phaseData = {
    id: `fase-${key.replace(/^\d+-/, '')}`,
    title: meta.title,
    block: meta.block,
    steps: steps.map((s, idx) => ({
      ...s,
      order: idx
    }))
  };

  fs.writeFileSync(filePath, JSON.stringify(phaseData, null, 2), 'utf8');
  console.log(`💾 Guardado ${filename} con ${steps.length} pasos.`);
});

console.log("🎉 ¡Fusión e inyección completada exitosamente!");
