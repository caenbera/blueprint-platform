module.exports = {
  // --- ESTRATEGIA ---
  "step-str-fin-equilibrio": [
    {
      id: "reg-apic-costo-vida-personal",
      label: "Costo de Vida Personal Mensual Mínimo",
      type: "number",
      required: true,
      helpText: "Tu retiro mensual esperado para cubrir gastos personales.",
      placeholder: "1500"
    },
    {
      id: "reg-apic-costo-variable-kilo",
      label: "Costo Variable Unitario por Kilo de Miel",
      type: "number",
      required: true,
      helpText: "Insumos consumidos por cada kilo cosechado.",
      placeholder: "4"
    },
    {
      id: "reg-apic-ingresos-punto-equilibrio",
      label: "Punto de Equilibrio en Ingresos Totales",
      type: "number",
      required: true,
      helpText: "Cifra de ventas totales necesarias.",
      placeholder: "18000"
    }
  ],
  "step-str-fin-estacionalidad": [
    {
      id: "reg-apic-costo-alimentacion-suplementaria",
      label: "Costo Estimado de Alimentación Suplementaria en Escasez",
      type: "number",
      required: true,
      helpText: "Presupuesto para azúcar y tortas proteicas en época seca o invernal.",
      placeholder: "1500"
    },
    {
      id: "reg-apic-flora-meses-abundantes",
      label: "Meses de Floración Abundante (Cosecha Principal)",
      type: "multiselect",
      required: true,
      helpText: "Selecciona los meses en que se produce la cosecha principal.",
      options: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
      placeholder: "Selecciona meses..."
    }
  ],
  "step-str-fin-kpis": [
    {
      id: "reg-apic-kpi-supervivencia",
      label: "Meta de Tasa de Supervivencia de Colmenas (%)",
      type: "number",
      required: true,
      helpText: "Porcentaje de colmenas activas que esperas mantengan su población en invierno.",
      placeholder: "85"
    },
    {
      id: "reg-apic-kpi-costo-prod-limite",
      label: "Costo de Producción Límite Aceptable por Kilo",
      type: "number",
      required: true,
      helpText: "El costo variable máximo que tolerará el negocio.",
      placeholder: "5"
    }
  ],
  "step-str-id-mision": [
    {
      id: "reg-apic-valores-centrales",
      label: "Valores Ecológicos y Comerciales Centrales",
      type: "textarea",
      required: true,
      helpText: "Principios de sustentabilidad e impacto social del apiario.",
      placeholder: "Respeto por la biodiversidad, precio justo al productor, no uso de agroquímicos."
    }
  ],
  "step-str-id-vision": [
    {
      id: "reg-apic-meta-max-colmenas",
      label: "Cantidad Máxima de Colmenas a Manejar",
      type: "number",
      required: true,
      helpText: "Tu capacidad límite física de manejo.",
      placeholder: "50"
    },
    {
      id: "reg-apic-requiere-ayudantes",
      label: "¿Requerirá Contratación de Ayudantes a Futuro?",
      type: "select",
      required: true,
      helpText: "Define tu modelo de crecimiento de personal.",
      options: ["Sí, ayudantes temporales en cosecha", "Sí, personal fijo en apiario", "No, manejo 100% familiar/individual"],
      placeholder: "Selecciona..."
    }
  ],
  "step-str-id-valores": [
    {
      id: "reg-apic-politica-tratamientos",
      label: "Política de Tratamientos Fitosanitarios",
      type: "select",
      required: true,
      helpText: "Tu enfoque para controlar Varroa y plagas de forma ética.",
      options: ["100% Orgánicos (ácido oxálico/fórmico/timol)", "Mixto (químicos autorizados en emergencias)", "Químicos convencionales"],
      placeholder: "Selecciona..."
    }
  ],
  "step-str-id-cliente": [
    {
      id: "reg-apic-motivaciones-compra",
      label: "Motivaciones de Compra de tus Clientes",
      type: "textarea",
      required: true,
      helpText: "¿Por qué prefieren tu miel? (ej. terapéutico, salud, origen local).",
      placeholder: "Buscan miel cruda y sin filtrar por sus propiedades antibacterianas y de control de alergias."
    },
    {
      id: "reg-apic-tamano-mercado",
      label: "Estimación del Tamaño del Mercado Local",
      type: "text",
      required: true,
      helpText: "Número estimado de familias u organizaciones compradoras en tu radio comercial.",
      placeholder: "Aprox. 1,200 familias consumidoras en el sector norte de la ciudad."
    }
  ],
  "step-str-id-raza": [
    {
      id: "reg-apic-raza-evaluacion",
      label: "Evaluación de Pros y Contras de Razas Locales",
      type: "textarea",
      required: true,
      helpText: "Justificación de por qué elegiste esta genética para tu apiario.",
      placeholder: "Se eligió Carniola por su alta docilidad y buen comportamiento frente al invierno frío de la zona."
    }
  ],
  "step-str-id-flora": [
    {
      id: "reg-apic-especies-meliferas",
      label: "Especies Melíferas Identificadas (Flora Principal)",
      type: "textarea",
      required: true,
      helpText: "Mapeo de plantas en un radio de 3 km.",
      placeholder: "Abundante floración de Eucalipto (Julio-Agosto), Acacia (Abril) y trébol silvestre en potreros."
    },
    {
      id: "reg-apic-mapa-floral-link",
      label: "Enlace al Mapa Floral o Documento del Apiario",
      type: "url",
      required: false,
      helpText: "Enlace de Drive con el plano o fotos aéreas florales.",
      placeholder: "https://drive.google.com/..."
    }
  ],
  "step-str-id-agua": [
    {
      id: "reg-apic-bebedero-diseno",
      label: "Descripción del Sistema de Flotación Seguro",
      type: "textarea",
      required: true,
      helpText: "Describe cómo evitarás que las abejas se ahoguen al beber agua.",
      placeholder: "Tanque plástico de 100L cortado a la mitad, lleno de corchos de vino flotantes y ramas secas."
    }
  ],
  "step-str-id-riesgos": [
    {
      id: "reg-apic-plan-contingencia-pesticidas",
      label: "Plan de Contingencia ante Fumigaciones",
      type: "textarea",
      required: true,
      helpText: "Acciones a tomar cuando un vecino anuncie aplicaciones de venenos.",
      placeholder: "Colocar mallas de transporte en piqueras a las 5:00 am del día de fumigación y mojar la colmena por fuera."
    }
  ],
  "step-str-id-servicios": [
    {
      id: "reg-apic-servicios-justificacion",
      label: "Justificación del Portafolio y Catálogo Core",
      type: "textarea",
      required: true,
      helpText: "Por qué elegiste vender estos productos e ignorar otros en esta fase.",
      placeholder: "Se inicia con miel y propóleo por facilidad de envasado; polen requiere secador y mercado maduro."
    }
  ],
  "step-str-val-precios-min": [
    {
      id: "reg-apic-costo-envasado-500g",
      label: "Costo de Producción y Envasado por Frasco de 500g",
      type: "number",
      required: true,
      helpText: "Frasco + tapa + etiqueta + miel + amortización.",
      placeholder: "5.50"
    },
    {
      id: "reg-apic-precio-250g",
      label: "Precio Minorista Sugerido para Frasco de 250g",
      type: "number",
      required: true,
      placeholder: "8000"
    },
    {
      id: "reg-apic-precio-1000g",
      label: "Precio Minorista Sugerido para Frasco de 1000g",
      type: "number",
      required: true,
      placeholder: "22000"
    }
  ],
  "step-str-val-precios-may": [
    {
      id: "reg-apic-minimo-unidades-mayorista",
      label: "Cantidad Mínima de Unidades para Compra Mayorista",
      type: "number",
      required: true,
      helpText: "Unidades mínimas de pedido por caja.",
      placeholder: "12"
    },
    {
      id: "reg-apic-tarifario-may-url",
      label: "Enlace al Tarifario Mayorista en PDF",
      type: "url",
      required: false,
      helpText: "Sube tu tarifario y comparte el enlace de acceso comercial.",
      placeholder: "https://drive.google.com/..."
    }
  ],
  "step-str-val-envio": [
    {
      id: "reg-apic-costo-promedio-envio",
      label: "Costo Promedio por Entrega",
      type: "number",
      required: true,
      helpText: "Costo de combustible o mensajero contratado.",
      placeholder: "3000"
    },
    {
      id: "reg-apic-tarifas-envio-zonas",
      label: "Tarifas de Envío por Zonas Geográficas",
      type: "textarea",
      required: true,
      helpText: "Escribe las tarifas acordadas por sector comercial.",
      placeholder: "Sector Centro: $3000. Sector Norte/Sur: $5000. Zona rural: $8000."
    }
  ],
  "step-str-val-garantias": [
    {
      id: "reg-apic-politica-devolucion",
      label: "Política de Devoluciones y Reemplazos por Calidad",
      type: "textarea",
      required: true,
      helpText: "Qué harás si un cliente indica que su miel está en mal estado.",
      placeholder: "Reemplazo inmediato sin costo de cualquier frasco que presente filtraciones o defectos de sellado."
    }
  ],
  "step-str-val-trashumancia-radio": [
    {
      id: "reg-apic-tipo-explotacion",
      label: "Tipo de Explotación del Apiario",
      type: "select",
      required: true,
      helpText: "¿Moverás colmenas o mantendrás apiarios fijos?",
      options: ["Fijo / Estático", "Trashumante (Traslado por floración)", "Mixto"],
      placeholder: "Selecciona..."
    },
    {
      id: "reg-apic-costo-km-transporte",
      label: "Costo de Transporte por Kilómetro",
      type: "number",
      required: true,
      helpText: "Gasto de transporte vehicular en el apiario.",
      placeholder: "150"
    }
  ],
  "step-str-val-revision": [
    {
      id: "reg-apic-desvio-costos",
      label: "Porcentaje de Variación de Costos Reales vs. Proyección",
      type: "number",
      required: true,
      helpText: "Porcentaje de desvío presupuestal (+ o -).",
      placeholder: "5"
    }
  ],

  // --- NEGOCIO ---
  "step-bus-leg-registro": [
    {
      id: "reg-apic-nombre-comercial",
      label: "Nombre Comercial Registrado Oficialmente",
      type: "text",
      required: true,
      helpText: "El nombre legal oficial de tu empresa.",
      placeholder: "Apiario Oro Dulce S.A.S."
    }
  ],
  "step-bus-leg-registro-pecuario": [
    {
      id: "reg-apic-fecha-registro-pecuario",
      label: "Fecha de Expedición del Certificado Pecuario",
      type: "date",
      required: true,
      helpText: "Fecha de vigencia del registro apícola."
    }
  ],
  "step-bus-leg-permisos-sanitarios": [
    {
      id: "reg-apic-fecha-vencimiento-sanitario",
      label: "Fecha de Vencimiento de la Licencia Sanitaria",
      type: "date",
      required: true,
      helpText: "Fecha de renovación del registro sanitario de alimentos."
    }
  ],
  "step-bus-leg-contrato-terreno": [
    {
      id: "reg-apic-propietario-nombre",
      label: "Nombre Completo del Propietario del Predio",
      type: "text",
      required: true,
      placeholder: "Roberto Pérez Gómez"
    },
    {
      id: "reg-apic-fecha-vencimiento-comodato",
      label: "Fecha de Vencimiento del Comodato",
      type: "date",
      required: true
    }
  ],
  "step-bus-leg-seguro-responsabilidad": [
    {
      id: "reg-apic-seguro-rc-cobertura",
      label: "Suma Asegurada de Responsabilidad Civil",
      type: "number",
      required: true,
      helpText: "Suma asegurada máxima en póliza.",
      placeholder: "50000"
    },
    {
      id: "reg-apic-seguro-rc-aseguradora",
      label: "Compañía Aseguradora de Responsabilidad Civil",
      type: "text",
      required: true,
      placeholder: "Seguros del Estado"
    }
  ],
  "step-bus-leg-seguro-colmenas": [
    {
      id: "reg-apic-seguro-predial-cobertura",
      label: "Detalle de Cobertura Física Contratada",
      type: "textarea",
      required: true,
      helpText: "Qué cubre la póliza (ej. robo de colmenas, incendios forestales).",
      placeholder: "Cubre robo de colmenas activas y daños físicos por vientos e incendios hasta $15000."
    }
  ],
  "step-bus-inf-cuenta-banco": [
    {
      id: "reg-apic-banco-nombre",
      label: "Nombre de la Entidad Bancaria",
      type: "text",
      required: true,
      placeholder: "Banco Agropecuario"
    }
  ],
  "step-bus-inf-tarjeta": [
    {
      id: "reg-apic-tarjeta-cupo",
      label: "Cupo de Crédito de la Tarjeta Comercial",
      type: "number",
      required: true,
      helpText: "Límite de crédito asignado para compras del apiario.",
      placeholder: "3000"
    }
  ],
  "step-bus-inf-pasarelas": [
    {
      id: "reg-apic-pasarela-comision",
      label: "Porcentaje de Comisión Cobrado por Transacción",
      type: "number",
      required: true,
      helpText: "Comisión de Square/Stripe por cada venta.",
      placeholder: "3.5"
    }
  ],
  "step-bus-inf-software-registro": [
    {
      id: "reg-apic-qr-vinculados",
      label: "¿Colmenas Físicas Marcadas con Código QR/Identificador?",
      type: "select",
      required: true,
      options: ["Sí, todas", "Parcialmente", "No, uso numeración pintada"],
      placeholder: "Selecciona..."
    }
  ],
  "step-bus-inf-software-contable": [
    {
      id: "reg-apic-cuentas-contables",
      label: "Cuentas de Gasto Activas Configuradas",
      type: "multiselect",
      required: true,
      helpText: "Categorías de gastos en tu software contable.",
      options: ["Alimentación", "Tratamientos sanitarios", "Combustible", "Envases", "Mano de obra", "Cera y alzas", "Otros"],
      placeholder: "Selecciona..."
    }
  ],
  "step-bus-inf-respaldos": [
    {
      id: "reg-apic-respaldos-frecuencia",
      label: "Frecuencia del Respaldo de Datos de Campo",
      type: "select",
      required: true,
      options: ["Diario", "Semanal", "Quincenal", "Mensual"],
      placeholder: "Selecciona..."
    }
  ],
  "step-bus-adm-guiones": [
    {
      id: "reg-apic-propuesta-mayorista-texto",
      label: "Plantilla de Propuesta Mayorista para Comercios",
      type: "textarea",
      required: true,
      helpText: "Propuesta comercial para enviar por correo/WhatsApp.",
      placeholder: "Ofrecemos cajas de miel de 500g con descuento del 35% por consignación..."
    }
  ],
  "step-bus-adm-trazabilidad": [
    {
      id: "reg-apic-trazabilidad-campos",
      label: "Variables registradas por Lote de Cosecha",
      type: "multiselect",
      required: true,
      helpText: "Datos anotados en cada lote envasado.",
      options: ["Apiario de origen", "Fecha de extracción", "Humedad de la miel (%)", "Color/Variedad floral", "Cantidad de frascos producidos", "Tratamientos previos de colmenas"],
      placeholder: "Selecciona..."
    }
  ],
  "step-bus-adm-conciliacion": [
    {
      id: "reg-apic-ventas-semana-total",
      label: "Total de Ventas de la Semana Registradas",
      type: "number",
      required: true,
      placeholder: "1200"
    }
  ],

  // --- OPERACIONES ---
  "step-ope-adq-proveedor-nucleos": [
    {
      id: "reg-apic-criadero-reinas-raza",
      label: "Raza y Procedencia de las Reinas",
      type: "text",
      required: true,
      helpText: "Genética e hibridación de reinas seleccionadas.",
      placeholder: "Italiana pura del Criadero Las Abejas"
    },
    {
      id: "reg-apic-deposito-reserva",
      label: "Monto de Depósito de Reserva de Núcleos",
      type: "number",
      required: true,
      placeholder: "300"
    }
  ],
  "step-ope-adq-cajas": [
    {
      id: "reg-apic-cera-kilos-adquiridos",
      label: "Láminas de Cera Adquiridas (Kilos)",
      type: "number",
      required: true,
      helpText: "Cera estampada pura adquirida en bodega.",
      placeholder: "15"
    },
    {
      id: "reg-apic-pintura-tipo",
      label: "Tipo y Color de Pintura Utilizado en Cajas",
      type: "text",
      required: true,
      helpText: "Pintura protectora exterior no tóxica.",
      placeholder: "Pintura látex acrílica blanca base agua"
    }
  ],
  "step-ope-adq-herramientas": [
    {
      id: "reg-apic-herramientas-costo",
      label: "Costo de Adquisición del Kit de Campo",
      type: "number",
      required: true,
      helpText: "Costo total de ahumador, palanca y cepillo.",
      placeholder: "120"
    }
  ],
  "step-ope-adq-indumentaria": [
    {
      id: "reg-apic-guantes-tipo",
      label: "Tipo de Guantes de Protección",
      type: "select",
      required: true,
      options: ["Cuero de cabra (Recomendado)", "Lona gruesa", "Nitrilo grueso/químico", "Otro"],
      placeholder: "Selecciona..."
    }
  ],
  "step-ope-adq-maquinaria-extraccion": [
    {
      id: "reg-apic-material-extractor",
      label: "Material de Construcción del Extractor",
      type: "select",
      required: true,
      options: ["Acero Inoxidable 304 Grado Alimenticio", "Acero Galvanizado (No recomendado)", "Plástico grado alimentario"],
      placeholder: "Selecciona..."
    },
    {
      id: "reg-apic-decantadores-capacidad",
      label: "Capacidad Total de Decantación (Litros)",
      type: "number",
      required: true,
      placeholder: "200"
    }
  ],
  "step-ope-org-disposicion": [
    {
      id: "reg-apic-orientacion-piqueras",
      label: "Orientación de Piqueras del Apiario",
      type: "select",
      required: true,
      options: ["Este (Recomendado)", "Sureste", "Sur", "Norte/Oeste"],
      placeholder: "Selecciona..."
    },
    {
      id: "reg-apic-caballetes-material",
      label: "Material Utilizado en Caballetes/Soportes",
      type: "text",
      required: true,
      placeholder: "Caballetes de tubo de acero galvanizado con grasa antifitosanitaria"
    }
  ],
  "step-ope-org-almacen-cera": [
    {
      id: "reg-apic-cuadros-almacenados-cant",
      label: "Cantidad de Cuadros de Cera Almacenados",
      type: "number",
      required: true,
      helpText: "Cuadros construidos en stock listos para alzas.",
      placeholder: "120"
    }
  ],
  "step-ope-org-bebederos": [
    {
      id: "reg-apic-bebedero-flotador-tipo",
      label: "Tipo de Flotador Seguro Instalado",
      type: "text",
      required: true,
      helpText: "Insumo de flotación (ej. corchos de vino, listones de madera).",
      placeholder: "Corchos de vino flotantes y rejilla de plástico"
    }
  ],
  "step-ope-seg-msds": [
    {
      id: "reg-apic-msds-lista",
      label: "Hojas MSDS Incluidas en Carpeta",
      type: "multiselect",
      required: true,
      options: ["Ácido Oxálico", "Ácido Fórmico", "Timol / Apilife", "Amitraz", "Combustibles/Otros"],
      placeholder: "Selecciona..."
    }
  ],
  "step-ope-seg-alergias": [
    {
      id: "reg-apic-botiquin-antihistaminico",
      label: "Nombre del Antihistamínico en Botiquín",
      type: "text",
      required: true,
      helpText: "Medicamento oral antihistamínico de rescate rápido.",
      placeholder: "Cetirizina 10mg / Loratadina"
    }
  ],
  "step-ope-seg-advertencia": [
    {
      id: "reg-apic-distancia-carteles",
      label: "Distancia Promedio de Carteles a las Colmenas (Metros)",
      type: "number",
      required: true,
      placeholder: "50"
    }
  ],
  "step-ope-seg-trashumancia-log": [
    {
      id: "reg-apic-transporte-tipo-vehiculo",
      label: "Vehículo Utilizado para Transporte de Colmenas",
      type: "text",
      required: true,
      placeholder: "Camioneta Pickup 4x4 con estacas"
    },
    {
      id: "reg-apic-transporte-seguridad-mallas",
      label: "¿Cuenta con mallas de transporte de colmenas completas?",
      type: "select",
      required: true,
      options: ["Sí, malla perimetral de carga", "Sí, mallas individuales de piquera/tapa", "No"],
      placeholder: "Selecciona..."
    }
  ],
  "step-ope-tra-biologia": [
    {
      id: "reg-apic-entidad-capacitacion",
      label: "Entidad u Organización que Impartió el Curso",
      type: "text",
      required: true,
      placeholder: "Federación Nacional de Apicultores / SENA"
    }
  ],
  "step-ope-tra-mentor": [
    {
      id: "reg-apic-mentor-horas-campo",
      label: "Horas de Práctica Acumuladas con el Mentor",
      type: "number",
      required: true,
      placeholder: "12"
    },
    {
      id: "reg-apic-mentor-aprendizajes",
      label: "Principales Consejos del Mentor en Campo",
      type: "textarea",
      required: true,
      placeholder: "Ahumar siempre de espaldas al viento, no abrir cajas en días nublados o fríos..."
    }
  ],
  "step-ope-tra-inspeccion": [
    {
      id: "reg-apic-inspeccion-patron-cria",
      label: "Patrón de Cría Mayoritario",
      type: "select",
      required: true,
      options: ["Compacto / Sano (Excelente)", "En salpicaduras (Reina vieja/enferma)", "Escasa cría (Falta alimento)"],
      placeholder: "Selecciona..."
    },
    {
      id: "reg-apic-postura-huevos-detectada",
      label: "¿Postura de huevos de menos de 3 días detectada?",
      type: "select",
      required: true,
      options: ["Sí, en todas las colmenas", "Parcialmente", "No (Requiere atención urgente)"],
      placeholder: "Selecciona..."
    }
  ],
  "step-ope-tra-enfermedades": [
    {
      id: "reg-apic-protocolo-desinfeccion",
      label: "Desinfectante Utilizado para Herramientas",
      type: "text",
      required: true,
      helpText: "Método para evitar contagios de esporas de Loque entre cajas.",
      placeholder: "Llama directa de soplete de gas en palanca apícola"
    }
  ],
  "step-ope-tra-monitoreo-varroa": [
    {
      id: "reg-apic-varroa-metodo-test",
      label: "Método de Monitoreo de Varroa",
      type: "select",
      required: true,
      options: ["Lavado de alcohol (Test del frasco)", "Azúcar glass (Método no destructivo)", "Piso adhesivo (Caída natural)"],
      placeholder: "Selecciona..."
    }
  ],
  "step-ope-tra-tratamiento-varroa": [
    {
      id: "reg-apic-tratamiento-fecha-aplicacion",
      label: "Fecha de Inicio del Tratamiento contra Varroa",
      type: "date",
      required: true
    },
    {
      id: "reg-apic-tratamiento-duracion",
      label: "Duración del Tratamiento (Días)",
      type: "number",
      required: true,
      placeholder: "15"
    }
  ],
  "step-ope-tra-jarabe-estimulacion": [
    {
      id: "reg-apic-jarabe-1-1-azucar-kilos",
      label: "Kilos de Azúcar Utilizados en Jarabe 1:1",
      type: "number",
      required: true,
      placeholder: "20"
    }
  ],
  "step-ope-tra-jarabe-reserva": [
    {
      id: "reg-apic-reserva-litros-total",
      label: "Litros de Jarabe 2:1 Suministrados al Apiario",
      type: "number",
      required: true,
      placeholder: "40"
    }
  ],
  "step-ope-tra-torta-proteica": [
    {
      id: "reg-apic-torta-formula",
      label: "Fórmula de Torta Proteica Utilizada",
      type: "text",
      required: true,
      placeholder: "Levadura de cerveza (40%) + Harina de soya desgrasada (40%) + Miel pura"
    }
  ],
  "step-ope-tra-enjambrazon": [
    {
      id: "reg-apic-enjambrazon-frecuencia",
      label: "Incidencia de Celdillas Reales de Enjambrazón",
      type: "select",
      required: true,
      options: ["Alta (Requiere división inmediata)", "Media (Se eliminaron celdas)", "Nula (Sin celdas de enjambrazón)"],
      placeholder: "Selecciona..."
    }
  ],
  "step-ope-tra-fusion": [
    {
      id: "reg-apic-fusion-motivo",
      label: "Motivo de la Fusión de Colmenas",
      type: "text",
      required: true,
      placeholder: "Orfandad prolongada detectada en Colmena 4 en otoño"
    }
  ],
  "step-ope-tra-cosecha": [
    {
      id: "reg-apic-alzas-cosechadas-cant",
      label: "Cantidad de Alzas Melíferas Cosechadas",
      type: "number",
      required: true,
      placeholder: "12"
    },
    {
      id: "reg-apic-porcentaje-operculado",
      label: "Porcentaje de Celdillas Operculadas Promedio (%)",
      type: "number",
      required: true,
      helpText: "Meta de operculación para evitar humedad en la miel.",
      placeholder: "90"
    }
  ],
  "step-ope-reg-desoperculacion": [
    {
      id: "reg-apic-cera-operculo-recuperada",
      label: "Cera de Opérculo Cosechada (Kilos)",
      type: "number",
      required: true,
      placeholder: "8"
    }
  ],
  "step-ope-reg-extraccion": [
    {
      id: "reg-apic-tiempo-centrifugado",
      label: "Tiempo de Centrifugado por Carga (Minutos)",
      type: "number",
      required: true,
      placeholder: "10"
    }
  ],
  "step-ope-reg-decantacion": [
    {
      id: "reg-apic-miel-humedad-refractometro",
      label: "Porcentaje de Humedad Final por Refractómetro (%)",
      type: "number",
      required: true,
      helpText: "Debe ser menor al 18% para evitar fermentación.",
      placeholder: "17.2"
    }
  ],
  "step-ope-reg-envasado": [
    {
      id: "reg-apic-unidades-envasadas-otras",
      label: "Cantidad de Frascos de Otras Presentaciones",
      type: "text",
      required: true,
      helpText: "Unidades envasadas de 250g o 1kg (ej: 80 frascos de 250g).",
      placeholder: "40 frascos de 250g y 20 frascos de 1kg"
    }
  ],
  "step-ope-mantenimiento-semanal": [
    {
      id: "reg-apic-maint-pillaje-detectado",
      label: "¿Signos de Pillaje o Robos en Piqueras?",
      type: "select",
      required: true,
      options: ["No, vuelo ordenado", "Leve (Peleas aisladas en piqueras)", "Grave (Alerta, pillaje generalizado)"],
      placeholder: "Selecciona..."
    }
  ],
  "step-ope-inventario-insumos": [
    {
      id: "reg-apic-inv-cera-panales-stock",
      label: "Láminas de Cera Estampada en Stock",
      type: "number",
      required: true,
      placeholder: "50"
    }
  ],

  // --- CLIENTES ---
  "step-cli-bra-logo": [
    {
      id: "reg-apic-brand-nombre",
      label: "Nombre de Marca Registrado / Comercial",
      type: "text",
      required: true,
      placeholder: "Miel Oro de la Sierra"
    }
  ],
  "step-cli-bra-colores": [
    {
      id: "reg-apic-fuentes-tipograficas",
      label: "Fuentes Tipográficas Oficiales (Títulos y Cuerpo)",
      type: "text",
      required: true,
      placeholder: "Outfit (Títulos) y Inter (Cuerpo y Tablas)"
    }
  ],
  "step-cli-bra-vehiculo": [
    {
      id: "reg-apic-uniforme-color",
      label: "Color y Estilo de Uniforme Elegido",
      type: "text",
      required: true,
      placeholder: "Camisa Polo amarilla con bordado verde y pantalón jean azul"
    }
  ],
  "step-cli-evi-fotos": [
    {
      id: "reg-apic-fotos-cantidad-total",
      label: "Cantidad Total de Fotos de Evidencia Organizadas",
      type: "number",
      required: true,
      placeholder: "24"
    }
  ],
  "step-cli-evi-folleto": [
    {
      id: "reg-apic-folleto-imprenta-cant",
      label: "Cantidad de Folletos Impresos en Primera Edición",
      type: "number",
      required: true,
      placeholder: "200"
    }
  ],
  "step-cli-evi-etiquetas": [
    {
      id: "reg-apic-etiqueta-dimensiones",
      label: "Dimensiones Físicas de la Etiqueta (Ancho x Alto mm)",
      type: "text",
      required: true,
      placeholder: "120 x 60 mm"
    }
  ],
  "step-cli-evi-imanes": [
    {
      id: "reg-apic-imanes-costo-unitario",
      label: "Costo de Producir un Imán",
      type: "number",
      required: true,
      placeholder: "0.45"
    }
  ],
  "step-cli-web-dominio": [
    {
      id: "reg-apic-dominio-registrador",
      label: "Compañía Registradora del Dominio",
      type: "text",
      required: true,
      placeholder: "Namecheap"
    }
  ],
  "step-cli-web-sitio": [
    {
      id: "reg-apic-web-plataforma-hosting",
      label: "Plataforma de Hosting/CMS Utilizada",
      type: "text",
      required: true,
      placeholder: "Vercel / Next.js y TailwindCSS"
    }
  ],
  "step-cli-web-seo": [
    {
      id: "reg-apic-google-console-verificado",
      label: "¿Web verificada e indexada en Google Search Console?",
      type: "select",
      required: true,
      options: ["Sí", "En proceso", "No"],
      placeholder: "Selecciona..."
    }
  ],
  "step-cli-web-google-business": [
    {
      id: "reg-apic-google-business-estado",
      label: "Estado de la Ficha de Google Business",
      type: "select",
      required: true,
      options: ["Activa y verificada públicamente", "Pendiente de verificación (carta/video)", "No creada"],
      placeholder: "Selecciona..."
    }
  ],
  "step-cli-adq-alianzas": [
    {
      id: "reg-apic-unidades-consignacion",
      label: "Total de Frascos Entregados a Consignación en Tiendas",
      type: "number",
      required: true,
      placeholder: "60"
    }
  ],
  "step-cli-adq-mercados": [
    {
      id: "reg-apic-feria-fecha",
      label: "Fecha de la Participación en Feria",
      type: "date",
      required: true
    },
    {
      id: "reg-apic-feria-ventas",
      label: "Ventas Totales Realizadas en el Día de Feria",
      type: "number",
      required: true,
      placeholder: "350"
    }
  ],
  "step-cli-adq-rastreo": [
    {
      id: "reg-apic-clientes-nuevos-mes",
      label: "Cantidad de Clientes Nuevos Captados en el Mes",
      type: "number",
      required: true,
      placeholder: "18"
    }
  ],
  "step-cli-adq-programa-envases": [
    {
      id: "reg-apic-envases-descuento-applied",
      label: "Monto de Descuentos Otorgados por Envases Devueltos",
      type: "number",
      required: true,
      placeholder: "120"
    }
  ]
};
