#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const origPath = path.resolve('blueprints/asesoria-financiera.json');
const v3Path = path.resolve('blueprints/asesoria-financiera-v3-linear.json');
const targetDir = path.resolve('blueprints/Asesoria Financiera');

if (!fs.existsSync(origPath) || !fs.existsSync(v3Path)) {
  console.error("❌ Error: Faltan archivos de origen para realizar la fusión.");
  process.exit(1);
}

const orig = JSON.parse(fs.readFileSync(origPath, 'utf8'));
const v3 = JSON.parse(fs.readFileSync(v3Path, 'utf8'));

const origSteps = (orig.roadmap || []).flatMap(p => p.steps || []);
const v3Steps = (v3.roadmap || []).flatMap(p => p.steps || []);

console.log(`📊 Total Pasos Iniciales - Original: ${origSteps.length} | v3-Linear: ${v3Steps.length}`);

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
  const id = s.id.toLowerCase();
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
  if (title.includes('mision') || title.includes('vision') || title.includes('proposito') || title.includes('gobernanza') || title.includes('mercado') || title.includes('encuesta')) return '01-estrategia';
  if (title.includes('kpi') || title.includes('presupuesto') || title.includes('equilibrio')) return '02-estrategia';
  if (title.includes('catalogo') || title.includes('tarifa') || title.includes('cobro') || title.includes('paquete')) return '03-estrategia';
  if (title.includes('seguro') || title.includes('riesgo') || title.includes('crisis')) return '09-negocios';
  if (title.includes('banc') || title.includes('cuenta') || title.includes('contabil')) return '08-negocios';
  if (title.includes('entidad') || title.includes('mercantil') || title.includes('registro') || title.includes('contrato') || title.includes('certificac') || title.includes('examen') || title.includes('kyc') || title.includes('aml')) return '07-negocios';
  if (title.includes('color') || title.includes('tipograf') || title.includes('logo') || title.includes('eslogan') || title.includes('biograf') || title.includes('foto')) return '11-clientes';
  if (title.includes('dominio') || title.includes('hosting') || title.includes('sitio web') || title.includes('web') || title.includes('google business') || title.includes('seo')) return '12-clientes';
  if (title.includes('onboarding') || title.includes('bienvenida') || title.includes('cuestionario') || title.includes('reunion') || title.includes('plan financiero')) return '05-operaciones';
  if (title.includes('crm') || title.includes('agendamiento') || title.includes('calendario') || title.includes('firma electronica') || title.includes('almacenamiento') || title.includes('linea telefonica')) return '04-operaciones';
  
  return '13-clientes';
}

const allStepsToMerge = [];

// 1. Agregar todos los 120 pasos originales
origSteps.forEach(s => {
  const pInfo = orig.roadmap.find(p => p.steps.some(st => st.id === s.id));
  const origPhaseTitle = pInfo ? pInfo.title : '';
  allStepsToMerge.push({
    step: s,
    origPhaseTitle
  });
});

// Lista blanca de pasos one_time de v3 que son verdaderamente exclusivos/nuevos
const uniqueV3OneTimeTitles = [
  'definir la mision y vision de la firma',
  'establecer el modelo de gobernanza',
  'desarrollar los kpis estrategicos',
  'realizar encuesta de necesidades del mercado',
  'implementar politicas kyc/aml'
];

// 2. Agregar pasos de v3-linear (recurrentes + one_time exclusivos de la lista blanca)
v3Steps.forEach(v3s => {
  const type = v3s.type || 'one_time';
  const titleClean = cleanString(v3s.title);
  
  if (type === 'one_time') {
    const isWhiteListed = uniqueV3OneTimeTitles.some(t => cleanString(t) === titleClean);
    if (!isWhiteListed) return; // Se descarta para evitar duplicados del original de 120
  }

  const dup = allStepsToMerge.some(item => cleanString(item.step.title) === titleClean);
  
  if (!dup) {
    console.log(`➕ Agregando paso exclusivo de v3: "${v3s.title}" (type: ${v3s.type || 'one_time'})`);
    allStepsToMerge.push({
      step: v3s,
      origPhaseTitle: ''
    });
  }
});

// 3. Mapear y distribuir en el mapa de fases estándar
allStepsToMerge.forEach(({ step, origPhaseTitle }) => {
  const destKey = getDestKey(step, origPhaseTitle);
  
  if (destKey && phasesMeta[destKey]) {
    phasesMeta[destKey].steps.push(step);
  } else {
    phasesMeta['01-estrategia'].push(step);
  }
});

// 4. Salvar archivos fragmentados
let totalSteps = 0;
Object.entries(phasesMeta).forEach(([key, phase]) => {
  const filename = `${key}.json`;
  const filePath = path.join(targetDir, filename);

  // Asegurar interactividad en el 100% de los pasos
  phase.steps.forEach((s) => {
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
console.log(`🎉 ¡FUSIÓN MÁXIMA COMPLETA CON RESPETO A GRANULARIDAD!`);
console.log(`📊 Total Pasos Distribuidos: ${totalSteps}`);
console.log(`=======================================================`);
