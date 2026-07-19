const fs = require("fs");
const path = require("path");

const jsonDestPath = path.resolve(__dirname, "../../../../Projects/Blueprint/Plataforma/blueprints/apicultura.json");
console.log("Compiling apicultura.json to:", jsonDestPath);

function makeStep({
  id,
  title,
  description,
  icon,
  type,
  estimatedHours,
  difficulty,
  priority,
  dependencies = [],
  body,
  objectiveDesc,
  tasks = [],
  whyItMatters,
  tip,
  bestPractices = [],
  commonMistakes = [],
  recommendedTools = [],
  registroFields = []
}) {
  return {
    id,
    title,
    description,
    icon,
    order: 0, // will be set later
    type,
    estimatedHours,
    difficulty,
    priority,
    dependencies,
    completionRules: {
      requiredChecklist: true,
      requiredResources: false,
      requiredApproval: false,
      requiredQuiz: false
    },
    content: {
      overview: {
        title,
        summary: description,
        body
      },
      objective: {
        description: objectiveDesc
      },
      checklist: tasks.map((t, i) => ({
        id: `chk-${id.replace("step-", "")}-${(i + 1).toString().padStart(2, "0")}`,
        task: t,
        completed: false
      })),
      resources: [],
      assistant: {
        systemPrompt: `Actúa como asesor experto en apicultura y agronegocios para el paso: ${title}.`,
        context: `El usuario está ejecutando el paso '${title}' del emprendimiento de apicultura.`,
        suggestions: [
          `¿Cómo realizo con éxito el paso: ${title}?`,
          `Dame una plantilla o guía detallada para ${title}.`,
          `¿Cuáles son los riesgos más grandes en ${title}?`
        ]
      },
      knowledge: [],
      whyItMatters,
      tip,
      bestPractices,
      commonMistakes,
      recommendedTools,
      registroFields
    }
  };
}

const strategySteps = [
  makeStep({
    id: "step-str-fin-equilibrio",
    title: "Cálculo de Punto de Equilibrio Financiero",
    description: "Determinar el volumen de ingresos y kilos de miel necesarios para cubrir gastos personales y del apiario.",
    icon: "scale",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Calcula con precisión matemática cuánta miel debes cosechar y vender para cubrir tus costos fijos anuales (amortización de equipos, arrendamiento del apiario, seguros) y variables (cera, envases, etiquetas, alimentación) combinados con tu costo de vida personal.",
    objectiveDesc: "¿Cuántos ingresos totales y kilogramos de miel necesito vender mensualmente para pagar todas mis cuentas?",
    tasks: [
      "Listar todos los costos fijos anuales del apiario.",
      "Listar el costo de vida personal mensual mínimo aceptable.",
      "Calcular el costo variable unitario de producción por kilogramo de miel.",
      "Calcular el punto de equilibrio en ingresos y en volumen físico (kilogramos)."
    ],
    whyItMatters: "Este cálculo define el límite entre la supervivencia y el fracaso. Si no alcanzas esta meta, agotarás tus reservas rápidamente.",
    tip: "Añade siempre un 15% extra a tus costos variables para imprevistos climáticos o pérdidas de colmenas.",
    bestPractices: [
      "Separar rígidamente tus gastos personales de los gastos del apiario.",
      "Incluir la depreciación anual de tus extractores y alzas."
    ],
    commonMistakes: [
      "No valorar financieramente tu propia mano de obra o tiempo en el campo.",
      "Olvidar sumar los costos de transporte e insumos menores."
    ],
    recommendedTools: [
      { name: "Plantilla de Punto de Equilibrio Apícola", url: "https://sheets.new" }
    ],
    registroFields: [
      {
        id: "reg-apic-fijo-anual",
        label: "Costo Fijo Anual Estimado (Apiario + Personal)",
        type: "number",
        required: true,
        helpText: "Ingresa el valor total en moneda local de tus costos fijos del año.",
        placeholder: "12000"
      },
      {
        id: "reg-apic-kilo-punto",
        label: "Meta de Volumen Anual en Kilos para Punto de Equilibrio",
        type: "number",
        required: true,
        helpText: "Cantidad de kilogramos que debes cosechar/vender.",
        placeholder: "500"
      }
    ]
  }),
  makeStep({
    id: "step-str-fin-estacionalidad",
    title: "Análisis de Estacionalidad de Floración y Ventas",
    description: "Mapear los ciclos florales de la región para anticipar meses de baja producción y planificar el flujo de caja.",
    icon: "calendar",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "normal",
    body: "La apicultura es un negocio altamente estacional. Debes documentar las curvas de floración locales e identificar la 'temporada de escasez' o invierno, donde las abejas consumen reservas y el apiario no produce ingresos pero sí demanda gastos de mantenimiento.",
    objectiveDesc: "¿Cuáles son las temporadas de escasez en mi región y cómo afectarán mi flujo de caja?",
    tasks: [
      "Entrevistar a apicultores locales y consultar manuales botánicos de la región.",
      "Diseñar un calendario floral detallando meses de floración abundante, media y escasez.",
      "Estimar el costo de la alimentación suplementaria requerida durante los meses bajos."
    ],
    whyItMatters: "Permite anticipar los momentos en que la colmena necesitará jarabes o tortas y evita quedarse sin efectivo durante los meses de nula cosecha.",
    tip: "Ahorra al menos el 20% de los ingresos de la cosecha principal para cubrir los gastos de la época de escasez.",
    bestPractices: [
      "Mantener un diario de campo de floraciones año con año.",
      "Monitorear las temperaturas y lluvias atípicas que retrasan las floraciones."
    ],
    commonMistakes: [
      "Asumir que las flores de jardín proveen suficiente alimento comercial.",
      "No guardar reservas de dinero para comprar azúcar o sustitutos de polen en invierno."
    ],
    registroFields: [
      {
        id: "reg-apic-meses-escasez",
        label: "Meses Identificados como de Escasez / Alimentación Requerida",
        type: "multiselect",
        required: true,
        helpText: "Selecciona los meses del año con menor flujo de néctar en tu zona.",
        options: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        placeholder: "Selecciona meses..."
      }
    ]
  }),
  makeStep({
    id: "step-str-fin-kpis",
    title: "Establecimiento de KPIs del Apiario",
    description: "Definir las métricas biológicas e ingresos esperados por colmena para medir el rendimiento comercial.",
    icon: "line-chart",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Define tus metas biológicas y comerciales. Establece el rendimiento de miel en kilos por colmena al año, porcentaje aceptable de pérdida invernal (mortalidad de colonias) e ingresos promedio mensuales.",
    objectiveDesc: "¿Qué números métricos exactos definen el éxito productivo de mi apiario?",
    tasks: [
      "Fijar la meta de rendimiento promedio de miel (kg por colmena/año).",
      "Establecer la meta de tasa de supervivencia de colmenas para fin de temporada.",
      "Definir el costo de producción aceptable por kilogramo cosechado."
    ],
    whyItMatters: "Lo que no se mide no se puede mejorar. Estas métricas diferencian un hobby de un agronegocio profesional.",
    tip: "Un apiario nuevo debe apuntar a una tasa de supervivencia de colmenas mayor al 85%.",
    registroFields: [
      {
        id: "reg-apic-kpi-rendimiento",
        label: "Rendimiento Meta de Miel (Kilos por Colmena/Año)",
        type: "number",
        required: true,
        helpText: "Cantidad promedio de kilos que esperas obtener por colmena al año.",
        placeholder: "30"
      }
    ]
  }),
  makeStep({
    id: "step-str-id-mision",
    title: "Declaración de Propósito y Misión del Apiario",
    description: "Definir el impacto ambiental, social y comercial de la firma y el apiario.",
    icon: "flag",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Redacta el propósito fundamental de tu negocio de apicultura. La misión debe comunicar claramente: 1. Qué vendes o qué servicio provees. 2. A quién beneficias (consumidores de alimentos sanos, agricultores mediante polinización). 3. Cómo proteges la biodiversidad de tu entorno.",
    objectiveDesc: "¿Cuál es la misión principal que guía las decisiones éticas y comerciales de mi apiario?",
    tasks: [
      "Definir los valores ecológicos y comerciales centrales.",
      "Redactar una declaración de misión concisa de un párrafo.",
      "Publicarla en tus materiales de marca y sitio web."
    ],
    whyItMatters: "En el sector ecológico y del agro, la transparencia y el propósito generan una conexión profunda con el cliente dispuesto a pagar precios premium.",
    registroFields: [
      {
        id: "reg-apic-mision",
        label: "Declaración Oficial de Misión",
        type: "textarea",
        required: true,
        helpText: "Escribe aquí la declaración de misión de tu apiario.",
        placeholder: "Nuestra misión es producir miel cruda 100% pura y local, protegiendo las poblaciones de abejas..."
      }
    ]
  }),
  makeStep({
    id: "step-str-id-vision",
    title: "Definición de la Visión y Escala a Largo Plazo",
    description: "Proyectar el crecimiento del apiario (cantidad de colmenas) y del catálogo de productos en un horizonte de 3-5 años.",
    icon: "target",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Determina cuál es tu visión a largo plazo. ¿Quieres mantenerte como un apiario familiar de 20-50 colmenas con entrega directa, o escalar a una explotación comercial de 200+ colmenas que venda a granel e incursione en la polinización industrial?",
    objectiveDesc: "¿Cuál será la escala operativa y comercial de mi apiario dentro de 3 a 5 años?",
    tasks: [
      "Determinar la meta máxima de colmenas que puedes manejar según tu tiempo e infraestructura.",
      "Definir si tu modelo a futuro requerirá la contratación de ayudantes.",
      "Documentar la visión de crecimiento."
    ],
    whyItMatters: "Define el tipo de maquinaria y transporte que debes adquirir desde el principio para evitar gastos dobles.",
    registroFields: [
      {
        id: "reg-apic-vision-largo",
        label: "Visión y Metas de Crecimiento a 3-5 Años",
        type: "textarea",
        required: true,
        helpText: "Describe detalladamente dónde quieres que esté el apiario en 5 años.",
        placeholder: "Convertirnos en un apiario de 150 colmenas con sala de extracción certificada..."
      }
    ]
  }),
  makeStep({
    id: "step-str-id-valores",
    title: "Establecimiento de Valores y Filosofía Apícola",
    description: "Definir los principios de manejo ético de las abejas y sustentabilidad del apiario.",
    icon: "shield",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "La apicultura ética requiere principios claros. Define tus compromisos sobre el bienestar de las colonias: no sobre-explotación de miel (dejando suficiente reserva de invierno), uso preferente de tratamientos orgánicos, y respeto a la flora nativa sin introducir especies invasivas perjudiciales.",
    objectiveDesc: "¿Cuáles son las reglas éticas de manejo animal y ambiental inquebrantables de mi apiario?",
    tasks: [
      "Redactar los 5 principios éticos de manejo de abejas.",
      "Definir políticas sobre el uso de tratamientos químicos de síntesis vs. tratamientos orgánicos."
    ],
    whyItMatters: "Los consumidores premium de productos naturales exigen coherencia ética en el manejo animal y ecológico.",
    registroFields: [
      {
        id: "reg-apic-valores-eticos",
        label: "Principios Éticos de Manejo Apícola",
        type: "textarea",
        required: true,
        helpText: "Enumera las reglas fundamentales que respetarás en el cuidado de tus colmenas.",
        placeholder: "1. Dejar siempre al menos un alza de miel de reserva para el invierno...\n2. No usar insecticidas..."
      }
    ]
  }),
  makeStep({
    id: "step-str-id-cliente",
    title: "Definición Estricta del Cliente Ideal",
    description: "Identificar los nichos del mercado objetivo (mayoristas, minoristas, fabricantes cosméticos, agricultores).",
    icon: "users",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "easy",
    priority: "high",
    body: "Define con exactitud quién comprará tu producción. No digas 'cualquier persona'. Describe perfiles específicos: tiendas naturistas que buscan proveedores locales con trazabilidad, familias conscientes de la salud dispuestas a pagar el doble por miel cruda, o agricultores locales que necesitan colmenas fuertes de polinización.",
    objectiveDesc: "¿Quién es mi comprador ideal y qué necesidades específicas satisface mi producto?",
    tasks: [
      "Identificar las tres tipologías de clientes potenciales principales.",
      "Describir sus motivaciones de compra (pureza, empaque, precio, cercanía).",
      "Validar el tamaño del mercado en tu región."
    ],
    whyItMatters: "Define el tipo de envase, el diseño de la marca y la estrategia de comunicación que usarás en el apiario.",
    registroFields: [
      {
        id: "reg-apic-perfil-cliente",
        label: "Perfil Detallado de los Clientes Ideales",
        type: "textarea",
        required: true,
        helpText: "Describe a tus clientes ideales principales.",
        placeholder: "Consumidor minorista de 25-50 años que valora la miel local y cruda para uso terapéutico..."
      }
    ]
  }),
  makeStep({
    id: "step-str-id-raza",
    title: "Selección de la Raza de Abejas a Cultivar",
    description: "Evaluar y elegir la variedad de Apis mellifera (italiana, carniola, caucásica, africanizada) óptima para la zona.",
    icon: "sprout",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "high",
    body: "Las razas de abejas tienen comportamientos radicalmente distintos: - Italiana (ligustica): Altamente productiva, pero consume muchas reservas en invierno. - Carniola (carnica): Excelente invernada y muy dócil, pero propensa a la enjambrazón rápida. - Africanizada: Sumamente rústica y resistente a plagas, pero con alta defensividad. Elige la raza idónea según tu nivel de experiencia, clima y cercanía de vecinos.",
    objectiveDesc: "¿Qué raza de abejas se adapta mejor al clima de mi apiario y a mis capacidades de manejo?",
    tasks: [
      "Consultar a la asociación de apicultores local sobre las razas dominantes y su comportamiento.",
      "Evaluar pros y contras de cada raza para tu ubicación.",
      "Seleccionar la raza definitiva para tus primeros núcleos."
    ],
    whyItMatters: "Una mala elección puede derivar en accidentes graves por picaduras (si usas abejas muy defensivas cerca de poblaciones) o en baja producción.",
    tip: "Para principiantes en zonas templadas, la abeja Carniola o Italiana seleccionada por docilidad es la mejor opción.",
    registroFields: [
      {
        id: "reg-apic-raza-abeja",
        label: "Raza de Abejas Seleccionada",
        type: "select",
        required: true,
        helpText: "Selecciona la raza principal con la que poblarás tus colmenas.",
        options: ["Italiana (Apis mellifera ligustica)", "Carniola (Apis mellifera carnica)", "Caucásica (Apis mellifera caucasica)", "Criolla / Africanizada", "Buckfast (Híbrido)"],
        placeholder: "Selecciona raza..."
      }
    ]
  }),
  makeStep({
    id: "step-str-id-flora",
    title: "Evaluación Floral y Capacidad de Carga del Apiario",
    description: "Mapear la vegetación melífera en un radio de 3 kilómetros a la redonda del apiario.",
    icon: "map-pin",
    type: "one_time",
    estimatedHours: 5,
    difficulty: "hard",
    priority: "high",
    body: "El radio normal de pecoreo de una abeja es de 3 km (unas 2,800 hectáreas). Debes inspeccionar este radio para asegurarte de que existe flora abundante (eucalipto, cítricos, trébol, acacia, arbustos nativos) que garantice el néctar y polen durante todo el ciclo productivo.",
    objectiveDesc: "¿Existe suficiente volumen y diversidad de plantas florales a mi alrededor para alimentar mis colmenas?",
    tasks: [
      "Identificar y mapear las principales especies de plantas melíferas a 3 km del terreno.",
      "Estimar el número máximo de colmenas que puede soportar el apiario (capacidad de carga, típicamente 25-40 colmenas por ubicación para evitar sobrepastoreo).",
      "Documentar el mapa floral."
    ],
    whyItMatters: "Saturar un apiario con más colmenas de las que el entorno puede alimentar reduce drásticamente la producción individual y propicia enfermedades.",
    registroFields: [
      {
        id: "reg-apic-capacidad-colmenas",
        label: "Capacidad de Carga del Terreno (Máximo de Colmenas)",
        type: "number",
        required: true,
        helpText: "Cantidad máxima de colmenas a albergar en este apiario según la flora disponible.",
        placeholder: "30"
      }
    ]
  }),
  makeStep({
    id: "step-str-id-agua",
    title: "Evaluación de Fuentes de Agua Cercanas",
    description: "Asegurar un suministro constante de agua limpia y diseñar bebederos artificiales seguros.",
    icon: "droplet",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "high",
    body: "Una colonia activa necesita hasta 4 litros de agua al día para regular la temperatura interna de la colmena y diluir la miel cristalizada para las crías. Debes verificar que existan fuentes naturales limpias o, en su defecto, instalar bebederos artificiales con flotadores (ramas, corchos, piedras) para que las abejas puedan beber sin ahogarse.",
    objectiveDesc: "¿De dónde obtendrán agua mis abejas y cómo garantizaré que no se ahoguen ni beban agua contaminada?",
    tasks: [
      "Inspeccionar fuentes de agua en un radio de 500 metros del apiario.",
      "Si no hay fuentes naturales limpias, planificar la ubicación e instalación de bebederos artificiales.",
      "Diseñar el sistema de flotación seguro para las abejas."
    ],
    whyItMatters: "Si no provees agua, las abejas irán a buscarla a piscinas, fuentes o abrevaderos de vecinos, causando molestias y conflictos.",
    tip: "Añade una pizca de sal marina al agua de los bebederos artificiales; a las abejas les atrae el olor a sales minerales y la encontrarán más rápido.",
    registroFields: [
      {
        id: "reg-apic-fuente-agua",
        label: "Fuente de Agua Identificada",
        type: "select",
        required: true,
        helpText: "Indica de dónde obtendrán agua las abejas.",
        options: ["Río o arroyo natural cercano", "Pozo o laguna natural", "Bebederos artificiales con flotadores", "Ninguna (Se debe instalar bebedero de forma obligatoria)"],
        placeholder: "Selecciona fuente..."
      }
    ]
  }),
  makeStep({
    id: "step-str-id-riesgos",
    title: "Evaluación de Riesgo de Pesticidas y Plaguicidas",
    description: "Identificar cultivos agrícolas aledaños que apliquen tratamientos de agroquímicos nocivos para el apiario.",
    icon: "alert-triangle",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "El mayor enemigo moderno de las abejas son los neonicotinoides e insecticidas sistémicos. Conversa con los agricultores vecinos y dueños de parcelas en un radio de 3 km. Identifica qué cultivan y si aplican pesticidas para coordinar avisos de fumigación y proteger tus colmenas a tiempo.",
    objectiveDesc: "¿Cuáles son las fuentes potenciales de envenenamiento de colmenas por actividades agrícolas vecinas?",
    tasks: [
      "Visitar fincas colindantes e identificar cultivos industriales.",
      "Establecer un canal de comunicación directo con los agricultores para recibir alertas previas a las fumigaciones.",
      "Tener un plan de contingencia (mallas de ventilación para cerrar piqueras durante fumigaciones)."
    ],
    whyItMatters: "Una sola fumigación agrícola no coordinada puede aniquilar el 100% de la población de abejas recolectoras de tu apiario en pocas horas.",
    registroFields: [
      {
        id: "reg-apic-riesgo-cultivos",
        label: "Evaluación de Riesgo de Agroquímicos Vecinos",
        type: "textarea",
        required: true,
        helpText: "Describe qué cultivos cercanos representan un riesgo y cómo te comunicarás con sus dueños.",
        placeholder: "Cultivo de maíz a 1.5 km aplica insecticidas en mayo. Contacto: Sr. Juan Pérez..."
      }
    ]
  }),
  makeStep({
    id: "step-str-id-servicios",
    title: "Selección de Productos y Servicios Core del Apiario",
    description: "Elegir los productos principales (miel, polen, propóleo, cera) y servicios adicionales a ofrecer.",
    icon: "briefcase",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "high",
    body: "La apicultura permite diversos flujos de ingresos. Elige tu oferta comercial principal: - Miel envasada de origen botánico definido. - Polen de abeja seco o fresco. - Propóleo crudo o en tinturas. - Cera de abejas bloque o velas. - Alquiler de colmenas para polinización dirigida de cultivos frutales o semilleros.",
    objectiveDesc: "¿Cuáles serán los pilares comerciales de ingresos de mi apiario en la primera fase?",
    tasks: [
      "Evaluar la demanda local y facilidad técnica de procesamiento para cada producto.",
      "Seleccionar un máximo de 3 productos/servicios iniciales para concentrar esfuerzos.",
      "Documentar el catálogo core de productos."
    ],
    whyItMatters: "Intenta producir todo el primer año dispersará tus recursos y reducirá la calidad general de tu miel.",
    registroFields: [
      {
        id: "reg-apic-productos-core",
        label: "Productos/Servicios Core Seleccionados",
        type: "multiselect",
        required: true,
        helpText: "Selecciona los productos con los que iniciarás comercialmente.",
        options: ["Miel envasada retail", "Miel a granel", "Polen de abejas", "Propóleo (tinturas)", "Cera de abejas", "Servicios de Polinización"],
        placeholder: "Selecciona productos..."
      }
    ]
  }),
  makeStep({
    id: "step-str-val-precios-min",
    title: "Fijación de Precios de Miel al Por Menor",
    description: "Establecer la estructura de precios minoristas para las diferentes presentaciones de miel.",
    icon: "tag",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "high",
    body: "Calcula los precios de venta minorista al consumidor final. Considera el costo de los insumos (frascos, tapas, etiquetas), el costo de la miel, gastos de distribución, el margen deseado (se recomienda un 50-60% para venta minorista) y el precio de mercado de la miel pura de tu zona.",
    objectiveDesc: "¿A cuánto venderé al público general mis presentaciones de miel para asegurar rentabilidad?",
    tasks: [
      "Definir el costo total por unidad envasada (frasco + tapa + etiqueta + miel).",
      "Establecer precio minorista para frasco de 250g, 500g y 1000g.",
      "Verificar que el precio esté acorde al valor premium percibido por tu cliente ideal."
    ],
    whyItMatters: "Precios bajos devalúan la percepción de pureza de la miel, mientras que precios excesivos sin una marca fuerte reducen las ventas.",
    registroFields: [
      {
        id: "reg-apic-precio-500g",
        label: "Precio Minorista Sugerido para Frasco de 500g",
        type: "number",
        required: true,
        helpText: "Escribe el precio final de venta al público en moneda local.",
        placeholder: "12000"
      }
    ]
  }),
  makeStep({
    id: "step-str-val-precios-may",
    title: "Fijación de Precios de Miel al Por Mayor",
    description: "Establecer las escalas de descuento y precios mayoristas para tiendas, restaurantes y distribuidores.",
    icon: "layers",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "high",
    body: "Define tus márgenes de distribución. Los distribuidores, hoteles o tiendas naturistas requerirán descuentos sustanciales (típicamente del 30% al 45% sobre el precio minorista) a cambio de compras por volumen o cajas cerradas. Establece el volumen mínimo de compra mayorista.",
    objectiveDesc: "¿Cuál es mi tabulador de precios al por mayor y el volumen mínimo requerido para activarlo?",
    tasks: [
      "Calcular el margen de ganancia remanente al aplicar un descuento del 40%.",
      "Definir la cantidad de unidades mínimas para considerarse pedido mayorista (ej. 1 caja de 12 unidades).",
      "Elaborar un tarifario formal en PDF para compartir con comercios interesados."
    ],
    whyItMatters: "Te permite vender grandes volúmenes rápidamente a tiendas sin perder control de tus márgenes.",
    registroFields: [
      {
        id: "reg-apic-descuento-mayorista",
        label: "Porcentaje de Descuento Promedio sobre Precio de Lista",
        type: "number",
        required: true,
        helpText: "Porcentaje que se descontará a comercios mayoristas (ej. 35).",
        placeholder: "35"
      }
    ]
  }),
  makeStep({
    id: "step-str-val-envio",
    title: "Políticas de Pedido Mínimo y Envíos",
    description: "Definir las tarifas de envío, zonas de cobertura y el valor mínimo de compra para entregas.",
    icon: "truck",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Establece tus límites logísticos de distribución. Si vendes de forma directa a domicilio, determina el valor mínimo de compra para envío gratuito o el recargo estándar para zonas lejanas. Esto te protege de perder tiempo y dinero entregando frascos individuales muy lejos.",
    objectiveDesc: "¿Cómo estructuraré el cobro de envíos para mantener la rentabilidad de las entregas?",
    tasks: [
      "Definir el costo promedio por entrega propia o contratada.",
      "Establecer la compra mínima para entregas a domicilio sin costo.",
      "Crear un tarifario de envíos por zonas geográficas."
    ],
    whyItMatters: "Los costos invisibles de transporte (combustible, tiempo) pueden erosionar todo el margen de ganancia de un pedido pequeño.",
    registroFields: [
      {
        id: "reg-apic-envio-gratis-min",
        label: "Monto Mínimo de Pedido para Envío Gratis",
        type: "number",
        required: true,
        helpText: "Monto de compra mínima en moneda local para no cobrar envío.",
        placeholder: "60000"
      }
    ]
  }),
  makeStep({
    id: "step-str-val-garantias",
    title: "Redacción de la Garantía de Pureza y Calidad",
    description: "Establecer las promesas y garantías formales que respaldarán la calidad artesanal de la miel.",
    icon: "shield-alert",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Redacta el texto de garantía que se incluirá en las etiquetas de los frascos y sitio web. Certifica que la miel es 100% pura y cruda (no pasteurizada para mantener activos los beneficios del polen y enzimas), y describe tu política de devolución si un lote muestra algún defecto físico.",
    objectiveDesc: "¿Qué promesas tangibles de pureza haré al cliente y cómo responderé en caso de inconformidad?",
    tasks: [
      "Redactar el manifiesto de pureza (Miel Cruda de Apiario, Sin Aditivos).",
      "Definir la política de devoluciones o reemplazos de producto.",
      "Validar que no se usen afirmaciones médicas ilegales."
    ],
    whyItMatters: "En el mercado de la miel existe alta adulteración (jarabes). Una garantía firme de pureza justifica y defiende un precio más elevado.",
    registroFields: [
      {
        id: "reg-apic-texto-garantia",
        label: "Texto Oficial de la Garantía de Pureza",
        type: "textarea",
        required: true,
        helpText: "Texto corto para etiquetas o web.",
        placeholder: "Garantizamos miel 100% pura de abeja, cruda y sin procesos de pasteurización..."
      }
    ]
  }),
  makeStep({
    id: "step-str-val-trashumancia-radio",
    title: "Establecimiento del Radio de Trashumancia",
    description: "Definir los límites geográficos para la movilización de colmenas buscando floraciones.",
    icon: "map",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "normal",
    body: "La trashumancia (mover colmenas de un campo a otro persiguiendo floraciones estacionales) puede duplicar tu producción de miel, pero implica costos de logística significativos. Define el radio máximo de distancia de viaje (en kilómetros o tiempo de trayecto) que puedes costear de manera rentable para mover colmenas.",
    objectiveDesc: "¿Cuál es la distancia máxima rentable a la que trasladaré colmenas para cosechar?",
    tasks: [
      "Calcular el costo del transporte por kilómetro (combustible, desgaste, tiempo nocturno).",
      "Identificar terrenos de apicultores aliados o agricultores interesados dentro del radio establecido.",
      "Definir si tu apiario será estático (fijo) o trashumante."
    ],
    whyItMatters: "Viajes excesivamente largos sin una gran producción asegurada pueden resultar en balances negativos para el ciclo anual.",
    registroFields: [
      {
        id: "reg-apic-radio-traslados",
        label: "Radio Máximo de Traslado de Colmenas (Kilómetros)",
        type: "number",
        required: true,
        helpText: "Distancia máxima en km para mover colmenas desde tu base de operaciones.",
        placeholder: "50"
      }
    ]
  }),
  makeStep({
    id: "step-str-val-revision",
    title: "Revisión Trimestral de Márgenes y Estacionalidad",
    description: "Evaluar periódicamente los costos reales frente a las proyecciones y ajustar los precios de venta.",
    icon: "refresh-cw",
    type: "quarterly",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "high",
    body: "Cada tres meses, revisa detalladamente tu rentabilidad. Compara los costos reales de los tratamientos, cera y envases con el presupuesto estimado. Si detectas un desvío o alza de costos, recalcula tu punto de equilibrio y ajusta las tarifas de venta si es necesario.",
    objectiveDesc: "¿Mis márgenes reales siguen alineados con los objetivos iniciales o necesito ajustar precios?",
    tasks: [
      "Revisar el registro de gastos reales del último trimestre.",
      "Comparar costo variable por unidad de miel producida contra la proyección inicial.",
      "Efectuar ajustes de precio de venta en listas mayoristas/minoristas si aplica."
    ],
    whyItMatters: "Evita que incrementos paulatinos en insumos menores (como el flete o las etiquetas) eliminen tu rentabilidad sin que te des cuenta.",
    registroFields: [
      {
        id: "reg-apic-obs-marginales",
        label: "Notas de la Revisión Marginal del Trimestre",
        type: "textarea",
        required: true,
        helpText: "Describe los desvíos hallados y las decisiones tomadas sobre precios.",
        placeholder: "Los envases de vidrio subieron 10%. Se determinó mantener el precio minorista..."
      }
    ]
  })
];

const businessSteps = [
  makeStep({
    id: "step-bus-leg-registro",
    title: "Registro Comercial y Formalización de la Firma",
    description: "Elegir la denominación social y realizar el registro oficial de la empresa del apiario.",
    icon: "file-text",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Elige la estructura legal de tu negocio (ej. Persona Física con actividad empresarial, o Sociedad Simplificada / S.A.S. en tu país). Realiza el trámite de registro mercantil e inscripción tributaria para obtener tu NIT, RUT o RFC oficial que te permita emitir facturas legales a tus compradores mayoristas.",
    objectiveDesc: "¿Bajo qué figura jurídica operará formalmente mi apiario ante las autoridades?",
    tasks: [
      "Verificar disponibilidad del nombre comercial en los registros públicos.",
      "Redactar los estatutos o formalizar la inscripción mercantil.",
      "Obtener la identificación fiscal oficial (NIT/RUT/RFC)."
    ],
    whyItMatters: "Los grandes distribuidores, supermercados y farmacias exigen facturación legal y formalidad tributaria para comprar tu miel.",
    registroFields: [
      {
        id: "reg-apic-nit-fiscal",
        label: "Número de Identificación Fiscal Oficial (NIT/RUT/RFC)",
        type: "text",
        required: true,
        helpText: "Ingresa el código identificador de impuestos otorgado por la entidad gubernamental.",
        placeholder: "900.222.111-9"
      }
    ]
  }),
  makeStep({
    id: "step-bus-leg-registro-pecuario",
    title: "Registro de Apiario ante Autoridades Agropecuarias",
    description: "Inscribir los apiarios en el registro de predios pecuarios ante la entidad oficial de sanidad del agro.",
    icon: "landmark",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Inscribe oficialmente tus apiarios y ubicaciones geográficas ante el ministerio o departamento de agricultura de tu país (ej. ICA en Colombia, SENASA, SAG, o equivalentes). Esto legaliza la posesión de las abejas y te otorga un certificado indispensable para la movilización y transporte de colmenas.",
    objectiveDesc: "¿Está mi apiario oficialmente inscrito y georreferenciado ante la autoridad sanitaria del agro?",
    tasks: [
      "Radicar el formulario de inscripción de apiarios con las coordenadas exactas de cada ubicación.",
      "Presentar el título de propiedad del predio o el contrato de comodato/uso de suelo.",
      "Obtener el certificado de Registro de Apiario oficial."
    ],
    whyItMatters: "Es obligatorio por ley para combatir el robo de colmenas y para recibir apoyos o notificaciones de sanidad agrícola gubernamentales.",
    registroFields: [
      {
        id: "reg-apic-codigo-pecuario",
        label: "Código o Número de Registro de Apiario",
        type: "text",
        required: true,
        helpText: "Código oficial pecuario asignado a tu predio.",
        placeholder: "REG-APIC-0092"
      }
    ]
  }),
  makeStep({
    id: "step-bus-leg-permisos-sanitarios",
    title: "Obtención de Registro o Permiso Sanitario de Alimentos",
    description: "Tramitar la autorización sanitaria para la sala de envasado e inocuidad alimentaria de la miel.",
    icon: "shield-check",
    type: "one_time",
    estimatedHours: 8,
    difficulty: "hard",
    priority: "high",
    body: "La miel es un alimento de consumo humano. Debes obtener la licencia sanitaria de envasado o registro sanitario del producto (ej. INVIMA en Colombia, COFEPRIS en México, o FDA) cumpliendo con las Buenas Prácticas de Manufactura (BPM) en tu sala de extracción para asegurar la inocuidad.",
    objectiveDesc: "¿Tengo las licencias y registros de salud obligatorios para procesar y vender miel legalmente?",
    tasks: [
      "Adecuar la sala de envasado con superficies lavables, mallas anti-insectos y agua potable.",
      "Presentar la solicitud oficial de registro sanitario de alimentos.",
      "Obtener la resolución aprobatoria de inocuidad."
    ],
    whyItMatters: "Vender miel de consumo directo sin registro sanitario puede derivar en multas de miles de dólares y el decomiso de tus lotes.",
    tip: "Si tu sala de extracción aún no cumple las normas, considera subcontratar temporalmente el envasado en una sala de extracción que ya cuente con los permisos sanitarios.",
    registroFields: [
      {
        id: "reg-apic-registro-sanitario",
        label: "Número de Registro Sanitario de Alimentos",
        type: "text",
        required: true,
        helpText: "Código otorgado por la agencia de salud nacional.",
        placeholder: "RSA-009923-26"
      }
    ]
  }),
  makeStep({
    id: "step-bus-leg-contrato-terreno",
    title: "Formalización de Contratos de Comodato de Uso de Suelo",
    description: "Asegurar contratos por escrito con los dueños de los predios agrícolas donde colocas tus abejas.",
    icon: "pen-tool",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "high",
    body: "Incluso si el apiario se ubica en la finca de un amigo o familiar, debes firmar un contrato de comodato o arrendamiento simple. Especifica la cantidad máxima de colmenas permitidas, los horarios de acceso permitidos, y el pago acordado (el cual puede pactarse con un porcentaje de la miel cosechada, ej. 10%).",
    objectiveDesc: "¿Tengo acuerdos jurídicos por escrito para garantizar la permanencia de mis colmenas en los terrenos?",
    tasks: [
      "Redactar los borradores de contrato de comodato para cada ubicación de apiario.",
      "Acordar los términos de acceso y responsabilidad civil por posibles picaduras con el dueño del predio.",
      "Firmar y archivar los contratos digitales/físicos."
    ],
    whyItMatters: "Evita disputas legales inmediatas si el propietario del terreno vende la finca o decide unilateralmente que ya no quiere abejas en su propiedad.",
    registroFields: [
      {
        id: "reg-apic-contrato-url",
        label: "Enlace al Contrato de Uso de Suelo (PDF)",
        type: "url",
        required: true,
        helpText: "Sube y pega el enlace del contrato firmado de tu apiario.",
        placeholder: "https://drive.google.com/..."
      }
    ]
  }),
  makeStep({
    id: "step-bus-leg-seguro-responsabilidad",
    title: "Contratación de Seguro de Responsabilidad Civil",
    description: "Adquirir póliza de seguro contra accidentes provocados por las abejas a terceros o animales.",
    icon: "umbrella",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "easy",
    priority: "normal",
    body: "Contrata un seguro de responsabilidad civil comercial. Esta cobertura te protegerá financieramente en caso de que tus abejas escapen en un enjambre o ataquen a personas o animales en predios vecinos, cubriendo los gastos médicos o compensaciones.",
    objectiveDesc: "¿Mi negocio está protegido ante posibles demandas por ataques o picaduras de abejas a terceros?",
    tasks: [
      "Cotizar con corredores de seguros locales pólizas de responsabilidad civil agrícola/comercial.",
      "Establecer la suma asegurada mínima apropiada.",
      "Adquirir y activar la póliza."
    ],
    whyItMatters: "Los incidentes apícolas graves pueden acarrear demandas de indemnización destructivas para un pequeño apicultor.",
    registroFields: [
      {
        id: "reg-apic-seguro-rc-codigo",
        label: "Número de Póliza de Seguro de Responsabilidad Civil",
        type: "text",
        required: true,
        helpText: "Ingresa el número de póliza comercial contratado.",
        placeholder: "RC-APIC-99238"
      }
    ]
  }),
  makeStep({
    id: "step-bus-leg-seguro-colmenas",
    title: "Contratación de Seguro de Colmenas y Apiarios",
    description: "Evaluar y adquirir seguros contra robo, incendios forestales o desastres naturales.",
    icon: "lock",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "easy",
    priority: "normal",
    body: "Los apiarios están expuestos a incendios forestales, inundaciones y robos de colmenas (un problema recurrente en zonas alejadas). Evalúa si hay pólizas de seguro agrícola específicas para cubrir el valor de reposición física de las colmenas y las colonias en caso de desastre.",
    objectiveDesc: "¿Cómo compensaré las pérdidas financieras si mis apiarios sufren vandalismo o incendios forestales?",
    tasks: [
      "Cotizar pólizas de cobertura para activos pecuarios/apícolas.",
      "Instalar candados y mallas perimetrales como requisito de la aseguradora.",
      "Registrar la vigencia de la cobertura contratada."
    ],
    whyItMatters: "El robo de 10 o 15 colmenas activas representa la pérdida de miles de dólares en inversión directa.",
    registroFields: [
      {
        id: "reg-apic-seguro-predial",
        label: "Número de Póliza de Seguro Predial/Apiarios",
        type: "text",
        required: false,
        helpText: "Código de póliza si decides asegurar las colmenas físicamente.",
        placeholder: "AP-992381"
      }
    ]
  }),
  makeStep({
    id: "step-bus-inf-cuenta-banco",
    title: "Apertura de Cuenta Bancaria Comercial Exclusiva",
    description: "Abrir cuenta de cheques comercial para canalizar todos los ingresos y egresos del apiario.",
    icon: "credit-card",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "high",
    body: "Separa completamente tu dinero. Abre una cuenta bancaria comercial exclusivamente para el apiario. Todos los cobros por ventas de miel y todos los pagos de cera, azúcar o envases deben realizarse única y exclusivamente a través de esta cuenta para facilitar el control contable.",
    objectiveDesc: "¿El flujo de caja de mi apiario está blindado de mis finanzas personales a través de una cuenta exclusiva?",
    tasks: [
      "Presentar los documentos legales de la empresa constituida ante el banco de tu elección.",
      "Abrir la cuenta bancaria comercial.",
      "Configurar la banca por internet móvil segura."
    ],
    whyItMatters: "La mezcla de cuentas bancarias personales y empresariales dificulta la deducción de impuestos y el cálculo del margen real de ganancia.",
    registroFields: [
      {
        id: "reg-apic-banco-cuenta",
        label: "Número de Cuenta Bancaria Comercial",
        type: "text",
        required: true,
        helpText: "Ingresa el número de cuenta corriente o empresarial.",
        placeholder: "001-99238-23"
      }
    ]
  }),
  makeStep({
    id: "step-bus-inf-tarjeta",
    title: "Adquisición de Tarjeta de Crédito Comercial Dedicada",
    description: "Establecer una tarjeta de crédito exclusiva para compras operativas e insumos del apiario.",
    icon: "credit-card",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Solicita o asigna una tarjeta de crédito exclusiva para los gastos del apiario. Úsala para comprar azúcar en volumen, tratamientos de sanidad apícola, envases, repuestos vehiculares o publicidad digital.",
    objectiveDesc: "¿Tengo un medio de pago de crédito dedicado exclusivamente al negocio apícola?",
    tasks: [
      "Obtener una tarjeta de crédito corporativa o de uso exclusivo.",
      "Configurar recordatorios de pago para evitar intereses altos."
    ],
    whyItMatters: "Facilita la conciliación bancaria semanal y permite registrar facturas deducibles de forma mucho más rápida.",
    registroFields: [
      {
        id: "reg-apic-tarjeta-ultimos",
        label: "Últimos 4 Dígitos de Tarjeta Comercial Dedicada",
        type: "text",
        required: true,
        helpText: "Referencia para tu conciliación contable.",
        placeholder: "9982"
      }
    ]
  }),
  makeStep({
    id: "step-bus-inf-pasarelas",
    title: "Configuración de Pasarelas de Pago y Cobro Móvil",
    description: "Habilitar medios de pago digital y terminales móviles para aceptar pagos de clientes con tarjeta.",
    icon: "globe",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "easy",
    priority: "normal",
    body: "Configura pasarelas de pago y cobro móvil en ferias y mercados (ej. terminales Square, transferencias bancarias directas, pasarelas tipo MercadoPago o Stripe en tu web). Aceptar tarjetas agiliza las ventas de miel y reduce la necesidad de manejar efectivo.",
    objectiveDesc: "¿Qué medios de cobro electrónico tengo activos para recibir pagos de clientes?",
    tasks: [
      "Crear y validar cuentas comerciales en Square o Stripe.",
      "Solicitar el lector de tarjetas físico para cobros en campo/mercados.",
      "Vincular la pasarela a tu cuenta bancaria comercial."
    ],
    whyItMatters: "Los clientes de ferias y mercados orgánicos compran hasta un 40% más si se les ofrece la opción de pagar con tarjeta.",
    registroFields: [
      {
        id: "reg-apic-pasarela-activa",
        label: "Pasarela o Método de Cobro Móvil Principal",
        type: "text",
        required: true,
        helpText: "Ej. Square Reader, Transferencia Bancaria, Stripe.",
        placeholder: "Square Reader"
      }
    ]
  }),
  makeStep({
    id: "step-bus-inf-software-registro",
    title: "Configuración de Software de Gestión Apícola",
    description: "Implementar software o plantillas estructuradas para registrar las inspecciones e historial de cada colmena.",
    icon: "smartphone",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Un apiario profesional no puede depender de libretas de papel mojadas. Configura una herramienta de software especializada (ej. HiveTracks, Apiary Book o una hoja de cálculo en Drive estructurada por lotes y colmenas) para registrar: fechas de inspección, postura de la reina, carga de Varroa y tratamientos médicos aplicados.",
    objectiveDesc: "¿Qué sistema estructurado usaré para no perder la información histórica de mis colmenas?",
    tasks: [
      "Descargar e instalar la app de gestión apícola elegida.",
      "Vincular cada colmena física con un código QR o identificador en el sistema digital.",
      "Probar el funcionamiento de carga de datos sin conexión a internet en el apiario."
    ],
    whyItMatters: "Llevar la trazabilidad histórica de tratamientos sanitarios es obligatorio para el registro sanitario y clave para saber qué colmenas rinden más.",
    tip: "Usa marcadores o códigos QR plastificados adheridos a la tapa de cada colmena para escanearlos rápidamente en el campo.",
    registroFields: [
      {
        id: "reg-apic-crm-sistema",
        label: "Nombre del Software de Registro Apícola Elegido",
        type: "text",
        required: true,
        helpText: "Nombre de la app o 'Hoja de Cálculo de Drive'.",
        placeholder: "Apiary Book"
      }
    ]
  }),
  makeStep({
    id: "step-bus-inf-software-contable",
    title: "Configuración de Software Contable",
    description: "Elegir y estructurar la plataforma de contabilidad para el seguimiento mensual de finanzas.",
    icon: "calculator",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "normal",
    body: "Implementa un sistema contable (ej. QuickBooks, Wave o una hoja de cálculo P&L bien estructurada). Configura las categorías de gastos específicas del apiario (mano de obra, alimentación, combustible, envases, cera estampada) para generar reportes financieros claros.",
    objectiveDesc: "¿Con qué software realizaré el control contable del negocio apícola?",
    tasks: [
      "Configurar las cuentas de gastos y de ingresos en el software contable.",
      "Enlazar la cuenta bancaria comercial para descargas automáticas de transacciones si es posible."
    ],
    whyItMatters: "Facilita la declaración de impuestos anual y te da control inmediato de la salud financiera del agronegocio.",
    registroFields: [
      {
        id: "reg-apic-contabilidad-software",
        label: "Software de Contabilidad Seleccionado",
        type: "text",
        required: true,
        helpText: "Ej. Wave, QuickBooks, Excel.",
        placeholder: "Wave Accounting"
      }
    ]
  }),
  makeStep({
    id: "step-bus-inf-respaldos",
    title: "Plan de Copias de Seguridad y Respaldo",
    description: "Configurar una rutina de respaldos automáticos en la nube para proteger registros sanitarios y comerciales.",
    icon: "folder",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Toda la información del negocio (datos de apiario, facturas de compra, contratos de uso de suelo, guías de movilización) debe respaldarse de forma periódica en un almacenamiento en la nube (ej. Google Drive, OneDrive o iCloud) o en un disco duro externo en un lugar seguro.",
    objectiveDesc: "¿Cómo protegeré los archivos digitales de mi apiario de pérdidas accidentales o daños físicos?",
    tasks: [
      "Configurar sincronización automática en la nube de tu carpeta de documentos de la empresa.",
      "Establecer la rutina de copia semanal de los registros de campo de las abejas."
    ],
    whyItMatters: "Si tu teléfono de campo se cae en una colmena o se daña con agua de lluvia, no perderás los registros históricos del apiario.",
    registroFields: [
      {
        id: "reg-apic-respaldos-url",
        label: "Ubicación o Enlace de la Carpeta de Respaldos en Nube",
        type: "url",
        required: true,
        helpText: "Enlace a la carpeta principal de tu almacenamiento en la nube.",
        placeholder: "https://drive.google.com/..."
      }
    ]
  }),
  makeStep({
    id: "step-bus-adm-guiones",
    title: "Estandarización de Guiones de Atención",
    description: "Redactar guiones para llamadas y mensajes de clientes, cotizaciones y pedidos.",
    icon: "message-square",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Redacta plantillas de mensajes (para WhatsApp Business o correo electrónico) y guiones telefónicos para responder rápidamente: - ¿Cómo justificar el precio de tu miel pura frente a la miel adulterada del supermercado? - ¿Cuáles son los puntos de entrega y tarifas de envío? - ¿Qué condiciones de pago se manejan para pedidos mayoristas?",
    objectiveDesc: "¿Mis respuestas comerciales son consistentes, profesionales y defienden el valor del producto?",
    tasks: [
      "Escribir guión de respuesta para cotizaciones minoristas de WhatsApp.",
      "Redactar plantilla de propuesta mayorista para tiendas.",
      "Guardar las plantillas en las respuestas rápidas de WhatsApp Business."
    ],
    whyItMatters: "Te ahorra tiempo diario y garantiza que la propuesta de valor del apiario se explique siempre de forma impecable.",
    registroFields: [
      {
        id: "reg-apic-whatsapp-guion",
        label: "Guión Corto de WhatsApp para Cotizaciones de Miel",
        type: "textarea",
        required: true,
        helpText: "Pega el texto que usarás para responder a los clientes.",
        placeholder: "Hola! Gracias por contactar a Apiario La Colmena. Ofrecemos miel 100% cruda cosechada localmente..."
      }
    ]
  }),
  makeStep({
    id: "step-bus-adm-trazabilidad",
    title: "Diseño del Sistema de Trazabilidad por Lotes",
    description: "Crear un formato de nomenclatura de lote para rastrear el origen específico y fecha de cada frasco.",
    icon: "bookmark",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "high",
    body: "Diseña un código de trazabilidad para colocar en las etiquetas de los frascos. Por ejemplo: 'LOTE-API1-2405' (Lote de Apiario 1, Cosecha de Mayo de 2024). Mantén una bitácora donde asocies cada código de lote con las colmenas cosechadas, la fecha de extracción y los resultados de los análisis de humedad si se realizaron.",
    objectiveDesc: "¿Puedo identificar exactamente de qué apiario y fecha provino un frasco de miel específico?",
    tasks: [
      "Establecer la estructura lógica del código de lote.",
      "Crear una base de datos o plantilla para registrar los datos asociados a cada lote cosechado."
    ],
    whyItMatters: "En caso de reclamos de calidad o visitas de la autoridad de salud, debes ser capaz de aislar el lote problemático inmediatamente sin retirar todo tu inventario.",
    registroFields: [
      {
        id: "reg-apic-lote-ejemplo",
        label: "Formato de Nomenclatura de Lote Ejemplificado",
        type: "text",
        required: true,
        helpText: "Escribe la estructura del código de lote que usarás.",
        placeholder: "LOTE-[APIARIO]-[AÑO][MES]"
      }
    ]
  }),
  makeStep({
    id: "step-bus-adm-conciliacion",
    title: "Ingreso de Datos y Conciliación Semanal",
    description: "Revisar facturas de proveedores, registrar ventas de miel y conciliar las cuentas del banco.",
    icon: "repeat",
    type: "weekly",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "high",
    body: "Dedica un espacio semanal para la administración. Registra todas las ventas minoristas y mayoristas realizadas, las compras de insumos hechas con la tarjeta comercial y concilia estos movimientos con el extracto bancario en tu software de contabilidad.",
    objectiveDesc: "¿Mis transacciones de la semana están correctamente registradas y coinciden con mis balances bancarios?",
    tasks: [
      "Registrar todas las ventas de la semana en la base de datos.",
      "Ingresar los gastos e importar movimientos bancarios de la semana.",
      "Conciliar las diferencias y archivar facturas de compra."
    ],
    whyItMatters: "Garantiza que la información financiera esté siempre al día y evita acumular trabajo administrativo para el final de año.",
    registroFields: [
      {
        id: "reg-apic-conciliacion-obs",
        label: "Comentarios de la Conciliación de la Semana",
        type: "textarea",
        required: true,
        helpText: "Anota cualquier diferencia hallada o pago pendiente de registrar.",
        placeholder: "Semana conciliada. Se identificó un cobro duplicado de cera que ya se reclamó..."
      }
    ]
  })
];

const operationsSteps = [
  makeStep({
    id: "step-ope-adq-proveedor-nucleos",
    title: "Selección de Criaderos de Reinas y Núcleos Autorizados",
    description: "Identificar y contratar proveedores de genética apícola certificada para tus primeras colonias.",
    icon: "sprout",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Adquiere tus abejas de criaderos profesionales de confianza. Cotiza la compra de núcleos de abejas (típicamente de 4 o 5 cuadros con reina fecundada activa) o reinas seleccionadas por su mansedumbre, resistencia a Varroa y alta capacidad de acopio de miel.",
    objectiveDesc: "¿Quién proveerá mis primeras colmenas activas y qué garantías de sanidad genética ofrecen?",
    tasks: [
      "Investigar criaderos apícolas certificados por las autoridades sanitarias de tu zona.",
      "Confirmar que los núcleos vengan con reinas fecundadas jóvenes de la raza seleccionada.",
      "Hacer el depósito de reserva de los núcleos para la temporada de primavera."
    ],
    whyItMatters: "Genéticas deficientes o enfermas acarrearán altos niveles de agresividad, enjambrazón precoz y baja resistencia a plagas desde el arranque.",
    registroFields: [
      {
        id: "reg-apic-criadero-nombre",
        label: "Nombre del Criadero Apícola Proveedor",
        type: "text",
        required: true,
        helpText: "Nombre de la empresa o apicultor de genética.",
        placeholder: "Criadero Genético Las Abejas"
      }
    ]
  }),
  makeStep({
    id: "step-ope-adq-cajas",
    title: "Adquisición de Colmenas Físicas y Cera Estampada",
    description: "Comprar las cajas Langstroth, alzas de miel, cuadros de madera y hojas de cera estampada.",
    icon: "box",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Adquiere tus colmenas de madera o plástico (se recomienda el estándar universal Langstroth). Compra: pisos, piqueras, cámaras de cría, alzas melíferas, techos metálicos, cuadros y láminas de cera de abejas estampada que servirán de guía a las abejas para estirar los panales.",
    objectiveDesc: "¿Tengo todos los componentes físicos listos para armar y poblar las colmenas?",
    tasks: [
      "Comprar la cantidad necesaria de colmenas completas Langstroth (cámara + alzas).",
      "Adquirir láminas de cera estampada pura de abejas.",
      "Pintar el exterior de las colmenas de madera con pintura no tóxica para protegerlas de la intemperie (nunca pintar el interior)."
    ],
    whyItMatters: "Utilizar el estándar de medidas de la industria (Langstroth) facilita el intercambio de panales entre colmenas en caso de emergencias.",
    tip: "Usa colores claros o pastel (blanco, verde claro, azul) para pintar las colmenas; esto ayuda a reflejar el calor del sol y facilita la orientación visual de las abejas.",
    registroFields: [
      {
        id: "reg-apic-cantidad-colmenas-compradas",
        label: "Cantidad de Colmenas Físicas Adquiridas",
        type: "number",
        required: true,
        helpText: "Número de cajas Langstroth para poblar.",
        placeholder: "10"
      }
    ]
  }),
  makeStep({
    id: "step-ope-adq-herramientas",
    title: "Adquisición de Herramientas de Manejo Apícola",
    description: "Comprar el ahumador, palanca (cincel de campo), cepillo de abejas e insumos de manipulación.",
    icon: "wrench",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "high",
    body: "Consigue tus herramientas esenciales para el trabajo de inspección en el apiario. Necesitas: 1. Un ahumador de acero inoxidable de tamaño adecuado para tranquilizar a las abejas. 2. Una palanca de mano o cincel apícola para despegar los panales pegados con propóleo. 3. Un cepillo apícola para retirar abejas suavemente de los panales al cosechar.",
    objectiveDesc: "¿Tengo las herramientas operativas básicas para manipular colmenas de forma segura?",
    tasks: [
      "Adquirir ahumador con rejilla protectora contra quemaduras.",
      "Adquirir palanca apícola de acero inoxidable.",
      "Adquirir cepillo con cerdas suaves de nylon o naturales."
    ],
    whyItMatters: "El ahumador es tu principal herramienta de seguridad; el humo indica a las abejas que coman miel y disminuye su instinto defensivo.",
    registroFields: [
      {
        id: "reg-apic-adquisicion-herramientas",
        label: "Checklist de Herramientas Operativas Listas",
        type: "multiselect",
        required: true,
        helpText: "Marca las herramientas adquiridas.",
        options: ["Ahumador de acero", "Palanca / Cincel", "Cepillo apícola", "Combustible de ahumador (viruta/sacos)"],
        placeholder: "Selecciona..."
      }
    ]
  }),
  makeStep({
    id: "step-ope-adq-indumentaria",
    title: "Adquisición de Indumentaria de Seguridad Apícola",
    description: "Adquirir overol apícola de lona, careta protectora integrada y guantes de cuero.",
    icon: "shield",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "high",
    body: "Adquiere tu equipo de protección personal. Es obligatorio contar con un overol apícola blanco (color que calma a las abejas), una careta o velo protector con mosquitero que mantenga alejadas a las abejas de la cara, y guantes de cuero suave con mangas largas de lona ajustables.",
    objectiveDesc: "¿Tengo la indumentaria de protección completa para evitar picaduras masivas en el apiario?",
    tasks: [
      "Comprar overol completo apícola de tu talla con el velo integrado.",
      "Adquirir guantes de cuero de alta resistencia pero que permitan sensibilidad de tacto.",
      "Verificar que las cremalleras y costuras cierren herméticamente."
    ],
    whyItMatters: "Trabajar con miedo a las picaduras causa movimientos bruscos que alteran a las abejas y arruinan la inspección.",
    tip: "Lava tus guantes y overol frecuentemente; el olor a sudor o el veneno de picaduras anteriores contiene feromonas que incitan a las abejas a atacar en el mismo sitio.",
    registroFields: [
      {
        id: "reg-apic-overoles-cant",
        label: "Cantidad de Overoles de Protección Disponibles",
        type: "number",
        required: true,
        helpText: "Cantidad de trajes de protección listos para ti y tus acompañantes.",
        placeholder: "2"
      }
    ]
  }),
  makeStep({
    id: "step-ope-adq-maquinaria-extraccion",
    title: "Adquisición de Equipos de Extracción e Higiene de Miel",
    description: "Comprar el extractor centrífugo, mesa desoperculadora, filtros y tanques de decantación alimentarios.",
    icon: "wrench",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Adquiere la maquinaria para tu sala de extracción. Necesitas: - Un extractor centrífugo manual o eléctrico de acero inoxidable grado alimentario. - Una mesa de desoperculación con rejilla para escurrir opérculos. - Filtros de malla doble de nylon o acero. - Tanques decantadores plásticos alimentarios o de acero con grifo (válvula guillotina) para embotellar.",
    objectiveDesc: "¿Cuento con la maquinaria de acero inoxidable requerida para la extracción inocua de miel?",
    tasks: [
      "Adquirir extractor centrífugo de grado alimenticio.",
      "Adquirir cuchillo desoperculador (eléctrico o estándar) y tenedor.",
      "Adquirir tanques decantadores con capacidad apropiada para tu volumen de cosecha."
    ],
    whyItMatters: "El uso de plásticos no alimentarios o metales oxidables contamina químicamente la miel y anula los permisos sanitarios.",
    registroFields: [
      {
        id: "reg-apic-capacidad-extractor",
        label: "Capacidad de Extractor Adquirido (Marcos)",
        type: "number",
        required: true,
        helpText: "Cantidad de cuadros que puede centrifugar a la vez el extractor.",
        placeholder: "4"
      }
    ]
  }),
  makeStep({
    id: "step-ope-org-disposicion",
    title: "Distribución Espacial y Nivelación de Colmenas",
    description: "Ubicar los caballetes, nivelar las colmenas y orientar las piqueras de forma óptima en el apiario.",
    icon: "map-pin",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "normal",
    body: "Coloca tus colmenas en el campo de forma estratégica. Sitúalas sobre caballetes o bases elevadas a 30-40 cm del suelo para protegerlas de la humedad y depredadores (sapos, hormigas). Orienta las piqueras hacia el Este o Sureste para que los primeros rayos del sol de la mañana activen a las abejas recolectoras tempranamente.",
    objectiveDesc: "¿La disposición física de las colmenas favorece el trabajo de las abejas y facilita el manejo?",
    tasks: [
      "Instalar caballetes nivelados en el apiario.",
      "Nivelar las colmenas con una leve inclinación hacia el frente (piquera) para drenar el agua de lluvia que pueda entrar.",
      "Orientar piqueras lejos de vientos dominantes."
    ],
    whyItMatters: "Una colmena mal nivelada acumulará agua en el fondo, provocando hongos y mortandad de crías en invierno.",
    registroFields: [
      {
        id: "reg-apic-distancia-cajas",
        label: "Distancia Mínima de Separación Entre Colmenas (Metros)",
        type: "number",
        required: true,
        helpText: "Espacio entre colmenas para evitar confusión de las abejas al volver a su caja (deriva).",
        placeholder: "1.5"
      }
    ]
  }),
  makeStep({
    id: "step-ope-org-almacen-cera",
    title: "Organización y Conservación de Cuadros en Almacén",
    description: "Establecer métodos de protección de panales vacíos contra la polilla de la cera.",
    icon: "archive",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "normal",
    body: "Los panales vacíos de alza que guardas después de la cosecha son un imán para la polilla de la cera (Galleria mellonella), que puede destruirlos en semanas. Organiza tu almacén colgando los cuadros aireados, usa tratamientos biológicos (ej. Bacillus thuringiensis autorizado) o aplica frío para evitar la eclosión de huevos.",
    objectiveDesc: "¿Cómo conservaré intactos mis panales vacíos construidos de una cosecha a la siguiente?",
    tasks: [
      "Adecuar estanterías ventiladas para cuadros de alza vacíos.",
      "Definir el método de control físico/biológico contra la polilla.",
      "Inspeccionar el almacén periódicamente."
    ],
    whyItMatters: "Para la abeja es muy costoso fabricar cera (consume 8 kg de miel para hacer 1 kg de cera). Reutilizar panales construidos eleva la producción de miel del apiario.",
    registroFields: [
      {
        id: "reg-apic-metodo-polilla",
        label: "Método de Control de Polilla Adoptado",
        type: "text",
        required: true,
        helpText: "Método utilizado en tu bodega de almacenamiento de cuadros.",
        placeholder: "Conservación por ventilación y Bacillus thuringiensis"
      }
    ]
  }),
  makeStep({
    id: "step-ope-org-bebederos",
    title: "Instalación de Bebederos Artificiales Seguros",
    description: "Colocar bebederos en el apiario y equiparlos con flotadores seguros para las abejas.",
    icon: "droplet",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "high",
    body: "Instala recipientes de agua en el apiario. Es obligatorio cubrirlos con flotadores abundantes (ej. pedazos de corcho, ramas, rejillas de madera) para que las abejas puedan pararse sobre ellos sin caer al agua. Las abejas no saben nadar y se ahogan con extrema facilidad.",
    objectiveDesc: "¿Están los bebederos del apiario operativos y equipados con flotadores seguros?",
    tasks: [
      "Ubicar los contenedores de agua a unos 10-15 metros de las colmenas.",
      "Cubrir toda la superficie del agua con flotadores naturales.",
      "Programar reabastecimiento de agua limpia."
    ],
    whyItMatters: "Garantiza el suministro hídrico del apiario en verano y evita mortandad de abejas por ahogamiento directo en bebederos abiertos.",
    registroFields: [
      {
        id: "reg-apic-bebedero-volumen",
        label: "Capacidad Total de Bebederos Artificiales (Litros)",
        type: "number",
        required: true,
        helpText: "Suma de litros de tus fuentes de agua artificiales.",
        placeholder: "50"
      }
    ]
  }),
  makeStep({
    id: "step-ope-seg-msds",
    title: "Carpeta MSDS de Tratamientos Sanitarios",
    description: "Imprimir y portar las Hojas de Seguridad de los tratamientos de Varroa y químicos del apiario.",
    icon: "folder",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Compila una carpeta en tu vehículo y apiario con las Hojas de Datos de Seguridad de Materiales (MSDS/FDS) de cada sustancia química u orgánica que apliques (ej. ácido oxálico, ácido fórmico, timol, amitraz). Esta carpeta contiene la información clave de toxicidad y qué hacer en caso de contacto accidental.",
    objectiveDesc: "¿Tengo las hojas de seguridad química a la mano en el vehículo para caso de accidentes?",
    tasks: [
      "Descargar los PDF de MSDS de cada tratamiento que uses.",
      "Imprimirlos y guardarlos en una carpeta impermeable en el vehículo de trabajo."
    ],
    whyItMatters: "Los ácidos apícolas (como el oxálico o fórmico) son altamente corrosivos y pueden causar ceguera o quemaduras respiratorias si se inhalan o salpican.",
    registroFields: [
      {
        id: "reg-apic-carpeta-msds-url",
        label: "Enlace a Carpeta Digital de Hojas de Seguridad",
        type: "url",
        required: true,
        helpText: "Copia el enlace a tu Drive donde guardas los PDF de MSDS.",
        placeholder: "https://drive.google.com/..."
      }
    ]
  }),
  makeStep({
    id: "step-ope-seg-alergias",
    title: "Botiquín Apícola y Protocolo de Choque Anafiláctico",
    description: "Equipar un botiquín con antihistamínicos e inyectores de epinefrina (adrenalina) autoinyectable.",
    icon: "shield-alert",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "high",
    body: "El veneno de abeja (apitoxina) puede desencadenar reacciones alérgicas severas (anafilaxia) letales en minutos. Equipa de forma obligatoria un botiquín en tu vehículo apícola que contenga: antihistamínicos orales fuertes (ej. cetirizina, diphenhydramine) y, preferiblemente, un dispositivo de adrenalina autoinyectable (ej. EpiPen).",
    objectiveDesc: "¿Tengo los medicamentos de emergencia necesarios para responder ante una reacción alérgica grave?",
    tasks: [
      "Comprar un estuche de primeros auxilios impermeable.",
      "Adquirir antihistamínicos orales en farmacia.",
      "Consultar con un médico para adquirir y portar adrenalina autoinyectable de emergencia."
    ],
    whyItMatters: "Una picadura en la garganta o una alergia repentina no diagnosticada puede causar asfixia en el campo. Contar con epinefrina salva vidas.",
    registroFields: [
      {
        id: "reg-apic-epinefrina-vence",
        label: "Fecha de Vencimiento de Adrenalina/EpiPen del Botiquín",
        type: "date",
        required: true,
        helpText: "La epinefrina expira rápidamente. Registra la fecha para su renovación anual.",
        placeholder: "2025-12-31"
      }
    ]
  }),
  makeStep({
    id: "step-ope-seg-advertencia",
    title: "Señalización Perimetral de Advertencia del Apiario",
    description: "Instalar carteles informativos y de precaución en las vías de acceso cercanas al apiario.",
    icon: "alert-octagon",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Coloca letreros visibles en el perímetro de tu apiario e ingresos de la finca. Los carteles deben decir claramente: 'PRECAUCIÓN - APIARIO - ABEJAS TRABAJANDO - NO ACERCARSE'. Esto alerta a senderistas, cazadores o agricultores despistados para que no crucen la línea de vuelo de las piqueras.",
    objectiveDesc: "¿El perímetro de mi apiario cuenta con señales de advertencia claras para el público?",
    tasks: [
      "Adquirir o fabricar carteles de material resistente a la intemperie (acrílico o metal).",
      "Instalar los carteles a unos 50 metros antes de llegar a la piquera de las colmenas."
    ],
    whyItMatters: "Ayuda a evitar demandas de terceros por picaduras accidentales y demuestra que tomaste precauciones de seguridad estándar.",
    registroFields: [
      {
        id: "reg-apic-carteles-cantidad",
        label: "Cantidad de Carteles de Advertencia Instalados",
        type: "number",
        required: true,
        helpText: "Cantidad de letreros colocados en el apiario.",
        placeholder: "3"
      }
    ]
  }),
  makeStep({
    id: "step-ope-seg-trashumancia-log",
    title: "Logística y Seguridad para Movilización de Colmenas",
    description: "Establecer protocolos de sujeción nocturna y ventilación de colmenas para el transporte.",
    icon: "truck",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "high",
    body: "Si vas a mover colmenas (trashumancia), debes diseñar la logística de seguridad: - Utilizar mallas de transporte de piquera y tapa para evitar asfixia de las colonias. - Adquirir cintas de trinquete de amarre fuertes para fijar las cajas en el vehículo. - Realizar la movilización estrictamente de noche o al amanecer cuando todas las abejas recolectoras están dentro.",
    objectiveDesc: "¿Cuento con el equipamiento y protocolos para el transporte seguro y sin fugas de colmenas?",
    tasks: [
      "Adquirir mallas de ventilación para tapar piqueras de transporte.",
      "Comprar eslingas o correas de amarre comerciales.",
      "Definir el itinerario y ruta nocturna del traslado."
    ],
    whyItMatters: "Una colmena mal amarrada puede abrirse en la carretera durante el día, provocando una nube de abejas defensivas peligrosa para el tráfico.",
    registroFields: [
      {
        id: "reg-apic-eslingas-cantidad",
        label: "Cantidad de Eslingas de Amarre Disponibles",
        type: "number",
        required: true,
        helpText: "Número de correas de amarre listas para sujeción en camión.",
        placeholder: "4"
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-biologia",
    title: "Curso de Biología y Comportamiento de la Abeja",
    description: "Estudiar formalmente el ciclo de vida de la abeja, castas y dinámicas de la colonia.",
    icon: "book",
    type: "one_time",
    estimatedHours: 8,
    difficulty: "medium",
    priority: "high",
    body: "Realiza o estudia un curso formal de apicultura. Es indispensable conocer la biología de las abejas: - Ciclo de huevo a obrera (21 días), reina (16 días) y zángano (24 días). - Dinámicas del nido de cría (panal de miel en la corona, polen a los lados y cría al centro). - Identificación de la reina por su abdomen largo y movimiento dócil.",
    objectiveDesc: "¿Tengo el conocimiento teórico biológico suficiente para entender qué pasa dentro de la colmena?",
    tasks: [
      "Realizar un curso de apicultura certificado en línea o presencial.",
      "Estudiar el manual técnico de apicultura de tu región.",
      "Aprobar el examen básico del curso si aplica."
    ],
    whyItMatters: "Permite diagnosticar si una colmena está huérfana, hambrienta o lista para crecer, en lugar de manejar el apiario por ensayo y error.",
    registroFields: [
      {
        id: "reg-apic-curso-nombre",
        label: "Nombre del Curso o Manual Estudiado",
        type: "text",
        required: true,
        helpText: "Título de la formación apícola completada.",
        placeholder: "Curso Básico de Apicultura Práctica"
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-mentor",
    title: "Inspecciones Prácticas Guiadas con Mentores",
    description: "Acompañar a apicultores experimentados en visitas de inspección reales antes de poblar tus colmenas.",
    icon: "users",
    type: "one_time",
    estimatedHours: 6,
    difficulty: "medium",
    priority: "normal",
    body: "Consigue experiencia práctica en el campo. Acompaña a un apicultor veterano a realizar revisiones. Observa la suavidad con la que saca los cuadros, el uso de humo moderado, cómo detecta la presencia de reinas y la velocidad de trabajo. El tacto apícola se aprende por imitación.",
    objectiveDesc: "¿He acumulado horas de práctica observando e imitando a apicultores experimentados?",
    tasks: [
      "Identificar a un apicultor mentor dispuesto a llevarte de ayudante en sus apiarios.",
      "Realizar al menos dos visitas completas de inspección de colmenas.",
      "Documentar aprendizajes prácticos de manejo de abejas."
    ],
    whyItMatters: "Evita errores típicos de novato, como matar a la reina al aplastarla accidentalmente con los marcos o sobrealimentar con humo.",
    registroFields: [
      {
        id: "reg-apic-mentor-nombre",
        label: "Nombre del Apicultor Mentor",
        type: "text",
        required: true,
        helpText: "Persona experta que te guió en tus prácticas.",
        placeholder: "Don Carlos González"
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-inspeccion",
    title: "Inspección Rutinaria del Nido de Cría",
    description: "Inspeccionar periódicamente las cámaras de cría para evaluar la salud de la reina y postura.",
    icon: "search",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Aprende a inspeccionar una colmena de forma rutinaria. Retira la tapa, ahúma suavemente, saca los cuadros centrales y verifica: - Postura de huevos frescos en forma de 'pequeños bastones' (indica reina activa de menos de 3 días). - Cría operculada compacta (cría de color uniforme sin celdas vacías intercaladas). - Presencia de reservas de polen alrededor de la cría.",
    objectiveDesc: "¿Puedo evaluar rápidamente la calidad de postura de la reina y la salud del nido de cría?",
    tasks: [
      "Efectuar la inspección de al menos 5 colmenas activas.",
      "Detectar huevos frescos (de menos de 3 días) para confirmar presencia de reina sin verla físicamente.",
      "Clasificar el patrón de cría (compacto o en salpicaduras)."
    ],
    whyItMatters: "Una colmena sin reina (huérfana) o con reina deficiente se convertirá en colmena zanganera y morirá en pocas semanas si no se corrige a tiempo.",
    registroFields: [
      {
        id: "reg-apic-inspeccion-fecha",
        label: "Fecha de la Última Inspección General",
        type: "date",
        required: true,
        helpText: "Registrar fecha de la última inspección.",
        placeholder: "2024-05-15"
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-enfermedades",
    title: "Identificación de Enfermedades de la Cría",
    description: "Aprender a diagnosticar visualmente Loque Americana, Loque Europea y Cría de Yeso.",
    icon: "alert-triangle",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "hard",
    priority: "high",
    body: "Debes conocer las principales patologías bacterianas y fúngicas de la cría: - Loque Americana (bacteriana): Olor a podrido, opérculos hundidos y perforados, la cría forma una hebra viscosa al meter un palillo. - Loque Europea: Larvas muertas retorcidas de color amarillento. - Cría de Yeso (fúngica): Larvas momificadas duras de color blanco o negro en la piquera. Estas enfermedades son muy contagiosas.",
    objectiveDesc: "¿Soy capaz de reconocer los signos de Loque y otras plagas graves en los cuadros de cría?",
    tasks: [
      "Estudiar imágenes y videos de diagnóstico de Loque y Cría de Yeso.",
      "Aprender el protocolo de desinfección de herramientas con fuego al inspeccionar colmenas sospechosas.",
      "Establecer contacto con el inspector sanitario de tu zona en caso de brotes."
    ],
    whyItMatters: "La Loque Americana requiere quemar y enterrar la colmena infectada por ley. No detectarla a tiempo infectará todo tu apiario.",
    registroFields: [
      {
        id: "reg-apic-obs-patologias",
        label: "Estado de Patologías en Apiario",
        type: "textarea",
        required: true,
        helpText: "Anota si has visto celdas sospechosas de Loque o presencia de cría de yeso.",
        placeholder: "Apiario libre de Loque. Se observó un cuadro con cría de yeso leve que ya se ventiló..."
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-monitoreo-varroa",
    title: "Monitoreo Mensual de la Carga de Varroa",
    description: "Realizar la prueba del frasco con alcohol o azúcar glass para calcular el porcentaje de infestación de Varroa destructor.",
    icon: "search",
    type: "monthly",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "high",
    body: "Varroa es el parásito que transmite virus letales. Realiza mensualmente el test de infestación: recolecta unas 300 abejas (media taza) en un frasco con alcohol o azúcar glass, agita suavemente para desprender los ácaros, filtra y cuenta los ácaros. Si el porcentaje de infestación supera el 3% (3 ácaros por cada 100 abejas), debes tratar de inmediato.",
    objectiveDesc: "¿Cuál es el porcentaje de infestación de Varroa en mis colmenas este mes?",
    tasks: [
      "Tomar una muestra de abejas de la cámara de cría (asegurándose de no incluir a la reina).",
      "Realizar la prueba de lavado con alcohol o azúcar glass.",
      "Calcular el porcentaje de infestación (ácaros contados / 3 = % de infestación)."
    ],
    whyItMatters: "Varroa debilita el sistema inmune de la abeja. Un apiario con más del 5% de Varroa en otoño colapsará en invierno.",
    registroFields: [
      {
        id: "reg-apic-varroa-tasa",
        label: "Porcentaje de Infestación de Varroa (%)",
        type: "number",
        required: true,
        helpText: "Porcentaje calculado en la última prueba mensual.",
        placeholder: "2"
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-tratamiento-varroa",
    title: "Tratamiento y Dosificación Orgánica contra Varroa",
    description: "Aplicar tratamientos de sanidad contra Varroa (ácido oxálico, fórmico o timol) según la dosis recomendada.",
    icon: "droplet",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "hard",
    priority: "high",
    body: "Aplica tratamientos orgánicos que no dejen residuos químicos en la miel ni cera. Usa: - Ácido Oxálico (goteado o sublimado) en época de escasez de cría. - Ácido Fórmico (tiras evaporadoras) eficaz para matar Varroa dentro de las celdas operculadas. Sigue estrictamente las dosis y usa máscaras con filtro de gases para tu propia protección.",
    objectiveDesc: "¿Qué tratamiento sanitante apliqué a mis colmenas y en qué dosis exacta?",
    tasks: [
      "Elegir el tratamiento orgánico según la temperatura ambiente de la zona (el ácido fórmico requiere menos de 30°C).",
      "Aplicar el tratamiento en la dosis recomendada por el fabricante.",
      "Verificar la caída de Varroa en el piso de la colmena posterior al tratamiento."
    ],
    whyItMatters: "Varroa descontrolado aniquila apiarios completos. Los tratamientos deben aplicarse a la vez en todas las colmenas para evitar reinfestaciones.",
    registroFields: [
      {
        id: "reg-apic-tratamiento-tipo",
        label: "Tratamiento Sanitante Aplicado contra Varroa",
        type: "text",
        required: true,
        helpText: "Nombre y activo del producto (ej. Ácido Oxálico goteado).",
        placeholder: "Ácido Oxálico sublimado"
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-jarabe-estimulacion",
    title: "Alimentación Estimulante de Primavera (1:1)",
    description: "Preparar y suministrar jarabe de azúcar y agua (proporción 1:1) para inducir la postura de la reina.",
    icon: "activity",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Prepara jarabe estimulante mezclando partes iguales de azúcar blanca refinada y agua potable caliente (1 kg de azúcar por 1 litro de agua). Suminístralo en alimentadores internos (tipo Doolittle) unas 6 semanas antes de la gran floración para simular entrada de néctar y estimular a la reina a poner miles de huevos diarios.",
    objectiveDesc: "¿He estimulado a mis colonias para aumentar su población de abejas antes de la gran floración?",
    tasks: [
      "Preparar jarabe de azúcar 1:1 higiénicamente.",
      "Llenar los alimentadores en horarios de la tarde para evitar el pillaje entre colmenas.",
      "Verificar el aumento en el área de postura en la siguiente inspección."
    ],
    whyItMatters: "Una colmena requiere 45 días de desarrollo para tener abejas recolectoras en edad de pecorear. Alimentar de forma anticipada garantiza una gran población de obreras al comenzar la floración.",
    registroFields: [
      {
        id: "reg-apic-estimulacion-litros",
        label: "Litros de Jarabe 1:1 Suministrados por Colmena",
        type: "number",
        required: true,
        helpText: "Litros de jarabe 1:1 promedio suministrados.",
        placeholder: "2"
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-jarabe-reserva",
    title: "Alimentación de Reserva de Otoño (2:1)",
    description: "Preparar y dosificar jarabe denso de azúcar (2:1) para formar las reservas de invierno.",
    icon: "box",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "high",
    body: "Prepara jarabe de reserva denso: mezcla 2 kg de azúcar por 1 litro de agua potable. Se dosifica al finalizar la última cosecha del año para reponer las reservas que las abejas consumirán durante el invierno frío o meses secos.",
    objectiveDesc: "¿Tienen mis colmenas reservas energéticas suficientes para sobrevivir a la época de escasez?",
    tasks: [
      "Preparar jarabe denso 2:1 disolviendo azúcar en agua caliente sin caramelizarla.",
      "Alimentar copiosamente las colmenas débiles en reservas antes de la llegada del frío.",
      "Comprobar el peso de la caja levantándola ligeramente por atrás."
    ],
    whyItMatters: "Si cosechas toda la miel y no provees jarabe denso de invierno, la colmena morirá de hambre por congelamiento y escasez.",
    registroFields: [
      {
        id: "reg-apic-reserva-azucar-total",
        label: "Azúcar Total Utilizado en Reserva (Kilos)",
        type: "number",
        required: true,
        helpText: "Cantidad total de azúcar comprado para reservas del apiario.",
        placeholder: "50"
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-torta-proteica",
    title: "Alimentación Proteica Suplementaria",
    description: "Elaborar y aplicar tortas de polen o sustitutos de proteína para incentivar la cría de obreras.",
    icon: "activity",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "medium",
    priority: "normal",
    body: "Las abejas necesitan proteína (polen) para producir jalea real y alimentar a las larvas. En épocas de sequía donde la flora no genera polen, prepara tortas proteicas (usando levadura de cerveza, harina de soya desgrasada, azúcar y miel) y colócalas directamente sobre los cabezales del nido de cría.",
    objectiveDesc: "¿La nutrición proteica de mis abejas está asegurada en ausencia de polen natural?",
    tasks: [
      "Mezclar los ingredientes secos de proteína con miel o jarabe espeso para dar consistencia de pasta.",
      "Formar tortas individuales envueltas en papel parafinado.",
      "Colocar la torta directamente sobre los marcos de la cámara de cría."
    ],
    whyItMatters: "La falta de polen frena en seco la cría de abejas jóvenes y provoca el envejecimiento y debilitamiento acelerado de la colmena.",
    registroFields: [
      {
        id: "reg-apic-tortas-cant",
        label: "Cantidad de Tortas Proteicas Suministradas",
        type: "number",
        required: true,
        helpText: "Número de tortas colocadas en el apiario.",
        placeholder: "15"
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-enjambrazon",
    title: "Manejo y Control de la Enjambrazón",
    description: "Dividir colmenas populosas, cambiar reinas viejas y colocar alzas para prevenir la pérdida de abejas.",
    icon: "activity",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "hard",
    priority: "high",
    body: "La enjambrazón es la reproducción natural de las colonias. Si una colmena está muy congestionada, la mitad de la población huirá con la reina vieja. Previene esto: - Añadiendo alzas de miel a tiempo para dar espacio. - Eliminando celdillas reales de enjambrazón en tus revisiones. - Dividiendo la colmena fuerte para crear un nuevo núcleo.",
    objectiveDesc: "¿He evitado la fuga de mis abejas más productivas mediante el control de la enjambrazón?",
    tasks: [
      "Revisar marcos de cría buscando copas y celdillas reales de enjambrazón en primavera.",
      "Añadir alzas con cera estampada para dar espacio al apiario.",
      "Efectuar divisiones de colmenas muy pobladas para crear núcleos de respaldo."
    ],
    whyItMatters: "Una colmena que se enjambra pierde la mitad de sus obreras, reduciendo a cero su producción de miel para esa temporada.",
    registroFields: [
      {
        id: "reg-apic-nucleos-nuevos-creados",
        label: "Número de Nuevos Núcleos Creados por División",
        type: "number",
        required: true,
        helpText: "Cantidad de colmenas adicionales generadas de tus divisiones.",
        placeholder: "3"
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-fusion",
    title: "Fusión de Colmenas Débiles o Huérfanas",
    description: "Unir colonias mediante el método del periódico en otoño para garantizar su supervivencia invernal.",
    icon: "users",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "medium",
    priority: "normal",
    body: "Colmenas débiles o huérfanas al final del verano no sobrevivirán el invierno. Fusiónalas con una colmena fuerte usando el método del periódico: coloca una hoja de periódico agujereada entre las dos cajas (la débil arriba y la fuerte abajo). Las abejas roerán el periódico lentamente y se unirán de forma pacífica al mezclar sus olores sin peleas.",
    objectiveDesc: "¿He unido mis colmenas débiles para asegurar colonias densas y resistentes para el invierno?",
    tasks: [
      "Identificar colmenas que tengan menos de 4 cuadros ocupados por abejas en otoño.",
      "Eliminar a la reina de peor calidad de las dos a fusionar.",
      "Aplicar el método del periódico para la unión de colmenas."
    ],
    whyItMatters: "Dos colmenas débiles mueren separadas en invierno por incapacidad de calentar el nido; fusionadas sobreviven con facilidad.",
    registroFields: [
      {
        id: "reg-apic-colmenas-fusionadas",
        label: "Cantidad de Fusiones de Colmena Realizadas",
        type: "number",
        required: true,
        helpText: "Cuántas uniones se efectuaron antes de la época fría.",
        placeholder: "2"
      }
    ]
  }),
  makeStep({
    id: "step-ope-tra-cosecha",
    title: "Cosecha Higiénica de Alzas Melíferas",
    description: "Efectuar el retiro de los panales llenos de miel operculada usando escape-abejas o cepillado suave.",
    icon: "leaf",
    type: "one_time",
    estimatedHours: 5,
    difficulty: "medium",
    priority: "high",
    body: "Realiza la cosecha en un día soleado. Retira solo los cuadros de alzas melíferas que tengan al menos el 80% de su área operculada (sellada con cera por las abejas, lo que garantiza que la humedad está por debajo del 18% y no fermentará). Retira las abejas con escape-abejas colocado 24 horas antes o cepillándolas con cuidado, y guarda los cuadros en cajas cerradas para evitar el pillaje.",
    objectiveDesc: "¿La miel cosechada tiene el nivel de humedad óptimo y se recolectó sin alterar a las abejas?",
    tasks: [
      "Confirmar que los cuadros a cosechar estén operculados (sellados).",
      "Retirar abejas usando escape-abejas o cepillo apícola.",
      "Transportar las alzas melíferas inmediatamente a la sala de extracción protegida contra insectos."
    ],
    whyItMatters: "Cosechar miel sin opercular (verde) causará que fermente en el frasco debido a su alta humedad.",
    registroFields: [
      {
        id: "reg-apic-kilos-cosechados",
        label: "Total de Kilos de Miel Bruta Cosechada",
        type: "number",
        required: true,
        helpText: "Cantidad total de miel recolectada en esta cosecha.",
        placeholder: "240"
      }
    ]
  }),
  makeStep({
    id: "step-ope-reg-desoperculacion",
    title: "Desoperculación de Cuadros de Miel",
    description: "Retirar la capa de cera (opérculo) que sella las celdas de miel en la sala de extracción.",
    icon: "scissors",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Lleva los cuadros a la mesa desoperculadora. Con un cuchillo eléctrico desoperculador caliente o un tenedor de desopercular, corta la capa delgada de cera (opérculo) que sella las celdas, deslizando el cuchillo al ras del marco de madera. Deposita la cera cortada en la mesa para recuperar la miel de escurrimiento.",
    objectiveDesc: "¿He expuesto la miel de las celdillas para que pueda ser centrifugada de forma eficiente?",
    tasks: [
      "Asegurar que los cuchillos de desoperculación estén a la temperatura óptima.",
      "Retirar el opérculo de ambas caras del panal de miel.",
      "Colocar los panales desoperculados en el extractor centrífugo."
    ],
    whyItMatters: "Retirar el opérculo de manera limpia sin romper la estructura de madera del cuadro te permite devolver el panal intacto a la colmena después de la extracción.",
    registroFields: [
      {
        id: "reg-apic-cuadros-desoperculados",
        label: "Número Total de Cuadros Desoperculados",
        type: "number",
        required: true,
        helpText: "Cantidad de marcos procesados en la mesa de desoperculación.",
        placeholder: "80"
      }
    ]
  }),
  makeStep({
    id: "step-ope-reg-extraccion",
    title: "Extracción Centrífuga de Miel",
    description: "Centrifugar los cuadros desoperculados para extraer la miel líquida sin dañar los panales.",
    icon: "refresh-cw",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Carga el extractor radial o tangencial. Centrifuga a velocidad baja inicialmente, voltea los cuadros si es tangencial, y luego aumenta la velocidad de giro paulatinamente. Esto evita que el peso de la miel rompa el panal de cera contra las paredes del extractor.",
    objectiveDesc: "¿La extracción se realizó sin romper los marcos de cera reutilizables?",
    tasks: [
      "Cargar el extractor centrífugo de forma equilibrada en peso.",
      "Iniciar el centrifugado lento y acelerar progresivamente.",
      "Abrir el grifo de guillotina para vaciar la miel bruta a través de un colador de malla doble."
    ],
    whyItMatters: "Si rompes los panales al centrifugar demasiado rápido, las abejas tardarán semanas en reconstruirlos, perdiendo la siguiente floración.",
    registroFields: [
      {
        id: "reg-apic-miel-centrifugada-litros",
        label: "Volumen de Miel Extraído (Litros)",
        type: "number",
        required: true,
        helpText: "Cantidad de miel líquida total centrifugada.",
        placeholder: "180"
      }
    ]
  }),
  makeStep({
    id: "step-ope-reg-decantacion",
    title: "Decantación y Maduración de la Miel",
    description: "Dejar reposar la miel en tanques decantadores durante 10-15 días para purificarla físicamente.",
    icon: "clock",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "high",
    body: "Vierte la miel filtrada en los tanques decantadores. Déjala reposar a una temperatura templada durante 10 a 15 días. Durante este tiempo, la gravedad hará que las burbujas de aire, partículas de cera y restos microscópicos suban a la superficie formando una espuma que podrás retirar con una espátula limpia antes de envasar.",
    objectiveDesc: "¿Ha reposado la miel lo suficiente para asegurar un producto final limpio y sin impurezas de cera?",
    tasks: [
      "Llenar los tanques decantadores de grado alimentario.",
      "Sellar herméticamente las tapas para evitar la absorción de humedad del aire (higroscopía).",
      "Retirar la espuma de impurezas de la superficie tras 12 días."
    ],
    whyItMatters: "La decantación natural evita tener que calentar o filtrar a presión la miel, conservando intactos su sabor, polen y propiedades biológicas.",
    registroFields: [
      {
        id: "reg-apic-decantacion-dias",
        label: "Días Totales de Reposo en Tanque Decantador",
        type: "number",
        required: true,
        helpText: "Cantidad de días que reposó la miel antes de embotellar.",
        placeholder: "14"
      }
    ]
  }),
  makeStep({
    id: "step-ope-reg-envasado",
    title: "Envasado y Etiquetado Higiénico",
    description: "Dosificar la miel madura en los frascos finales de vidrio e instalar las etiquetas aprobadas.",
    icon: "check-circle",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "easy",
    priority: "high",
    body: "Limpia y desinfecta tus frascos de vidrio. Utiliza la válvula de guillotina del decantador para llenar con precisión los frascos según el peso neto declarado. Limpia los bordes de goteos de miel, sella herméticamente con la tapa metálica y pega de forma centrada la etiqueta comercial que contiene el lote y datos de origen.",
    objectiveDesc: "¿Están los frascos de miel correctamente envasados, sellados y etiquetados para la venta?",
    tasks: [
      "Desinfectar frascos de vidrio y tapas.",
      "Envasar controlando el peso con una balanza digital.",
      "Pegar la etiqueta oficial y el sello de seguridad en las tapas."
    ],
    whyItMatters: "Un envasado descuidado con fugas o etiquetas torcidas devalúa la percepción del producto y reduce el interés de las tiendas boutique.",
    registroFields: [
      {
        id: "reg-apic-unidades-envasadas",
        label: "Frascos Envasados Totales de 500g",
        type: "number",
        required: true,
        helpText: "Número de unidades de 500g listas para inventario de venta.",
        placeholder: "360"
      }
    ]
  }),
  makeStep({
    id: "step-ope-mantenimiento-semanal",
    title: "Mantenimiento Semanal de Apiarios e Inspección Externa",
    description: "Inspección semanal perimetral, limpieza de malezas y verificación de piqueras.",
    icon: "shield",
    type: "weekly",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Visita semanalmente tus apiarios. Realiza una inspección visual desde el exterior de las colmenas sin abrirlas: - Corta la maleza alrededor de las bases para evitar hormigas y permitir flujo de aire. - Observa el movimiento en las piqueras: ¿Hay entrada de polen en las patas de las abejas (indica cría activa)? ¿Hay abejas muertas en exceso? ¿Hay signos de pillaje?",
    objectiveDesc: "¿Están las piqueras de las colmenas despejadas y elapiario libre de malezas u obstáculos?",
    tasks: [
      "Limpiar la maleza y pasto del perímetro de las colmenas.",
      "Verificar que no haya hormigueros subiendo por las bases del apiario.",
      "Monitorear la actividad de vuelo externo en las piqueras."
    ],
    whyItMatters: "Permite detectar a tiempo problemas urgentes como ataques de hormigas o pillaje destructivo sin perturbar el interior de la colmena.",
    registroFields: [
      {
        id: "reg-apic-maint-semanal-obs",
        label: "Notas de la Inspección Externa de la Semana",
        type: "textarea",
        required: true,
        helpText: "Anota si viste comportamiento inusual (ej. defensividad alta, abejas lentas).",
        placeholder: "Vuelo normal en piqueras. Entrada abundante de polen amarillo. Se cortó maleza en Apiario 1..."
      }
    ]
  }),
  makeStep({
    id: "step-ope-inventario-insumos",
    title: "Inventario Mensual de Tratamientos y Panales",
    description: "Llevar inventario físico mensual de medicamentos, cera estampada, cajas y frascos.",
    icon: "archive",
    type: "monthly",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Realiza un recuento físico mensual en tu bodega: - Cuenta la cera estampada disponible. - Revisa el stock de tratamientos autorizados para Varroa y su fecha de expiración. - Cuenta los frascos y tapas de vidrio para envasar. - Registra los requerimientos de compra para el siguiente mes.",
    objectiveDesc: "¿Dispongo de los tratamientos y envases necesarios para cubrir las contingencias del próximo mes?",
    tasks: [
      "Contar los tratamientos de Varroa en bodega.",
      "Registrar cantidad de frascos y tapas disponibles.",
      "Anotar en la lista de compras los insumos faltantes."
    ],
    whyItMatters: "Quedarse sin frascos a mitad de cosecha o no tener tratamientos en el momento de alta Varroa impactará severamente al apiario.",
    registroFields: [
      {
        id: "reg-apic-inv-frascos-stock",
        label: "Cantidad de Frascos de Vidrio Vacíos en Stock",
        type: "number",
        required: true,
        helpText: "Inventario físico de frascos listos para usar.",
        placeholder: "120"
      }
    ]
  })
];

const customersSteps = [
  makeStep({
    id: "step-cli-bra-logo",
    title: "Diseño del Logotipo y Manual de Marca",
    description: "Crear una marca visual que transmita pureza, origen artesanal y respeto al apiario.",
    icon: "palette",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Crea o encarga un logotipo memorable. El diseño debe comunicar el origen puro y artesanal de tu miel. Evita diseños toscos; busca líneas limpias que representen abejas, celdillas de cera o el entorno floral de tu apiario.",
    objectiveDesc: "¿Tengo un logotipo comercial definitivo aprobado que represente la identidad de mi apiario?",
    tasks: [
      "Definir el concepto y nombre de la marca de miel.",
      "Diseñar el logotipo de la marca (o contratar a un diseñador).",
      "Exportar el logo en formatos transparentes de alta resolución (PNG, SVG)."
    ],
    whyItMatters: "Una marca bien empaquetada justifica que cobres un valor premium y facilita el posicionamiento en tiendas gourmet.",
    registroFields: [
      {
        id: "reg-apic-brand-logo-url",
        label: "Enlace a Carpeta con Logotipos de Marca",
        type: "url",
        required: true,
        helpText: "Enlace a Google Drive con los archivos finales del logo.",
        placeholder: "https://drive.google.com/..."
      }
    ]
  }),
  makeStep({
    id: "step-cli-bra-colores",
    title: "Definición de Paleta de Colores y Tipografías",
    description: "Seleccionar colores corporativos y tipografías consistentes para las etiquetas y empaques.",
    icon: "palette",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Define tus colores oficiales. Selecciona 2 o 3 colores complementarios (ej. amarillo cálido, marrón terroso, verde bosque) y documenta sus códigos Pantone o hexadecimales. Elige 2 tipografías consistentes para usar en etiquetas, web y folletos.",
    objectiveDesc: "¿Cuáles son los códigos de color y fuentes oficiales que mantendrán la consistencia de mi marca?",
    tasks: [
      "Seleccionar la paleta de colores de marca y documentar sus códigos HEX/Pantone.",
      "Elegir una tipografía para títulos y otra para textos de lectura.",
      "Registrar los códigos de color."
    ],
    whyItMatters: "La consistencia de color y fuente es lo que diferencia visualmente a una marca profesional de un producto artesanal descuidado.",
    registroFields: [
      {
        id: "reg-apic-colores-hex",
        label: "Códigos Hexadecimales de Colores de Marca",
        type: "text",
        required: true,
        helpText: "Ej. #FFD700 (Dorado), #4A2711 (Marrón).",
        placeholder: "#FFD700, #4B3621"
      }
    ]
  }),
  makeStep({
    id: "step-cli-bra-vehiculo",
    title: "Uniforme Apícola y Rotulación del Vehículo",
    description: "Diseñar poleras bordadas de la marca y rotular el vehículo de transporte apícola.",
    icon: "truck",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "easy",
    priority: "normal",
    body: "La imagen física vende. Diseña camisas tipo polo bordadas con el logo del apiario para usarlas en entregas y mercados. Rotula el vehículo de trabajo con tu marca y teléfono. Esto proyecta formalidad y atrae miradas de vecinos curiosos al descargar alzas de miel en la ciudad.",
    objectiveDesc: "¿Mi uniforme y vehículo comercial están debidamente identificados con la marca?",
    tasks: [
      "Mandar a bordar al menos 3 camisas tipo polo con el logotipo.",
      "Diseñar e instalar un vinilo magnético o adhesivo con el logo y contacto en el vehículo.",
      "Registrar fotos de la rotulación."
    ],
    whyItMatters: "Proyecta confianza inmediata al entrar a fincas privadas y al entregar a tiendas boutique locales.",
    registroFields: [
      {
        id: "reg-apic-rotulacion-url",
        label: "Enlace a Foto del Vehículo Rotulado",
        type: "url",
        required: false,
        helpText: "Sube una foto de tu auto rotulado.",
        placeholder: "https://drive.google.com/..."
      }
    ]
  }),
  makeStep({
    id: "step-cli-evi-fotos",
    title: "Sesión Fotográfica del Apiario y Cosecha",
    description: "Tomar fotografías de alta resolución trabajando en las colmenas y de la miel decantando.",
    icon: "image",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "easy",
    priority: "normal",
    body: "Toma fotos reales en el campo. Muestra imágenes detalladas de ti usando el overol, revisando cuadros llenos de abejas tranquilas, la miel escurriendo del extractor de acero y los apiarios rodeados de naturaleza floral. Estas fotos darán testimonio de la autenticidad y pureza de tu miel.",
    objectiveDesc: "¿Tengo fotografías de alta calidad que demuestren la realidad artesanal de mi producción?",
    tasks: [
      "Realizar una sesión de fotos durante una inspección en un día despejado.",
      "Tomar fotos del proceso de extracción centrífuga y desoperculación.",
      "Organizar las fotos en una carpeta para redes y sitio web."
    ],
    whyItMatters: "Las fotos de stock genéricas restan autenticidad. Los clientes quieren ver el apiario real donde se produjo su miel.",
    registroFields: [
      {
        id: "reg-apic-fotos-url",
        label: "Enlace a Carpeta de Fotos de Evidencia",
        type: "url",
        required: true,
        helpText: "Enlace a Drive con tus fotos de producción.",
        placeholder: "https://drive.google.com/..."
      }
    ]
  }),
  makeStep({
    id: "step-cli-evi-folleto",
    title: "Diseño de Folletos Educativos de Miel",
    description: "Diseñar e imprimir folletos sobre las diferencias entre la miel cruda y la miel industrial.",
    icon: "file-text",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "easy",
    priority: "normal",
    body: "Crea un folleto corto de media página. Explica de forma educativa: 1. Qué es la cristalización (demostrar que la cristalización es garantía de pureza, no que tenga azúcar añadida). 2. Por qué no pasteurizas tu miel. 3. Los subproductos del apiario (polen, propóleo). Entrega este folleto con cada compra.",
    objectiveDesc: "¿Cuento con materiales impresos que eduquen al cliente sobre las cualidades de mi producto?",
    tasks: [
      "Escribir los textos informativos (cristalización de la miel, propiedades).",
      "Diseñar el folleto con colores de la marca.",
      "Imprimir los folletos en papel amigable con el ambiente."
    ],
    whyItMatters: "Educar al cliente elimina el mito erróneo de que la miel cristalizada está dañada y justifica tu precio premium.",
    registroFields: [
      {
        id: "reg-apic-folleto-url",
        label: "Enlace al Diseño del Folleto Informativo (PDF)",
        type: "url",
        required: true,
        helpText: "Sube tu archivo de diseño final.",
        placeholder: "https://drive.google.com/..."
      }
    ]
  }),
  makeStep({
    id: "step-cli-evi-etiquetas",
    title: "Diseño de Etiquetas Legales y Nutricionales",
    description: "Diseñar las etiquetas para los frascos cumpliendo con la normativa obligatoria de etiquetado de alimentos.",
    icon: "bookmark",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Diseña las etiquetas de tus frascos. Asegúrate de cumplir con las normas de etiquetado de tu país: - Nombre claro: 'Miel 100% Pura de Abeja'. - Peso neto expresado en gramos. - Información de contacto y dirección del apicultor. - Código de lote y fecha de vencimiento. - Advertencia obligatoria: 'No consumir en menores de 1 año' (riesgo de botulismo infantil).",
    objectiveDesc: "¿La etiqueta de mi producto cumple con todos los requisitos legales para la venta comercial?",
    tasks: [
      "Consultar la ley de etiquetado de alimentos de tu país.",
      "Diseñar la etiqueta frontal (marca) y la etiqueta posterior (nutricional, advertencias, lote).",
      "Aprobar la impresión final en papel adhesivo resistente a salpicaduras."
    ],
    whyItMatters: "Sin una etiqueta que cumpla los requisitos legales de alimentos, las tiendas naturistas y cadenas no podrán comercializar tu miel.",
    registroFields: [
      {
        id: "reg-apic-etiqueta-url",
        label: "Enlace a Diseño Final de la Etiqueta (PDF/Imagen)",
        type: "url",
        required: true,
        helpText: "Sube y pega el enlace de tu etiqueta aprobada.",
        placeholder: "https://drive.google.com/..."
      }
    ]
  }),
  makeStep({
    id: "step-cli-evi-imanes",
    title: "Adquisición de Imanes de Nevera Promocionales",
    description: "Adquirir imanes promocionales con el logotipo y contacto del apiario para fidelización.",
    icon: "gift",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Adquiere imanes para nevera con el logotipo, número de WhatsApp e indicación de 'Miel Pura a Domicilio'. Deja un imán en cada entrega minorista. Los imanes se conservan por años en la cocina del hogar y facilitan la repetición del pedido.",
    objectiveDesc: "¿Tengo imanes promocionales listos para regalar a mis clientes minoristas?",
    tasks: [
      "Diseñar imán publicitario claro.",
      "Mandar a producir al menos 100 unidades en imprenta.",
      "Incluir imanes en el empaque de entregas a domicilio."
    ],
    whyItMatters: "Es uno de los métodos más económicos y eficientes para recordar tu contacto de WhatsApp cuando al cliente se le acabe el frasco.",
    registroFields: [
      {
        id: "reg-apic-imanes-cant",
        label: "Cantidad de Imanes Promocionales Comprados",
        type: "number",
        required: true,
        helpText: "Cantidad total producida.",
        placeholder: "100"
      }
    ]
  }),
  makeStep({
    id: "step-cli-web-dominio",
    title: "Compra del Dominio Web del Apiario",
    description: "Registrar un dominio de internet (.com) fácil de recordar y escribir para la marca.",
    icon: "globe",
    type: "one_time",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Registra el dominio web de tu marca (ej. www.mielcolmena.com). Intenta que termine en '.com' y que sea lo más corto posible para facilitar que el cliente lo escriba o recuerde.",
    objectiveDesc: "¿Tengo registrado el dominio de internet oficial para la marca de miel?",
    tasks: [
      "Buscar disponibilidad de nombres de dominio en GoDaddy o Namecheap.",
      "Adquirir y registrar el dominio oficial.",
      "Configurar la renovación automática del dominio."
    ],
    whyItMatters: "Asegura tu nombre de marca en la web antes de que un tercero lo registre y bloquee tu identidad digital.",
    registroFields: [
      {
        id: "reg-apic-url-dominio",
        label: "Nombre del Dominio Web Registrado",
        type: "text",
        required: true,
        helpText: "Escribe la dirección web oficial (ej. www.mielpura.com).",
        placeholder: "www.mielpura.com"
      }
    ]
  }),
  makeStep({
    id: "step-cli-web-sitio",
    title: "Diseño y Publicación del Sitio Web",
    description: "Crear un sitio web que presente la historia, productos, apiarios y formas de compra.",
    icon: "globe",
    type: "one_time",
    estimatedHours: 5,
    difficulty: "medium",
    priority: "normal",
    body: "Diseña tu sitio web. No necesita ser complejo; basta con una página de inicio estructurada (Landing Page) que cuente la historia del apiario, publique tus fotos reales en el apiario, liste tus productos de miel y derivados con sus precios, y contenga un botón directo de compra por WhatsApp.",
    objectiveDesc: "¿El sitio web de mi apiario está activo, publicado y listo para recibir visitas?",
    tasks: [
      "Diseñar la estructura de la web (Inicio, Historia, Miel, Contacto).",
      "Vincular un botón de chat directo a tu WhatsApp Business.",
      "Publicar la página web enlazando tu dominio comprado."
    ],
    whyItMatters: "Actúa como tu vitrina comercial 24/7 donde los clientes corporativos o tiendas pueden verificar tu formalidad.",
    registroFields: [
      {
        id: "reg-apic-sitio-web-url",
        label: "URL del Sitio Web Publicado",
        type: "url",
        required: true,
        helpText: "Pega la dirección web completa.",
        placeholder: "https://www.mielcolmena.com"
      }
    ]
  }),
  makeStep({
    id: "step-cli-web-seo",
    title: "Optimización SEO Local",
    description: "Configurar palabras clave locales en la web para aparecer en búsquedas orgánicas de miel pura en tu ciudad.",
    icon: "search",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "normal",
    body: "Optimiza tu web para Google. Añade frases clave locales en los títulos y descripciones de tu web, tales como: 'Comprar miel pura de abejas en [Ciudad]', 'Miel artesanal orgánica en [Zona]'. Esto te permitirá capturar búsquedas de compradores locales interesados de forma orgánica y gratuita.",
    objectiveDesc: "¿Mi página web está optimizada para que Google me encuentre cuando busquen miel local?",
    tasks: [
      "Definir las 5 palabras clave de búsqueda local de tu producto.",
      "Colocar estas palabras clave en los títulos (etiquetas H1) y metadescripciones de tu web.",
      "Indexar la web en Google Search Console."
    ],
    whyItMatters: "Te permite obtener llamadas y pedidos constantes de nuevos clientes sin tener que pagar publicidad diaria.",
    registroFields: [
      {
        id: "reg-apic-seo-keywords",
        label: "Palabras Clave SEO Locales Elegidas",
        type: "text",
        required: true,
        helpText: "Ej. miel pura medellin, miel artesanal colombia.",
        placeholder: "miel pura [ciudad], apicultura [region]"
      }
    ]
  }),
  makeStep({
    id: "step-cli-web-google-business",
    title: "Creación del Perfil de Google Business y Yelp",
    description: "Configurar la ficha de negocio georreferenciada en Google Maps para búsquedas de proximidad.",
    icon: "map-pin",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "easy",
    priority: "high",
    body: "Es obligatorio aparecer en Google Maps. Crea una ficha gratuita de Google Business (Google My Business) con el nombre de tu marca, dirección o zona de cobertura, teléfono, fotos del apiario envasando y enlace a tu web. Esto te listará inmediatamente cuando alguien busque 'Miel cerca de mí' desde su teléfono.",
    objectiveDesc: "¿El apiario está georreferenciado en Google Maps para capturar búsquedas de cercanía?",
    tasks: [
      "Crear y verificar la ficha de Google Business.",
      "Añadir fotos reales del apiario, horarios de atención y contacto de WhatsApp.",
      "Solicitar la verificación por videollamada o correo postal de Google."
    ],
    whyItMatters: "Es la fuente de tráfico y llamadas locales gratuitas más potente para pequeños productores agrícolas.",
    registroFields: [
      {
        id: "reg-apic-google-maps-url",
        label: "Enlace a tu Ficha de Google Maps",
        type: "url",
        required: true,
        helpText: "Pega el enlace directo a tu perfil comercial de Google.",
        placeholder: "https://maps.app.goo.gl/..."
      }
    ]
  }),
  makeStep({
    id: "step-cli-adq-alianzas",
    title: "Alianzas de Distribución y Tiendas Locales",
    description: "Identificar y contactar tiendas naturistas, mercados orgánicos y fruterías boutique para colocar tu miel.",
    icon: "users",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "medium",
    priority: "high",
    body: "Lanza tu canal mayorista. Haz una lista de al menos 10 tiendas naturistas, herbolarios, panaderías gourmet o mercados de agricultores en tu zona. Visítalos llevando un frasco de muestra, el folleto educativo y el tarifario de precios por caja de 12 unidades.",
    objectiveDesc: "¿Qué comercios locales se convertirán en puntos de venta permanentes de mi miel?",
    tasks: [
      "Visitar 10 tiendas objetivo y presentar el producto con una muestra gratuita.",
      "Establecer acuerdos de consignación o compra directa con al menos 3 tiendas.",
      "Registrar los comercios aliados."
    ],
    whyItMatters: "Colocar stock en tiendas naturistas genera ingresos recurrentes sin demandar tu tiempo diario en entregas minoristas.",
    registroFields: [
      {
        id: "reg-apic-tiendas-aliadas",
        label: "Lista de Tiendas y Distribuidores Aliados",
        type: "textarea",
        required: true,
        helpText: "Nombre y contacto de los comercios que ya tienen tu miel.",
        placeholder: "Tienda Natural Verde Vida - Tel: 555-99238\nFrutería Gourmet El Huerto..."
      }
    ]
  }),
  makeStep({
    id: "step-cli-adq-mercados",
    title: "Participación en Ferias y Mercados de Agricultores",
    description: "Programar la participación en ferias artesanales locales para venta directa y prospección.",
    icon: "store",
    type: "one_time",
    estimatedHours: 4,
    difficulty: "easy",
    priority: "normal",
    body: "Participa de forma periódica en mercados campesinos o ferias artesanales de fin de semana. Monta un stand atractivo: coloca un mantel de tela rústica, ten frascos de muestra con palillos para degustación, y exhibe un cuadro vacío de colmena o cera para llamar la atención del público. Reparte tarjetas y recolecta contactos.",
    objectiveDesc: "¿Tengo programada mi participación en ferias locales para captar clientes directos?",
    tasks: [
      "Inscribirse en el registro de mercados campesinos de la alcaldía o municipio.",
      "Comprar el stand portátil (mesa, mantel, carteles de marca).",
      "Llevar frascos de degustación para dar a probar la miel en la feria."
    ],
    whyItMatters: "Es el canal ideal para dar a conocer tu marca rápidamente, probar la aceptación del precio de forma directa y captar clientes que luego te pedirán a domicilio por WhatsApp.",
    registroFields: [
      {
        id: "reg-apic-feria-nombre",
        label: "Nombre de la Feria/Mercado del Mes",
        type: "text",
        required: true,
        helpText: "Escribe dónde participarás.",
        placeholder: "Mercado Campesino de la Plaza Central"
      }
    ]
  }),
  makeStep({
    id: "step-cli-adq-rastreo",
    title: "Rastreo de Fuentes de Clientes y Números Únicos",
    description: "Implementar un sistema de control de procedencia de clientes para saber cómo se enteraron del apiario.",
    icon: "phone",
    type: "one_time",
    estimatedHours: 3,
    difficulty: "easy",
    priority: "normal",
    body: "No gastes dinero a ciegas. Implementa la pregunta obligatoria a cada nuevo cliente de WhatsApp: '¿Cómo te enteraste de nosotros?'. Registra las respuestas en tu CRM o base de datos. Si usas anuncios digitales o volantes físicos, asóciales un código de descuento o enlace único para medir qué campaña fue rentable.",
    objectiveDesc: "¿Tengo un registro de procedencia que me indique qué campañas de marketing traen ventas reales?",
    tasks: [
      "Agregar la pregunta de origen al saludo de tu WhatsApp Business.",
      "Registrar el origen de cada cliente nuevo de la semana en tu base de datos."
    ],
    whyItMatters: "Permite saber con precisión matemática si debes invertir más dinero en volantes impresos o en SEO local, eliminando el gasto en publicidad inútil.",
    registroFields: [
      {
        id: "reg-apic-fuente-principal",
        label: "Canal de Captación Más Rentable Identificado",
        type: "text",
        required: true,
        helpText: "El canal de donde llegó la mayor cantidad de clientes este mes.",
        placeholder: "Recomendados / Google Maps / Feria"
      }
    ]
  }),
  makeStep({
    id: "step-cli-adq-programa-envases",
    title: "Programa de Devolución e Incentivo de Envases",
    description: "Establecer una política de descuento mensual a clientes que devuelvan sus frascos de vidrio limpios.",
    icon: "recycle",
    type: "monthly",
    estimatedHours: 2,
    difficulty: "easy",
    priority: "normal",
    body: "Implementa un programa de economía circular: ofrece un descuento atractivo (ej. 10% de descuento en el siguiente frasco o una pequeña retribución económica) a los clientes que devuelvan el frasco de vidrio limpio y en buen estado con su tapa. Esto reduce tus costos de empaque y genera lealtad.",
    objectiveDesc: "¿Cuántos envases de vidrio he recuperado y qué tasa de lealtad ha generado esta campaña este mes?",
    tasks: [
      "Comunicar la campaña de retorno en las etiquetas del producto y redes sociales.",
      "Recibir, desinfectar y clasificar los frascos devueltos por los clientes.",
      "Otorgar el descuento correspondiente en la compra del mes."
    ],
    whyItMatters: "Reduce costos variables directos de envasado en hasta un 30% y asocia tu marca apícola fuertemente con la sustentabilidad ambiental.",
    registroFields: [
      {
        id: "reg-apic-envases-recuperados",
        label: "Frascos de Vidrio Recuperados este Mes",
        type: "number",
        required: true,
        helpText: "Cantidad física de frascos que retornaron los clientes.",
        placeholder: "24"
      }
    ]
  })
];

// Combine all steps
const allSteps = [];
let orderCounter = 0;

strategySteps.forEach((s) => { s.order = orderCounter++; allSteps.push(s); });
businessSteps.forEach((s) => { s.order = orderCounter++; allSteps.push(s); });
operationsSteps.forEach((s) => { s.order = orderCounter++; allSteps.push(s); });
customersSteps.forEach((s) => { s.order = orderCounter++; allSteps.push(s); });

// Inject extra registration fields from extra-fields.js
const extraFields = require("./extra-fields");
allSteps.forEach((s) => {
  if (extraFields[s.id]) {
    if (!s.content.registroFields) {
      s.content.registroFields = [];
    }
    s.content.registroFields.push(...extraFields[s.id]);
  }
});

const blueprint = {
  id: "bp-apicultura-emprendimiento",
  slug: "apicultura-emprendimiento",
  name: "Emprendimiento de Apicultura",
  description: "Plan de construcción y operación completo para un negocio de apicultura enfocado en la producción sostenible de miel, polen, propóleo y derivados, garantizando la salud de las colmenas y la rentabilidad del agronegocio sin omitir ningún paso técnico o legal.",
  category: "Agro",
  industry: "Agronegocios",
  version: "3.0.0-linear",
  author: "Blueprint Gem",
  language: "es",
  difficulty: "intermediate",
  estimatedDuration: "12-18 semanas + operación continua",
  tags: ["apicultura", "miel", "agronegocios", "sostenibilidad", "polinización", "abejas"],
  coverImage: "",
  icon: "sprout",
  status: "published",
  blueprintType: "construction",
  settings: {
    allowComments: true,
    allowAssistant: true,
    allowKnowledge: true,
    allowExport: true,
    allowMarketplace: true
  },
  roadmap: [
    // --- ESTRATEGIA ---
    {
      id: "fase-str-finanzas",
      title: "Finanzas y Viabilidad",
      description: "Punto de equilibrio, estacionalidad, metas y KPIs del apiario.",
      objective: "Asegurar la viabilidad financiera del proyecto.",
      resources: [],
      block: "strategy",
      order: 0,
      steps: allSteps.filter((s) => ["step-str-fin-equilibrio", "step-str-fin-estacionalidad", "step-str-fin-kpis", "step-str-val-revision"].includes(s.id))
    },
    {
      id: "fase-str-mercado",
      title: "Identidad y Enfoque de Mercado",
      description: "Definición de misión, visión, valores éticos, cliente ideal, raza de abejas, flora y agua.",
      objective: "Definir quiénes somos y cuál es nuestro ecosistema apícola.",
      resources: [],
      block: "strategy",
      order: 1,
      steps: allSteps.filter((s) => ["step-str-id-mision", "step-str-id-vision", "step-str-id-valores", "step-str-id-cliente", "step-str-id-raza", "step-str-id-flora", "step-str-id-agua", "step-str-id-riesgos", "step-str-id-servicios"].includes(s.id))
    },
    {
      id: "fase-str-valores",
      title: "Propuesta de Valor y Tarifas",
      description: "Precios minoristas y mayoristas, envíos, garantías y radio de trashumancia.",
      objective: "Definir la oferta comercial y tarifas del apiario.",
      resources: [],
      block: "strategy",
      order: 2,
      steps: allSteps.filter((s) => ["step-str-val-precios-min", "step-str-val-precios-may", "step-str-val-envio", "step-str-val-garantias", "step-str-val-trashumancia-radio"].includes(s.id))
    },
    // --- OPERACIONES ---
    {
      id: "fase-ope-adquisiciones",
      title: "Adquisiciones y Suministros",
      description: "Compra de abejas núcleos, cajas Langstroth, herramientas de manejo, protección y extractores.",
      objective: "Adquirir el equipamiento biológico y mecánico necesario.",
      resources: [],
      block: "operations",
      order: 3,
      steps: allSteps.filter((s) => ["step-ope-adq-proveedor-nucleos", "step-ope-adq-cajas", "step-ope-adq-herramientas", "step-ope-adq-indumentaria", "step-ope-adq-maquinaria-extraccion"].includes(s.id))
    },
    {
      id: "fase-ope-logistica",
      title: "Organización y Logística en Campo",
      description: "Disposición espacial, control de cuadros vacíos y bebederos de agua seguros.",
      objective: "Organizar y adecuar físicamente el apiario de producción.",
      resources: [],
      block: "operations",
      order: 4,
      steps: allSteps.filter((s) => ["step-ope-org-disposicion", "step-ope-org-almacen-cera", "step-ope-org-bebederos"].includes(s.id))
    },
    {
      id: "fase-ope-seguridad",
      title: "Gestión de Riesgos y Seguridad",
      description: "Hojas MSDS, botiquín antialérgico, señalización perimetral e idoneidad de transporte.",
      objective: "Mitigar riesgos físicos y de salud del apiario.",
      resources: [],
      block: "operations",
      order: 5,
      steps: allSteps.filter((s) => ["step-ope-seg-msds", "step-ope-seg-alergias", "step-ope-seg-advertencia", "step-ope-seg-trashumancia-log"].includes(s.id))
    },
    {
      id: "fase-ope-sanidad",
      title: "Capacitación y Sanidad Apícola",
      description: "Cursos biológicos, inspección del nido, diagnóstico de enfermedades y testeo de Varroa.",
      objective: "Garantizar la salud del apiario mediante monitoreo constante de Varroasis y plagas.",
      resources: [],
      block: "operations",
      order: 6,
      steps: allSteps.filter((s) => ["step-ope-tra-biologia", "step-ope-tra-mentor", "step-ope-tra-inspeccion", "step-ope-tra-enfermedades", "step-ope-tra-monitoreo-varroa", "step-ope-tra-tratamiento-varroa"].includes(s.id))
    },
    {
      id: "fase-ope-nutricion",
      title: "Nutrición y Manejo de Colmenas",
      description: "Preparación de jarabes 1:1 de estimulación, 2:1 de reservas, tortas de proteína y enjambrazón.",
      objective: "Manejar la alimentación suplementaria y división de colonias.",
      resources: [],
      block: "operations",
      order: 7,
      steps: allSteps.filter((s) => ["step-ope-tra-jarabe-estimulacion", "step-ope-tra-jarabe-reserva", "step-ope-tra-torta-proteica", "step-ope-tra-enjambrazon", "step-ope-tra-fusion"].includes(s.id))
    },
    {
      id: "fase-ope-cosecha",
      title: "Cosecha, Procesamiento y Mantenimiento",
      description: "Extracción higiénica, desoperculación, extracción, decantación natural y envasado de miel.",
      objective: "Obtener miel pura de abejas y mantener la higiene y control de insumos.",
      resources: [],
      block: "operations",
      order: 8,
      steps: allSteps.filter((s) => ["step-ope-tra-cosecha", "step-ope-reg-desoperculacion", "step-ope-reg-extraccion", "step-ope-reg-decantacion", "step-ope-reg-envasado", "step-ope-mantenimiento-semanal", "step-ope-inventario-insumos"].includes(s.id))
    },
    // --- NEGOCIO ---
    {
      id: "fase-bus-legal",
      title: "Estructura Legal y Sanitaria",
      description: "Registro mercantil, pecuario, permisos sanitarios, contratos de tierras y seguros.",
      objective: "Constituir formalmente el apiario ante entidades gubernamentales y de salud.",
      resources: [],
      block: "business",
      order: 9,
      steps: allSteps.filter((s) => ["step-bus-leg-registro", "step-bus-leg-registro-pecuario", "step-bus-leg-permisos-sanitarios", "step-bus-leg-contrato-terreno", "step-bus-leg-seguro-responsabilidad", "step-bus-leg-seguro-colmenas"].includes(s.id))
    },
    {
      id: "fase-bus-infraestructura",
      title: "Infraestructura Financiera y Tecnológica",
      description: "Cuentas bancarias, tarjetas comerciales, pasarelas de pago, software de apiario y respaldos.",
      objective: "Configurar herramientas y sistemas contables y de control digital.",
      resources: [],
      block: "business",
      order: 10,
      steps: allSteps.filter((s) => ["step-bus-inf-cuenta-banco", "step-bus-inf-tarjeta", "step-bus-inf-pasarelas", "step-bus-inf-software-registro", "step-bus-inf-software-contable", "step-bus-inf-respaldos"].includes(s.id))
    },
    {
      id: "fase-bus-sistemas",
      title: "Sistemas y Rutinas Administrativas",
      description: "Guiones de atención, trazabilidad y conciliación financiera semanal.",
      objective: "Garantizar rutinas de oficina eficientes y trazabilidad de lotes de miel.",
      resources: [],
      block: "business",
      order: 11,
      steps: allSteps.filter((s) => ["step-bus-adm-guiones", "step-bus-adm-trazabilidad", "step-bus-adm-conciliacion"].includes(s.id))
    },
    // --- CLIENTES ---
    {
      id: "fase-cli-branding",
      title: "Branding y Empaquetado de Marca",
      description: "Logotipo, paleta de colores oficiales, vehículos y diseño de etiquetas.",
      objective: "Crear una marca atractiva y un empaque profesional.",
      resources: [],
      block: "customers",
      order: 12,
      steps: allSteps.filter((s) => ["step-cli-bra-logo", "step-cli-bra-colores", "step-cli-bra-vehiculo", "step-cli-evi-etiquetas"].includes(s.id))
    },
    {
      id: "fase-cli-evidencia",
      title: "Materiales y Evidencia de Venta",
      description: "Sesiones de fotos en apiario, folletos educativos e imanes de nevera.",
      objective: "Generar confianza y recordación del contacto del apiario.",
      resources: [],
      block: "customers",
      order: 13,
      steps: allSteps.filter((s) => ["step-cli-evi-fotos", "step-cli-evi-folleto", "step-cli-evi-imanes"].includes(s.id))
    },
    {
      id: "fase-cli-digital",
      title: "Presencia y Vitrina Digital",
      description: "Dominios web, landing pages, posicionamiento SEO local y fichas de Google Business.",
      objective: "Establecer los canales digitales para captación orgánica local.",
      resources: [],
      block: "customers",
      order: 14,
      steps: allSteps.filter((s) => ["step-cli-web-dominio", "step-cli-web-sitio", "step-cli-web-seo", "step-cli-web-google-business"].includes(s.id))
    },
    {
      id: "fase-cli-adquisicion",
      title: "Adquisición y Fidelización de Clientes",
      description: "Canales mayoristas de tiendas naturistas, mercados campesinos, rastreo y recompensa por envases.",
      objective: "Activar el motor comercial del apiario y la lealtad post-venta.",
      resources: [],
      block: "customers",
      order: 15,
      steps: allSteps.filter((s) => ["step-cli-adq-alianzas", "step-cli-adq-mercados", "step-cli-adq-rastreo", "step-cli-adq-programa-envases"].includes(s.id))
    }
  ]
};

fs.writeFileSync(jsonDestPath, JSON.stringify(blueprint, null, 2), "utf8");
console.log("Successfully compiled apicultura.json with exactly 75 detailed steps.");
console.log("Roadmap phases generated:", blueprint.roadmap.map(r => `${r.title} (${r.steps.length} steps)`).join(", "));
