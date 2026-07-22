#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const origPath = path.resolve('blueprints/asesoria-financiera.json');
const v3Path = path.resolve('blueprints/asesoria-financiera-v3-linear.json');
const profPath = path.resolve('blueprints/asesoria-financiera-profesional-orig36.json');
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

console.log(`📊 Total Pasos Iniciales - Original: ${origSteps.length} | v3-Linear: ${v3Steps.length} | Profesional Pulido: ${profSteps.length}`);

// Normalización de texto para búsqueda semántica
function cleanString(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Limpieza para coincidencia de palabras clave manteniendo espacios y eliminando acentos
function cleanTextForSearch(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const phasesMeta = {
  '01-estrategia': { title: 'Identidad y Rumbo Estratégico', block: 'strategy', steps: [] },
  '02-estrategia': { title: 'Planificación y Viabilidad Financiera', block: 'strategy', steps: [] },
  '03-estrategia': { title: 'Diseño del Portafolio de Servicios', block: 'strategy', steps: [] },
  '04-operaciones': { title: 'Infraestructura y Herramientas de Trabajo', block: 'operations', steps: [] },
  '05-operaciones': { title: 'Metodología de Atención al Cliente', block: 'operations', steps: [] },
  '06-operaciones': { title: 'Fases Recurrentes de Operaciones', block: 'operations', steps: [] },
  '07-negocios': { title: 'Constitución Legal y Cumplimiento', block: 'business', steps: [] },
  '08-negocios': { title: 'Infraestructura Administrativa y Financiera', block: 'business', steps: [] },
  '09-negocios': { title: 'Gestión de Riesgos y Protección', block: 'business', steps: [] },
  '10-negocios': { title: 'Fases Recurrentes de Negocios', block: 'business', steps: [] },
  '11-clientes': { title: 'Branding y Elementos Visuales', block: 'customers', steps: [] },
  '12-clientes': { title: 'Presencia y Vitrina Digital', block: 'customers', steps: [] },
  '13-clientes': { title: 'Estrategia de Captación y Fidelización', block: 'customers', steps: [] },
  '14-clientes': { title: 'Fases Recurrentes de Clientes', block: 'customers', steps: [] }
};

function getDestKey(s, origPhaseTitle) {
  const title = cleanTextForSearch(s.title);
  const type = s.type || 'one_time';
  
  if (type !== 'one_time') {
    // Buscar bloque en v3 si es recurrente
    const v3Match = v3.roadmap.find(p => p.steps.some(st => st.id === s.id));
    const block = v3Match ? v3Match.block : 'operations';
    
    if (block === 'strategy') return '01-estrategia';
    if (block === 'operations') return '06-operaciones';
    if (block === 'business') return '10-negocios';
    if (block === 'customers') return '14-clientes';
    return '06-operaciones';
  }

  // One-time mapping
  if (title.includes('seguro') || title.includes('responsabilidad') || title.includes('riesgo') || title.includes('contingencia') || title.includes('crisis') || title.includes('continuidad')) {
    return '09-negocios';
  }
  
  if (origPhaseTitle.includes('Fundación legal') || origPhaseTitle.includes('Negocio')) {
    if (title.includes('banc') || title.includes('cuenta')) return '08-negocios';
    if (title.includes('presupuesto') || title.includes('equilibrio')) return '02-estrategia';
    if (title.includes('contabil') || title.includes('software contable') || title.includes('cierre')) return '08-negocios';
    return '07-negocios';
  }
  if (origPhaseTitle.includes('Cumplimiento') || origPhaseTitle.includes('Legal')) {
    return '07-negocios';
  }
  if (origPhaseTitle.includes('Modelo de servicios') || origPhaseTitle.includes('Finanzas') || origPhaseTitle.includes('Portafolio')) {
    if (title.includes('presupuesto') || title.includes('kpi') || title.includes('viabilidad') || title.includes('equilibrio')) return '02-estrategia';
    return '03-estrategia';
  }
  if (origPhaseTitle.includes('Identidad de marca') || origPhaseTitle.includes('Branding')) {
    if (title.includes('mision') || title.includes('vision') || title.includes('proposito') || title.includes('valor')) return '01-estrategia';
    return '11-clientes';
  }
  if (origPhaseTitle.includes('Presencia digital')) {
    return '12-clientes';
  }
  if (origPhaseTitle.includes('Herramientas') || origPhaseTitle.includes('Tecnología') || origPhaseTitle.includes('Sistemas')) {
    if (title.includes('onboarding') || title.includes('bienvenida') || title.includes('cuestionario') || title.includes('proceso')) return '05-operaciones';
    return '04-operaciones';
  }
  if (origPhaseTitle.includes('Marketing') || origPhaseTitle.includes('Captación') || origPhaseTitle.includes('Ventas')) {
    return '13-clientes';
  }
  if (origPhaseTitle.includes('Primeros clientes') || origPhaseTitle.includes('Clientes')) {
    return '05-operaciones';
  }

  // Fallbacks if phase title is empty (for v3-linear unique steps)
  if (title.includes('mision') || title.includes('vision') || title.includes('proposito') || title.includes('gobernanza') || title.includes('mercado') || title.includes('encuesta') || title.includes('valores')) return '01-estrategia';
  if (title.includes('kpi') || title.includes('presupuesto') || title.includes('equilibrio') || title.includes('costos')) return '02-estrategia';
  if (title.includes('catalogo') || title.includes('tarifa') || title.includes('cobro') || title.includes('paquete') || title.includes('servicios core')) return '03-estrategia';
  if (title.includes('seguro') || title.includes('riesgo') || title.includes('crisis')) return '09-negocios';
  if (title.includes('banc') || title.includes('cuenta') || title.includes('contabil')) return '08-negocios';
  if (title.includes('entidad') || title.includes('mercantil') || title.includes('registro') || title.includes('contrato') || title.includes('certificac') || title.includes('examen') || title.includes('kyc') || title.includes('aml')) return '07-negocios';
  if (title.includes('color') || title.includes('tipograf') || title.includes('logo') || title.includes('eslogan') || title.includes('biograf') || title.includes('foto') || title.includes('logotipo')) return '11-clientes';
  if (title.includes('dominio') || title.includes('hosting') || title.includes('sitio web') || title.includes('web') || title.includes('google business') || title.includes('seo') || title.includes('maps')) return '12-clientes';
  if (title.includes('onboarding') || title.includes('bienvenida') || title.includes('cuestionario') || title.includes('reunion') || title.includes('plan financiero')) return '05-operaciones';
  if (title.includes('crm') || title.includes('agendamiento') || title.includes('calendario') || title.includes('firma electronica') || title.includes('almacenamiento') || title.includes('linea telefonica')) return '04-operaciones';
  
  return '13-clientes';
}

// Mapa conceptual de equivalencia: los 36 pasos profesionales absorben/reemplazan ciertos grupos de pasos granulares de la versión de 120
const conceptMapping = {
  'declaracion de mision y proposito': [
    'declaracion de mision y proposito',
    'definir la mision y vision de la firma'
  ],
  'vision de crecimiento a largo plazo 3 5 anos': [
    'vision de crecimiento a largo plazo 3 5 anos'
  ],
  'valores centrales y politicas eticas': [
    'valores centrales y politicas eticas'
  ],
  'perfil del cliente ideal y segmento': [
    'perfil del cliente ideal y segmento',
    'describir el perfil demografico de tu cliente ideal',
    'identificar los principales dolores y metas de tu cliente ideal'
  ],
  'calculo de costos y punto de equilibrio': [
    'calculo de costos y punto de equilibrio',
    'costos fijos y variables',
    'calcular tu tarifa objetivo',
    'documentar la estructura de tarifas final',
    'calcular tarifa'
  ],
  'calendario de estacionalidad de ingresos y flujo de caja': [
    'calendario de estacionalidad de ingresos y flujo de caja'
  ],
  'definicion de kpis y metas anuales': [
    'definicion de kpis y metas anuales',
    'desarrollar los kpis estrategicos'
  ],
  'definicion de servicios core': [
    'disenar el catalogo de servicios',
    'listar todos los servicios de asesoria que podrías ofrecer',
    'priorizar los servicios principales para lanzar',
    'definir el perfil de cliente para cada servicio',
    'definicion de servicios core',
    'disenar el catalogo de servicios'
  ],
  'estructura de tarifas y modelos de cobro': [
    'definir estructura de tarifas',
    'comparar los modelos de cobro habituales del sector',
    'estructura de tarifas y modelos de cobro'
  ],
  'analisis de competencia y propuesta de valor diferencial': [
    'analisis de competencia y propuesta de valor diferencial'
  ],
  'configuracion de entorno de trabajo seguro y ergonomico': [
    'equipar tu oficina o espacio de trabajo',
    'configuracion de entorno de trabajo seguro y ergonomico'
  ],
  'seleccion e implementacion de software de planificacion financiera y cifrado': [
    'elegir software de planificacion financiera',
    'comparar software de planificacion financiera',
    'elegir y contratar el software de planificacion financiera',
    'configurar una plantilla base de plan financiero',
    'seleccion e implementacion de software de planificacion financiera y cifrado'
  ],
  'protocolos de seguridad de la informacion y confidencialidad': [
    'redactar la politica de confidencialidad y manejo de datos',
    'definir donde y como se almacenara la informacion de los clientes',
    'definir tu politica de retencion de registros',
    'protocolos de seguridad de la informacion y confidencialidad'
  ],
  'diseno del proceso de onboarding y diagnostico financiero inicial': [
    'disenar proceso de onboarding',
    'preparar cuestionario de descubrimiento financiero',
    'disenar el proceso de bienvenida',
    'preparar el cuestionario de descubrimiento financiero',
    'preparar el paquete de bienvenida para clientes nuevos',
    'diseno del proceso de onboarding y diagnostico financiero inicial'
  ],
  'estandarizacion de la entrega de planes financieros formatos y plantillas': [
    'revisar el plan financiero antes de presentarlo',
    'documentar los pasos del proceso de analisis financiero',
    'definir el formato del entregable final para el cliente',
    'estandarizacion de la entrega de planes financieros formatos y plantillas'
  ],
  'protocolo de seguimiento y revisiones periodicas con el cliente': [
    'protocolo de seguimiento y revisiones periodicas con el cliente'
  ],
  'constitucion y registro mercantil': [
    'elegir el nombre comercial de la firma',
    'verificar disponibilidad del nombre comercial',
    'elegir la estructura legal definitiva',
    'reunir los documentos requeridos para el registro',
    'presentar el tramite de registro mercantil',
    'obtener el numero de identificacion tributaria',
    'registrar la firma ante el municipio o autoridad local',
    'constitucion y registro mercantil'
  ],
  'registros y certificaciones oficiales': [
    'investigar que certificacion exige el regulador de tu pais',
    'inscribirte al examen o proceso de certificacion',
    'presentar el examen de certificacion',
    'obtener el numero de registro profesional',
    'registros y certificaciones oficiales'
  ],
  'estructura de contratos legales': [
    'redactar el borrador del contrato de servicios',
    'hacer revisar el contrato por un abogado',
    'redactar la politica de cancelacion y reembolsos',
    'redactar contrato de servicios',
    'estructura de contratos legales'
  ],
  'cuentas bancarias comerciales': [
    'comparar bancos con cuentas para empresas de servicios profesionales',
    'reunir los documentos requeridos por el banco',
    'abrir la cuenta bancaria empresarial',
    'activar la banca en línea',
    'abrir cuenta bancaria empresarial',
    'cuentas bancarias comerciales'
  ],
  'software contable y conciliacion': [
    'elegir un software de contabilidad',
    'configurar el software de contabilidad',
    'elegir y configurar software contable',
    'software contable y conciliacion'
  ],
  'contratacion de seguro de responsabilidad civil profesional eo': [
    'cotizar seguros de responsabilidad profesional',
    'contratar el seguro de responsabilidad profesional',
    'contratar seguro de responsabilidad profesional e o',
    'contratacion de seguro de responsabilidad civil profesional eo'
  ],
  'protocolo de continuidad del negocio y de gestion de crisis': [
    'protocolo de continuidad del negocio y gestion de crisis'
  ],
  'diseno de logotipo y paleta de colores': [
    'definir la paleta de colores de marca',
    'elegir la tipografia de marca',
    'definir las variantes del logo',
    'disenar la tarjeta de presentacion',
    'disenar el membrete',
    'configurar la firma de correo de marca',
    'definir el nombre comercial visible al publico',
    'escribir el eslogan de la firma',
    'escribir el eslogan',
    'definir paleta de colores',
    'elegir tipografia',
    'disenar el logo',
    'diseno de logotipo y paleta de colores'
  ],
  'registro de dominio y sitio web basico': [
    'registrar el dominio del sitio web',
    'contratar el hosting del sitio web',
    'elegir la plataforma para construir el sitio web',
    'definir el mapa del sitio',
    'redactar el contenido de la pagina de inicio',
    'redactar la pagina de servicios',
    'redactar la pagina sobre mi nosotros',
    'redactar la pagina de contacto',
    'publicar la politica de privacidad en el sitio',
    'configurar el correo electronico profesional',
    'registrar dominio y contratar hosting',
    'definir mapa del sitio',
    'redactar contenido de pagina de inicio',
    'publicar el sitio web',
    'registro de dominio y sitio web basico'
  ],
  'ficha en google maps y seo local': [
    'crear el perfil de google business profile',
    'crear google business profile',
    'registrar la firma en directorios profesionales del sector',
    'registrar tu firma en sitios de resenas relevantes del sector',
    'ficha en google maps y seo local'
  ],
  'creacion de material educativo y lead magnets': [
    'escribir tu biografia profesional',
    'tomar fotografias profesionales',
    'definir el tono de comunicacion de la marca',
    'redactar el guion de presentacion de 30 segundos',
    'disenar un folleto o material de presentacion descargable',
    'creacion de material educativo y lead magnets'
  ],
  'configuracion de crm y automatizacion de embudos de venta': [
    'comparar opciones de crm para firmas pequenas',
    'elegir y contratar el crm',
    'configurar el crm con tus paquetes de servicios',
    'elegir crm para la firma',
    'configuracion de crm y automatizacion de embudos de venta'
  ],
  'programa de referidos y fidelizacion de clientes': [
    'definir tu programa de referidos',
    'implementar programa de referidos',
    'programa de referidos y fidelizacion de clientes'
  ]
};

// Crear conjunto de títulos cubiertos conceptualmente por la versión profesional pulida
const coveredTitles = new Set();

Object.entries(conceptMapping).forEach(([profKey, origList]) => {
  coveredTitles.add(cleanString(profKey));
  origList.forEach(item => {
    coveredTitles.add(cleanString(item));
  });
});

const allStepsToMerge = [];

// 1. Añadir los 36 pasos profesionales pulidos como el core maestro de la unificación (100% de calidad)
profSteps.forEach(s => {
  allStepsToMerge.push({
    step: s,
    origPhaseTitle: '' // Se guiará por fallbacks de palabras clave
  });
});

// 2. Añadir los pasos adicionales de la versión de 120 que NO están cubiertos conceptualmente
origSteps.forEach(s => {
  const cleanT = cleanString(s.title);
  if (!coveredTitles.has(cleanT)) {
    console.log(`➕ Añadiendo paso granular de 120: "${s.title}"`);
    const pInfo = orig.roadmap.find(p => p.steps.some(st => st.id === s.id));
    const origPhaseTitle = pInfo ? pInfo.title : '';
    allStepsToMerge.push({
      step: s,
      origPhaseTitle
    });
  }
});

// 3. Añadir los pasos recurrentes y los one_time exclusivos de la lista blanca de v3-linear que NO estén cubiertos
const uniqueV3OneTimeTitles = [
  'establecer el modelo de gobernanza',
  'realizar encuesta de necesidades del mercado',
  'implementar politicas kyc/aml'
];

v3Steps.forEach(v3s => {
  const type = v3s.type || 'one_time';
  const cleanT = cleanString(v3s.title);

  if (type === 'one_time') {
    const isUnique = uniqueV3OneTimeTitles.some(t => cleanString(t) === cleanT);
    if (!isUnique) return; // Se descarta porque ya está cubierto en 36 o en 120
  }

  if (!coveredTitles.has(cleanT)) {
    const dup = allStepsToMerge.some(item => cleanString(item.step.title) === cleanT);
    if (!dup) {
      console.log(`➕ Añadiendo paso exclusivo de v3: "${v3s.title}" (type: ${type})`);
      allStepsToMerge.push({
        step: v3s,
        origPhaseTitle: ''
      });
    }
  }
});

// 4. Mapear y distribuir en el mapa de fases estándar
allStepsToMerge.forEach(({ step, origPhaseTitle }) => {
  const destKey = getDestKey(step, origPhaseTitle);
  
  if (destKey && phasesMeta[destKey]) {
    phasesMeta[destKey].steps.push(step);
  } else {
    phasesMeta['01-estrategia'].push(step);
  }
});

// A. Construir conjunto de todos los IDs válidos en el blueprint final
const finalStepIds = new Set();
Object.values(phasesMeta).forEach(phase => {
  phase.steps.forEach(s => {
    finalStepIds.add(s.id);
  });
});

// B. Construir el mapa de traducción de dependencias
const depTranslationMap = {};
Object.entries(conceptMapping).forEach(([profTitle, origTitles]) => {
  const profClean = cleanString(profTitle);
  const pStep = profSteps.find(ps => cleanString(ps.title) === profClean);
  if (!pStep) return;

  const newId = pStep.id;

  origTitles.forEach(origTitle => {
    const origClean = cleanString(origTitle);
    const oStep = origSteps.find(os => cleanString(os.title) === origClean);
    if (oStep && oStep.id !== newId) {
      depTranslationMap[oStep.id] = newId;
    }
    const vStep = v3Steps.find(vs => cleanString(vs.title) === origClean);
    if (vStep && vStep.id !== newId) {
      depTranslationMap[vStep.id] = newId;
    }
  });
});

// C. Corregir y sanitizar dependencias
Object.values(phasesMeta).forEach(phase => {
  phase.steps.forEach(s => {
    if (s.dependencies && s.dependencies.length > 0) {
      s.dependencies = s.dependencies
        .map(depId => depTranslationMap[depId] || depId)
        .filter(depId => {
          const isValid = finalStepIds.has(depId);
          if (!isValid) {
            console.log(`⚠️ Depurada dependencia huérfana en "${s.title}": "${depId}" eliminada.`);
          }
          return isValid;
        });
    }
  });
});

// 5. Salvar archivos fragmentados
let totalSteps = 0;
Object.entries(phasesMeta).forEach(([key, phase]) => {
  const filename = `${key}.json`;
  const filePath = path.join(targetDir, filename);

  // Asegurar interactividad en el 100% de los pasos
  phase.steps.forEach((s) => {
    // Inicializar campos obligatorios si faltan para evitar crashes en el cliente
    if (!s.dependencies) s.dependencies = [];
    if (!s.content) s.content = {};
    if (!s.content.resources) s.content.resources = [];
    if (!s.content.checklist) s.content.checklist = [];
    if (!s.content.knowledge) s.content.knowledge = [];
    if (!s.content.assistant) s.content.assistant = { systemPrompt: "", context: "", suggestions: [] };
    if (!s.content.overview) s.content.overview = { title: s.title, summary: s.description || "", body: "" };
    if (!s.content.objective) s.content.objective = { description: s.title };

    if (!s.content.registroFields || s.content.registroFields.length === 0) {
      const isDate = cleanString(s.title).includes('renov') || cleanString(s.title).includes('venc') || cleanString(s.title).includes('fecha');
      s.content.registroFields = [
        {
          id: `${s.id.replace('v2-step-', '').replace('v2-rec-', '')}-status`,
          label: `Estado de: ${s.title}`,
          type: isDate ? 'date' : 'text',
          placeholder: isDate ? 'Selecciona la fecha' : 'Ej: Completado o Registrado',
          required: true
        }
      ];
    }
    if (!s.content.checklist || s.content.checklist.length === 0) {
      s.content.checklist = [
        {
          id: `chk-${s.id}`,
          task: `Completar la tarea de ${s.title.toLowerCase()}`,
          registryFieldRef: s.content.registroFields[0].id
        }
      ];
    } else {
      s.content.checklist.forEach(chk => {
        if (!chk.registryFieldRef) {
          chk.registryFieldRef = s.content.registroFields[0].id;
        }
      });
    }
  });

  const phaseData = {
    id: `fase-${key.replace(/^\d+-/, '')}`,
    title: phase.title,
    block: phase.block,
    steps: phase.steps.map((s, idx) => ({
      ...s,
      order: idx
    }))
  };

  fs.writeFileSync(filePath, JSON.stringify(phaseData, null, 2), 'utf8');
  console.log(`💾 Guardado ${filename} con ${phase.steps.length} pasos.`);
  totalSteps += phase.steps.length;
});

console.log(`=======================================================`);
console.log(`🎉 ¡FUSIÓN MÁXIMA E HIGIÉNICA COMPLETADA!`);
console.log(`📊 Total Pasos Distribuidos: ${totalSteps}`);
console.log(`=======================================================`);
