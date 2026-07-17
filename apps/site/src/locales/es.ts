import type { Dictionary } from "./pt";

export const es: Dictionary = {
  nav: {
    topo: "Volver arriba",
    problema: "Por qué",
    modulos: "Plataforma",
    planos: "Precios",
    acessar: "Entrar",
    plataforma: "Abrir app",
    abrirMenu: "Abrir menú",
    fecharMenu: "Cerrar menú",
    tema: "Cambiar tema",
    sectionPlanos: "PRECIOS",
  },

  hero: {
    eyebrow: "La plataforma para construir y lanzar más rápido",
    line1: "Del commit al deploy",
    line2Lead: "a la velocidad de",
    line2Highlight: "tu producto.",
    subtitle:
      "Boilerplate es la plataforma de desarrollo que reúne workflows, automatizaciones, analíticas y APIs en un solo lugar. Menos infraestructura que montar, más tiempo para enviar el código que importa.",
    ctaPrimary: "Empezar gratis",
    ctaSecondary: "Explorar la plataforma",
    scrollHint: "desplaza para descubrir",
  },

  problem: {
    eyebrow: "Por qué Boilerplate",
    headlineLead: "Menos glue code, ",
    headlineHighlight: "más producto en marcha.",
    subtitle:
      "Todo equipo quema sus primeras semanas montando el pipeline, la autenticación, los paneles y las integraciones antes de escribir una línea del producto. Boilerplate te entrega esa base lista — probada, tipada y escalable — para que te enfoques en lo que hace único a tu producto.",
    answerLabel: "La plataforma",
    items: {
      time: {
        title: "De cero al deploy en minutos",
        body: "CLI, entorno y pipeline listos. Clona, conecta tu repositorio y el primer build sube antes de que se enfríe el café.",
      },
      energy: {
        title: "Una developer experience de verdad",
        body: "Tipado de punta a punta, hot reload instantáneo y un SDK predecible. La DX que tu equipo merece, sin parches.",
      },
      scatter: {
        title: "Escala sin reescribir",
        body: "La arquitectura acompaña desde un MVP hasta millones de peticiones, sin migración dolorosa cuando llega el tráfico.",
      },
      answer: {
        title: "Tu stack, tu marca",
        body: "APIs abiertas, temas y configuración flexible. Adapta la plataforma a tu producto — sin vendor lock-in.",
      },
    },
    bridge: "Mira todo lo que ya viene incluido.",
  },

  modules: {
    eyebrow: "La plataforma",
    titleLead: "Todo para construir y operar, ",
    titleHighlight: "en un solo lugar.",
    subtitle: "Bloques que se comunican entre sí — workflows, automatizaciones, datos e integraciones listos para producción.",
    counterSeparator: "/",
    a11yPrev: "Anterior",
    a11yNext: "Siguiente",
    a11yGoTo: "Ir a",
    items: {
      workflows: {
        title: "Workflows",
        body: "Orquesta pasos y estados en flujos versionados y observables, desde el onboarding hasta el checkout.",
      },
      automation: {
        title: "Automatizaciones",
        body: "Dispara jobs por evento, agenda o webhook. Deja que el trabajo repetitivo se ejecute solo en segundo plano.",
      },
      analytics: {
        title: "Analíticas",
        body: "Eventos, paneles y métricas en tiempo real para responder las preguntas de producto que importan.",
      },
      collaboration: {
        title: "Seguridad",
        body: "SSO, RBAC granular y logs de auditoría por defecto. Control de acceso listo desde el primer usuario.",
      },
      integrations: {
        title: "Integraciones y API",
        body: "REST, webhooks y SDKs para conectar cualquier servicio con un punto de extensión simple y predecible.",
      },
      customization: {
        title: "Escala",
        body: "Edge, caché y autoscaling integrados. Baja latencia global sin que aprovisiones un solo servidor.",
      },
    },
  },

  trust: {
    eyebrow: "Confianza",
    titleLead: "Equipos de todos los tamaños ",
    titleHighlight: "construyen sobre nosotros.",
    subtitle:
      "Una plataforma probada en producción, con 99,99% de uptime y un SLA de nivel enterprise — para que lances con confianza desde el primer deploy.",
    logosLabel: "Usado por equipos de ingeniería de",
    items: {
      privacidade: {
        title: "Developer experience",
        body: "Docs claras, SDKs tipados y una CLI que funciona. Tu equipo se integra en minutos, no en sprints.",
      },
      seguranca: {
        title: "Seguro por defecto",
        body: "SOC 2, cifrado de punta a punta y logs de auditoría integrados — seguridad de nivel enterprise sin esfuerzo.",
      },
      assinatura: {
        title: "Realmente rápido",
        body: "Una red edge global y caché inteligente entregan respuestas en milisegundos, en cualquier región.",
      },
      scale: {
        title: "Escala infinita",
        body: "De prototipo a millones de peticiones sin reescribir. El autoscaling acompaña cada pico de tráfico.",
      },
    },
    testimonials: {
      one: {
        quote:
          "Migramos todo el stack en una tarde y redujimos el tiempo de deploy de horas a minutos. Uptime impecable desde entonces.",
        author: "Alex Costa",
        role: "CTO, Acme",
        initials: "AC",
      },
      two: {
        quote:
          "Los workflows y la API desbloquearon integraciones que antes tomaban meses. Nuestro equipo se enfocó en el producto, no en la infraestructura.",
        author: "Bruna Dias",
        role: "VP de Ingeniería, Globex",
        initials: "BD",
      },
      three: {
        quote:
          "Escalamos de mil a un millón de usuarios sin tocar la arquitectura. Exactamente la base que queríamos.",
        author: "Carlos Melo",
        role: "Fundador, Initech",
        initials: "CM",
      },
    },
  },

  pricing: {
    eyebrow: "Precios",
    titleLead: "Un plan ",
    titleHighlight: "para cada",
    titleTail: " etapa.",
    subtitle:
      "Empieza gratis y crece a tu ritmo. Sin permanencia, sin costes de setup — solo precios predecibles a medida que escalas.",
    trialTitle: "14 días gratis, sin tarjeta",
    trialSubtitle: "Corre en producción con todas las funciones. Haz upgrade solo cuando el producto lo pida.",
    closingPart1: "Todos los planes incluyen ",
    closingHighlight: "la plataforma completa",
    closingPart2: " — la diferencia está en el throughput y el soporte.",
    descLabel: "DESCRIPCIÓN",
    subtotalLabel: "SUBTOTAL",
    totalLabel: "TOTAL",
    featuredBadge: "MÁS POPULAR",
    plans: {
      starter: {
        name: "STARTER",
        description: "Para indies y side projects",
        descriptionSubtitle: "Todo para poner tu primer producto en marcha. Cancela cuando quieras.",
        totalSuffix: "/ mes",
        cta: "Empezar gratis",
      },
      pro: {
        name: "PRO",
        description: "Para equipos en crecimiento",
        descriptionSubtitle: "Más throughput, automatizaciones avanzadas y entornos de staging para escalar.",
        totalSuffix: "/ mes",
        installments: "por usuario",
        cta: "Suscribir Pro",
      },
      enterprise: {
        name: "ENTERPRISE",
        description: "Para operaciones críticas",
        descriptionSubtitle: "SSO, SLA garantizado, soporte dedicado y controles de seguridad avanzados.",
        totalSuffix: "/ mes",
        cta: "Hablar con ventas",
      },
    },
  },

  footer: {
    tagline:
      "La plataforma de desarrollo para construir, escalar y lanzar tu próximo producto. Workflows, automatizaciones, analíticas y APIs en un solo lugar.",
    navHeader: "Navegar",
    contatoHeader: "Habla con nosotros",
    contatoInvite:
      "¿Dudas sobre la plataforma o quieres una demo? Escribe a nuestro equipo de ingeniería.",
    termos: "Términos de uso",
    privacidade: "Política de privacidad",
    acessar: "Abrir la app",
    whatsapp: "Hablar por WhatsApp",
    whatsappMessage: "¡Hola! Vine desde el sitio y me gustaría saber más sobre la plataforma.",
    copyright: "La plataforma para construir y lanzar más rápido.",
  },

  legal: {
    eyebrow: "Legal",
    backToHome: "Volver al inicio",
    updatedAt: "Última actualización:",
    updatedAtDate: "1 de enero de 2025",
    privacyTitle: "Política de Privacidad",
    privacyIntro:
      "Este es un texto de ejemplo. Reemplázalo con tu propia política de privacidad antes de publicar.",
    termsTitle: "Términos de Uso",
    termsIntro:
      "Este es un texto de ejemplo. Reemplázalo con tus propios términos de uso antes de publicar.",
  },
};
