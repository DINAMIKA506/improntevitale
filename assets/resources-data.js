(function () {
  const scale = [
    { label: "0 · No logro definirlo", value: "0" },
    { label: "1 · Nunca", value: "1" },
    { label: "2 · Pocas veces", value: "2" },
    { label: "3 · Bastantes veces", value: "3" },
    { label: "4 · Con mucha frecuencia", value: "4" }
  ];

  const maturityQuestions = [
    "Tengo conciencia de lo que valgo y logro hacerme respetar por ello.",
    "Acepto con agrado lo esencial de mi forma de ser.",
    "Defiendo con empeño mis ideas y obras.",
    "Cuando debo valorarme respecto a otras personas, me doy mi lugar.",
    "Actúo con independencia para tomar decisiones importantes.",
    "Resuelvo mis propios problemas.",
    "No me preocupa demasiado lo que piensan otras personas al emprender una actividad nueva.",
    "Hago frente a mis compromisos.",
    "Llevo mis actividades hasta el final.",
    "Doy seguimiento al trabajo que comienzo.",
    "Confío en mi capacidad.",
    "Me siento seguro o segura de mis capacidades al asumir compromisos.",
    "Persisto ante las dificultades.",
    "Estoy dispuesto o dispuesta a trabajar las horas necesarias para alcanzar un objetivo.",
    "Busco otra forma de actuar cuando el primer intento no funciona.",
    "Concreto las metas que me propongo.",
    "Visualizo rutas para alcanzar mis metas y me organizo.",
    "Tomo la iniciativa cuando trabajo en grupo.",
    "Encuentro formas de hacer realidad mis planes.",
    "Me organizo para cumplir mis compromisos.",
    "Encuentro con facilidad formas de realizar mis deseos y metas.",
    "Aprovecho mis fortalezas y busco equilibrar mis debilidades.",
    "Me comunico con facilidad.",
    "Puedo tomar una decisión con rapidez cuando la situación lo requiere.",
    "Una vez que he tomado una decisión importante, mantengo mi criterio.",
    "Si una decisión lo amerita, la pospongo hasta analizar sus distintos aspectos.",
    "Busco la opinión de alguien cercano para decisiones que no son trascendentes.",
    "Distingo con claridad las posibilidades disponibles antes de decidir.",
    "Escucho lo que otras personas opinan sobre mí aunque no coincida con ello.",
    "Escucho sin impacientarme.",
    "Tolero posiciones contrarias a la mía.",
    "Acepto que un problema puede tener varias soluciones.",
    "Me adapto a los cambios.",
    "Me apasiono con una idea o causa que considero valiosa.",
    "Me entusiasmo con proyectos nuevos.",
    "Puedo continuar aunque el reconocimiento no sea inmediato.",
    "Puedo esperar cuando la recompensa de mi esfuerzo tarda.",
    "Espero los resultados con serenidad.",
    "Mantengo mi fortaleza cuando encuentro una dificultad.",
    "Conservo la serenidad ante una situación difícil.",
    "Puedo actuar sin sentir presión excesiva.",
    "Controlo mis reacciones cotidianas sin acumular gran tensión.",
    "Actúo con optimismo ante una actividad o un cambio.",
    "Mantengo una mirada optimista hacia mi futuro." 
  ];

  const maturityGroups = [
    ["Autoconocimiento", "Reconocé cómo te valorás y cómo te posicionás ante nuevas experiencias.", 0, 7],
    ["Compromiso personal", "Pensá en la forma en que asumís y sostenés tus responsabilidades.", 7, 14],
    ["Iniciativa y metas", "Explorá cómo convertís tus ideas en acciones.", 14, 22],
    ["Decisión y comunicación", "Observá tus recursos para expresarte y elegir.", 22, 29],
    ["Flexibilidad y motivación", "Revisá cómo recibís otras perspectivas y sostenés el entusiasmo.", 29, 37],
    ["Serenidad y optimismo", "Reconocé cómo transitás la espera, la presión y las dificultades.", 37, 44]
  ];

  const maturitySteps = maturityGroups.map(([title, description, from, to], groupIndex) => ({
    title,
    description,
    questions: maturityQuestions.slice(from, to).map((label, index) => ({
      id: `m${from + index + 1}`,
      label,
      type: "radio",
      options: scale,
      required: true,
      group: groupIndex
    }))
  }));

  const learningQuestions = [
    ["¿Cuál de las siguientes actividades disfrutás más?", [["Escuchar música","A"],["Ver películas","V"],["Bailar con buena música","K"]]],
    ["¿Qué programa de televisión preferís?", [["Reportajes de descubrimientos y lugares","V"],["Cómico y de entretenimiento","K"],["Noticias del mundo","A"]]],
    ["Cuando conversás con otra persona, vos...", [["La escuchás atentamente","A"],["La observás","V"],["Tendés a tocarla","K"]]],
    ["Si pudieras adquirir uno de estos artículos, ¿cuál elegirías?", [["Un jacuzzi","K"],["Un estéreo","A"],["Un televisor","V"]]],
    ["¿Qué preferís hacer un sábado por la tarde?", [["Quedarte en casa","K"],["Ir a un concierto","A"],["Ir al cine","V"]]],
    ["¿Qué tipo de exámenes se te facilitan más?", [["Examen oral","A"],["Examen escrito","K"],["Examen de opción múltiple","V"]]],
    ["¿Cómo te orientás más fácilmente?", [["Mediante el uso de un mapa","V"],["Pidiendo indicaciones","A"],["A través de la intuición","K"]]],
    ["¿En qué preferís ocupar tu tiempo en un lugar de descanso?", [["Pensar","A"],["Caminar por los alrededores","V"],["Descansar","K"]]],
    ["¿Qué te halaga más?", [["Que te digan que tenés buen aspecto","V"],["Que te digan que tenés un trato muy agradable","K"],["Que te digan que tenés una conversación interesante","A"]]],
    ["¿Cuál de estos ambientes te atrae más?", [["Uno en el que se siente un clima agradable","K"],["Uno en el que se escuchen las olas del mar","A"],["Uno con una hermosa vista al océano","V"]]],
    ["¿De qué manera se te facilita aprender algo?", [["Repitiendo en voz alta","A"],["Escribiéndolo varias veces","V"],["Relacionándolo con algo divertido","K"]]],
    ["¿A qué evento preferirías asistir?", [["A una reunión social","K"],["A una exposición de arte","V"],["A una conferencia","A"]]],
    ["¿De qué manera te formás una opinión de otras personas?", [["Por la sinceridad en su voz","A"],["Por la forma de estrecharte la mano","K"],["Por su aspecto","V"]]],
    ["¿Cómo te considerás?", [["Atlético o atlética","K"],["Intelectual","V"],["Sociable","A"]]],
    ["¿Qué tipo de películas te gustan más?", [["Clásicas","A"],["De acción","K"],["De amor","V"]]],
    ["¿Cómo preferís mantenerte en contacto con otra persona?", [["Por correo electrónico","V"],["Tomando un café juntos","K"],["Por teléfono","A"]]],
    ["¿Cuál frase se identifica más con vos?", [["Me gusta que mi coche se sienta bien al conducirlo","K"],["Percibo hasta el más ligero ruido que hace mi coche","A"],["Es importante que mi coche esté limpio por fuera y por dentro","V"]]],
    ["¿Cómo preferís pasar el tiempo con tu pareja?", [["Conversando","A"],["Acariciándose","K"],["Mirando algo juntos","V"]]],
    ["Si no encontrás las llaves en una bolsa...", [["Las buscás mirando","V"],["Sacudís la bolsa para oír el ruido","A"],["Buscás al tacto","K"]]],
    ["Cuando tratás de recordar algo, ¿cómo lo hacés?", [["A través de imágenes","V"],["A través de emociones","K"],["A través de sonidos","A"]]],
    ["Si tuvieras dinero, ¿qué harías?", [["Comprar una casa","V"],["Viajar y conocer el mundo","K"],["Adquirir un estudio de grabación","A"]]],
    ["¿Con qué frase te identificás más?", [["Reconozco a las personas por su voz","A"],["No recuerdo el aspecto de la gente","K"],["Recuerdo el aspecto de alguien, pero no su nombre","V"]]],
    ["Si tuvieras que quedarte en una isla desierta, ¿qué llevarías?", [["Algunos buenos libros","V"],["Un radio portátil de alta frecuencia","A"],["Golosinas y comida enlatada","K"]]],
    ["¿Cuál entretenimiento preferís?", [["Tocar un instrumento musical","A"],["Sacar fotografías","V"],["Actividades manuales","K"]]],
    ["¿Cómo es tu forma de vestir?", [["Impecable","V"],["Informal","A"],["Muy informal","K"]]],
    ["¿Qué es lo que más te gusta de una fogata nocturna?", [["El calor del fuego y los bombones asados","K"],["El sonido del fuego quemando la leña","A"],["Mirar el fuego y las estrellas","V"]]],
    ["¿Cómo se te facilita entender algo?", [["Cuando te lo explican verbalmente","A"],["Cuando utilizan medios visuales","V"],["Cuando se realiza a través de alguna actividad","K"]]],
    ["¿Por qué te distinguís?", [["Por tener una gran intuición","K"],["Por ser un buen conversador","A"],["Por ser un buen observador","V"]]],
    ["¿Qué es lo que más disfrutás de un amanecer?", [["La emoción de vivir un nuevo día","K"],["Las tonalidades del cielo","V"],["El canto de las aves","A"]]],
    ["Si pudieras elegir, ¿qué preferirías ser?", [["Un gran médico","K"],["Un gran músico","A"],["Un gran pintor","V"]]],
    ["Cuando elegís tu ropa, ¿qué es lo más importante?", [["Que sea adecuada","A"],["Que luzca bien","V"],["Que sea cómoda","K"]]],
    ["¿Qué es lo que más disfrutás de una habitación?", [["Que sea silenciosa","A"],["Que sea confortable","K"],["Que esté limpia y ordenada","V"]]],
    ["¿Qué es más atractivo para vos?", [["Una iluminación tenue","V"],["El perfume","K"],["Cierto tipo de música","A"]]],
    ["¿A qué espectáculo preferirías asistir?", [["A un concierto de música","A"],["A un espectáculo de magia","V"],["A una muestra gastronómica","K"]]],
    ["¿Qué te atrae más de una persona?", [["Su trato y forma de ser","K"],["Su aspecto físico","V"],["Su conversación","A"]]],
    ["Cuando vas de compras, ¿dónde pasás más tiempo?", [["En una librería","V"],["En una perfumería","K"],["En una tienda de discos","A"]]],
    ["¿Cuál es tu idea de una noche romántica?", [["A la luz de las velas","V"],["Con música romántica","A"],["Bailando tranquilamente","K"]]],
    ["¿Qué es lo que más disfrutás de viajar?", [["Conocer personas y hacer nuevos amigos","A"],["Conocer lugares nuevos","V"],["Aprender sobre otras costumbres","K"]]],
    ["Cuando estás en la ciudad, ¿qué extrañás más del campo?", [["El aire limpio y refrescante","K"],["Los paisajes","V"],["La tranquilidad","A"]]],
    ["Si te ofrecieran uno de estos empleos, ¿cuál elegirías?", [["Director de una estación de radio","A"],["Director de un club deportivo","K"],["Director de una revista","V"]]]
  ];

  function groupedLearningQuestions() {
    const names = ["Tus preferencias", "Cómo percibís", "Cómo recordás", "Cómo elegís", "Experiencias y ambientes", "Tu tendencia de aprendizaje", "Preferencias finales"];
    return names.map((title, group) => ({
      title,
      description: "Elegí una sola opción, la que más se parezca a vos.",
      questions: learningQuestions.slice(group * 6, Math.min(group * 6 + 6, learningQuestions.length)).map(([label, options], index) => ({
        id: `e${group * 6 + index + 1}`,
        label,
        type: "radio",
        required: true,
        options: options.map(([optionLabel, category]) => ({ label: optionLabel, value: category }))
      }))
    }));
  }

  const text = (id, label, required = true, type = "textarea") => ({ id, label, required, type });

  window.IMPRONTE_RESOURCES = {
    "madurez-vocacional": {
      kicker: "Test orientativo",
      title: "Madurez vocacional",
      description: "Explorá el estado de preparación en el que te encontrás para efectuar una elección vocacional.",
      duration: "10–12 minutos",
      collectIdentity: true,
      resultType: "maturity",
      steps: maturitySteps,
      note: "No hay respuestas buenas o malas. Elegí la frecuencia que mejor representa tu experiencia actual. El resultado es orientativo y debe revisarse en contexto con una persona profesional."
    },
    "estilos-aprendizaje": {
      kicker: "Test orientativo",
      title: "Estilos de aprendizaje",
      description: "Observá qué canales tendés a utilizar con mayor frecuencia al aprender y relacionarte con la información.",
      duration: "8–10 minutos",
      collectIdentity: true,
      resultType: "learning",
      steps: groupedLearningQuestions(),
      note: "El resultado describe tendencias, no una etiqueta fija. Podemos combinar distintos canales según la tarea y el contexto."
    },
    "ruta-decision": {
      kicker: "Guía reflexiva",
      title: "La ruta de la decisión",
      description: "Un enfoque estructurado para enfrentar un dilema, analizar tus opciones y avanzar con más confianza.",
      duration: "6–8 minutos",
      collectIdentity: true,
      resultType: "reflection",
      note: "Tomate tu tiempo. Podés cerrar y continuar más adelante desde este mismo dispositivo.",
      steps: [
        { title: "1. Definir el problema", description: "Enfocate en lo que realmente importa y en las dimensiones del desafío.", questions: [text("d1","¿Cuál es el problema o la decisión específica que estás enfrentando?"), text("d2","¿Qué impacto tiene este problema en tu vida o en otros aspectos importantes?")] },
        { title: "2. Recopilar información", description: "Reuní datos y perspectivas que te permitan comprender mejor la situación.", questions: [text("d3","¿Cuáles son las opciones disponibles?"), text("d4","¿Cuáles son las ventajas y desventajas de cada opción?"), text("d5","¿Qué datos o hechos respaldan cada opción?"), text("d6","¿Qué experiencias o consejos pueden ofrecer personas que tomaron decisiones similares?"), text("d7","¿Existen personas expertas o recursos que puedan darte información adicional?"), text("d8","¿Cuál es tu nivel de confianza en la información que reuniste?")] },
        { title: "3. Analizar las opciones", description: "Reconocé lo que cada alternativa necesita y cómo te hace sentir.", questions: [text("d9","¿Cómo te sentís con respecto a cada opción?"), text("d10","¿Qué recursos necesitás para implementar cada opción?"), text("d11","¿Cuáles son las posibles consecuencias o resultados de cada opción?")] },
        { title: "4. Elegir con intención", description: "Buscá la alternativa que mejor se alinee con tus necesidades, valores y metas.", questions: [text("d12","¿Cuál es tu opción preferida en este momento y por qué?"), text("d13","¿Cómo se alinea esta decisión con tus valores personales y metas a largo plazo?")] },
        { title: "5. Implementar y dar seguimiento", description: "Convertí la elección en acciones concretas y mantenete abierto o abierta a ajustar.", questions: [text("d14","¿Cuáles son los pasos concretos para implementar tu decisión?"), text("d15","¿Cómo darás seguimiento a los resultados y ajustarás tu elección si es necesario?"), text("d16","¿Cómo te sentís ahora después de recorrer esta ruta?")] }
      ]
    },
    "proyecto-vida": {
      kicker: "Guía reflexiva",
      title: "Mi proyecto de vida",
      description: "Una ruta de seis pasos para conocerte, crear metas y convertirlas en acciones que tengan sentido para vos.",
      duration: "8–10 minutos",
      collectIdentity: true,
      resultType: "reflection",
      note: "Este proceso es personal. No necesitás tener todas las respuestas hoy; lo valioso es comenzar a nombrarlas.",
      steps: [
        { title: "1. Conocerme", description: "Tu esencia es la base sobre la que construís tu proyecto.", questions: [text("p1","¿Cuáles son tus valores personales más importantes?"), text("p2","¿Cuáles son tus fortalezas y las áreas que querés fortalecer?"), text("p3","¿Qué te apasiona? ¿Cuáles son tus intereses y hobbies?")] },
        { title: "2. Establecer metas", description: "Definí una dirección que te inspire y objetivos que puedas observar.", questions: [text("p4","¿Dónde te ves en cinco años en tu carrera y vida personal?"), text("p5","¿Qué metas a corto plazo te gustaría lograr este año?"), text("p6","¿Cuáles son tus metas financieras?")] },
        { title: "3. Crear un plan", description: "Pasá de la intención a pasos concretos.", questions: [text("p7","¿Qué pasos específicos debés tomar para alcanzar tus metas a corto plazo?"), text("p8","¿Cómo desarrollarás las habilidades y conocimientos que necesitan tus metas a largo plazo?"), text("p9","¿Qué recursos necesitás para lograr tus metas?")] },
        { title: "4. Superar obstáculos", description: "Anticipá dificultades y prepará estrategias para sostenerte.", questions: [text("p10","¿Qué desafíos anticipás en el camino hacia tus metas?"), text("p11","¿Cómo planeás enfrentar y superar esos obstáculos?"), text("p12","¿Qué estrategias usarás cuando te sintás sin motivación o encontrés dificultades?")] },
        { title: "5. Revisar y ajustar", description: "Ser flexible también es avanzar.", questions: [text("p13","¿Con qué frecuencia revisarás tu progreso?"), text("p14","¿Estás dispuesto o dispuesta a ajustar tus metas? ¿Bajo qué circunstancias?"), text("p15","¿Qué señales indicarían que es hora de hacer ajustes?")] },
        { title: "6. Celebrar los logros", description: "Reconocer cada avance alimenta tu motivación.", questions: [text("p16","¿Cómo te recompensarás cuando alcancés tus metas?"), text("p17","¿Cómo celebrarás tus logros, grandes o pequeños?"), text("p18","¿Qué importancia tiene para vos celebrar tus éxitos?"), text("p19","¿Cómo te sentís ahora después de recorrer estos pasos?")] }
      ]
    },
    "creando-mi-ikigai": {
      kicker: "Mapa de propósito",
      title: "Creando mi ikigai",
      description: "Explorá lo que amás, tus fortalezas, lo que el mundo necesita y las formas en que podés aportar valor para construir tu propio mapa de propósito.",
      duration: "8–10 minutos",
      collectIdentity: true,
      resultType: "ikigai",
      note: "No necesitás encontrar una respuesta perfecta. Escribí ideas concretas y personales; al finalizar podrás descargar tu mapa de Ikigai.",
      steps: [
        { title: "1. Lo que amás", description: "Pensá en aquello que despierta tu alegría, curiosidad y energía.", questions: [
          { id: "ik_love", label: "¿Qué actividades, temas o experiencias te hacen sentir con energía, alegría y ganas de seguir?", type: "textarea", required: true, maxLength: 220 }
        ]},
        { title: "2. En lo que sos buena o bueno", description: "Reconocé capacidades que ya usás y otras que las personas ven en vos.", questions: [
          { id: "ik_good", label: "¿Qué habilidades, fortalezas o talentos reconocés en vos?", type: "textarea", required: true, maxLength: 220 }
        ]},
        { title: "3. Lo que el mundo necesita", description: "Observá necesidades de personas, comunidades o entornos que te importan.", questions: [
          { id: "ik_world", label: "¿Qué necesidad, problema o causa te gustaría ayudar a transformar?", type: "textarea", required: true, maxLength: 220 }
        ]},
        { title: "4. Por lo que podrían pagarte", description: "Conectá tus capacidades con servicios, trabajos o soluciones que generan valor.", questions: [
          { id: "ik_paid", label: "¿Qué podrías ofrecer como trabajo, servicio o producto por lo que alguien estaría dispuesto a pagarte?", type: "textarea", required: true, maxLength: 220 }
        ]},
        { title: "5. El punto de encuentro", description: "Releé tus respuestas y nombrá el hilo que las conecta.", questions: [
          { id: "ik_core", label: "Al unir todo lo anterior, ¿cómo describirías en una frase el aporte que querés hacer?", type: "textarea", required: true, maxLength: 180 }
        ]}
      ]
    },
    "ficha-tecnica": {
      kicker: "Información inicial privada",
      title: "Ficha técnica",
      description: "Estos datos permiten abrir tu expediente y preparar un acompañamiento más cuidadoso desde el primer encuentro.",
      duration: "5 minutos",
      collectIdentity: false,
      resultType: "submission",
      sensitive: true,
      note: "Esta ficha incluye información personal. Solo será enviada al confirmar y debe almacenarse con acceso privado. Si se trata de una persona menor de edad, completá también los datos de la persona responsable.",
      steps: [
        { title: "1. Datos de la persona", description: "Información básica para identificar el expediente.", questions: [
          text("nombre","Nombre completo",true,"text"), text("cedula","Número de cédula",true,"text"), text("nacimiento","Fecha de nacimiento",true,"date"), text("correo","Correo de la persona o responsable si es menor",true,"email")
        ]},
        { title: "2. Persona responsable", description: "Completá esta parte únicamente si la persona atendida es menor de edad.", questions: [
          text("responsable_nombre","Nombre completo de la persona responsable",false,"text"), text("responsable_telefono","Teléfono de la persona responsable",false,"tel"), text("responsable_cedula","Cédula de la persona responsable",false,"text")
        ]},
        { title: "3. Contexto actual", description: "Contanos un poco sobre tu lugar de residencia y etapa actual.", questions: [
          text("residencia","Lugar de residencia: provincia, cantón y distrito"),
          { id:"educacion", label:"Nivel educativo", type:"select", required:true, options:["Primaria incompleta","Primaria completa","Secundaria incompleta","Secundaria completa","Universidad incompleta","Universidad completa"].map(value=>({label:value,value})) },
          text("grado","Si estudiás actualmente, ¿qué grado o año cursás?",false,"text"), text("ocupacion","Ocupación actual",true,"text")
        ]},
        { title: "4. Motivo del proceso", description: "Esta información ayuda a preparar el primer encuentro.", questions: [
          { id:"tipo_proceso", label:"Tipo de proceso", type:"select", required:true, options:["Psicopedagogía","Orientación","Ambos","No tengo claridad todavía"].map(value=>({label:value,value})) },
          text("motivo","Motivo de consulta"), text("expectativas","¿Qué esperás de este proceso?"),
          { id:"actividades", label:"¿Qué actividades disfrutás?", type:"checkbox", required:false, options:["Dibujar","Escribir","Jugar","Otra"].map(value=>({label:value,value})) },
          text("comentario","¿Querés agregar algún comentario?",false)
        ]}
      ]
    }
  };
})();
