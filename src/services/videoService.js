/**
 * Servicio de la videoteca.
 *
 * Conecta la página con APIs públicas de video:
 *  - Internet Archive: catálogo curado + búsqueda libre (no necesita clave).
 *  - Pexels y Pixabay: se activan si hay clave en el entorno (opcionales).
 *
 * Todos los videos se devuelven en el mismo formato para que la página
 * no tenga que saber de dónde viene cada uno.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------
// Categorías de la videoteca
// ---------------------------------------------------------------
const CATEGORIAS = {
    terapia: { nombre: 'Masajes y Terapia', icono: 'bi-activity' },
    nutricion: { nombre: 'Nutrición', icono: 'bi-apple' },
    cuidador: { nombre: 'Para el Cuidador', icono: 'bi-heart' }
};

// Palabras que no queremos en los resultados de búsqueda libre
const PALABRAS_BLOQUEADAS = new RegExp(
    [
        'nsfw', 'nude', 'naked', 'porn', 'erotic', 'erotica', 'sexual', 'xxx',
        'hentai', 'masturbat\\w*', 'orgasm', 'penis', 'vagina', 'bdsm', 'escort',
        'strip\\w*', 'orgy', 'fetish', 'incest', 'cocaine', 'cannabis', 'meth',
        'suicide', 'murder', 'hitler', 'nazi', 'racis\\w*', 'slave', 'whore',
        'prostitut\\w*', 'hooker', 'lingerie', 'topless', 'bikini', 'kamasutra',
        'tantra', 'sensual', 'creampie', 'cumshot', 'blowjob', 'anal', 'thai massage'
    ].join('|'),
    'i'
);

// Los videos de las APIs públicas vienen con títulos en inglés,
// así que traducimos las palabras más comunes de la página.
const PALABRAS_TRADUCIDAS = {
    espalda: 'back pain spine',
    piernas: 'leg exercises mobility',
    movilidad: 'joint mobility exercises',
    articulaciones: 'joint mobility',
    rigidez: 'stiff joints stretching',
    estiramientos: 'stretching exercise',
    ejercicio: 'exercise health',
    masajes: 'massage therapy',
    masaje: 'massage therapy',
    fisioterapia: 'physiotherapy rehabilitation',
    terapia: 'therapy rehabilitation',
    higiene: 'personal hygiene',
    alimentacion: 'nutrition food',
    nutricion: 'nutrition food vitamins',
    vitaminas: 'vitamins food',
    dieta: 'diet nutrition',
    hydratacion: 'water hydration',
    agua: 'water drinking'
};

// Solo mostramos videos que tienen que ver con los cuidados.
// Así evitamos que aparezcan películas, series o anuncios que no son del tema.
const PALABRAS_DE_CUIDADO =
    /\b(nursing|nurse|caregivers?|therapy|therapist|rehabilitation|massage|elderly|seniors?|geriatrics?|dementia|alzheimer|patients?|first aid|wheelchair|walker|nutrition|vitamins?|hydration|dysphagia|swallow|wellness|wellbeing|hospice|arthritis|mobility|joints?|balance|falls?|stretching|physiotherapy|injur\w*|spine|hip|knee|hygiene|nursing home)\b/i;

// Títulos que no tienen que ver con los cuidados (películas, series, anuncios)
const PALABRAS_NO_CUIDADO =
    /lavadora|washer|temporada|season|netflix|pelicula|movie|episode|trailer|comercial|commercial|anime|komi|hentai|full movie|official trailer|ribbon cutting|promo|grand opening|advertisement|concert|gameplay/i;

// ---------------------------------------------------------------
// Catálogo curado de Internet Archive (textos en español)
// ---------------------------------------------------------------
const CATALOGO_CURADO = [
    // --- Masajes y terapia ---
    {
        id: 'LIFEINMOTIONGeriatricCarePhysiotherapy',
        categoria: 'terapia',
        titulo: 'LIFE IN MOTION: Cuidados Geriátricos y Fisioterapia',
        descripcion: 'Guía de HelpAge India sobre cuidados geriátricos y fisioterapia para que las personas mayores vivan de forma independiente y con dignidad.',
        etiquetas: ['fisioterapia', 'adultos mayores', 'movilidad', 'geriatría']
    },
    {
        id: 'aruntvmd-R.O.V.E.R.S._Presents_-_Joint_Mobility_Exercises',
        categoria: 'terapia',
        titulo: 'Movilidad Articular: Ejercicios para las Articulaciones',
        descripcion: 'Rutina diaria de movilidad articular del Departamento de Envejecimiento y Discapacidades de Maryland, pensada para mantener las articulaciones flexibles sin salir de casa.',
        etiquetas: ['movilidad', 'articulaciones', 'estiramientos', 'adultos mayores']
    },
    {
        id: 'aruntvmd-R.O.V.E.R.S._Presents_-_VHA_Whole_Health_Joint_Mobility_Exercise',
        categoria: 'terapia',
        titulo: 'Movilidad Articular: Ejercicios de Salud Integral',
        descripcion: 'Sesión de ejercicios de movilidad articular dentro del programa de salud integral para adultos mayores.',
        etiquetas: ['movilidad', 'articulaciones', 'salud integral']
    },
    {
        id: '543-hd',
        categoria: 'terapia',
        titulo: 'Yoga y Movilidad para Articulaciones Rígidas',
        descripcion: 'Clase de 30 minutos de yoga suave para ganar movilidad en coyunturas rígidas: puente, rodilla al pecho, gato, guerrero y montaña.',
        etiquetas: ['yoga', 'movilidad', 'rigidez', 'articulaciones']
    },
    {
        id: 'KneeArthritisExercise',
        categoria: 'terapia',
        titulo: 'Ejercicio para la Artritis de la Rodilla',
        descripcion: 'Rutina de yoga diario con ejercicios que ayudan a aliviar el dolor y la rigidez de la artritis en las rodillas.',
        etiquetas: ['artritis', 'rodilla', 'dolor', 'yoga']
    },
    {
        id: 'morning-stretch-1984-exercise-joanie-greggains-host',
        categoria: 'terapia',
        titulo: 'Estiramientos Matutinos',
        descripcion: 'Rutina guiada de estiramientos para empezar el día con el cuerpo suelto y sin rigidez.',
        etiquetas: ['estiramientos', 'rutina', 'flexibilidad']
    },
    {
        id: 'citiohv-Natural_Solutions_for_Relieving_Arthritis_Low_Back_Pain',
        categoria: 'terapia',
        titulo: 'Soluciones Naturales para el Dolor de Espalda y la Artritis',
        descripcion: 'El Dr. Buchanan explica cinco soluciones naturales y económicas para aliviar el dolor de espalda y la artritis.',
        etiquetas: ['espalda', 'artritis', 'dolor', 'cuidado natural']
    },
    {
        id: 'mctvmi-Ask_the_Chiropractor_Massage_Therapy_and_Exercise',
        categoria: 'terapia',
        titulo: 'Terapia de Masaje y Ejercicio',
        descripcion: 'El programa Ask the Chiropractor habla de la terapia de masaje y del ejercicio como aliados del cuidado diario.',
        etiquetas: ['masaje', 'terapia', 'ejercicio']
    },
    {
        id: 'basic-clinical-massage-therapy',
        archivo: 'CLINICAL MASSAGE Ch10.Leg,Ankle,Foot.ia.mp4',
        categoria: 'terapia',
        titulo: 'Masaje y Movilización de Piernas para Adultos Mayores',
        descripcion: 'Clase de masaje clínico dedicada a piernas, tobillo y pie: técnicas para mejorar la circulación y reducir la rigidez sin salir de casa.',
        etiquetas: ['masaje', 'piernas', 'movilización', 'circulación', 'adultos mayores']
    },
    {
        id: 'basic-clinical-massage-therapy',
        archivo: 'CLINICAL MASSAGE Ch07.Lower Back,Abdomen.ia.mp4',
        categoria: 'terapia',
        titulo: 'Masaje Clínico: Espalda Baja y Abdomen',
        descripcion: 'Clase de masaje clínico donde se explican la anatomía y las técnicas de trabajo en la zona lumbar y abdominal.',
        etiquetas: ['masaje', 'masaje clínico', 'espalda', 'abdomen']
    },
    {
        id: 'Massage_Therapy_10-11-17',
        categoria: 'terapia',
        titulo: 'Terapia de Masaje: Conversación con un Profesional',
        descripcion: 'Entrevista con una masajista profesional sobre su oficio, los cuidados del cuerpo y el trabajo con pacientes.',
        etiquetas: ['masaje', 'terapia', 'profesional de la salud']
    },
    {
        id: 'natural-massage-therapy',
        categoria: 'terapia',
        titulo: 'Masaje Natural',
        descripcion: 'Sesión de masaje natural para relajar el cuerpo y favorizar la circulación de las piernas.',
        etiquetas: ['masaje', 'relajación', 'circulación']
    },
    {
        id: 'basicbackmassagetherapy',
        categoria: 'terapia',
        titulo: 'Masaje Básico de Espalda',
        descripcion: 'Guía de masaje para la espalda con técnicas sencillas que se pueden aplicar en casa con apoyo.',
        etiquetas: ['masaje', 'espalda', 'técnicas']
    },
    {
        id: 'Exercise1949',
        categoria: 'terapia',
        titulo: 'Ejercicio y Salud',
        descripcion: 'Película educativa de 1949 de dominio público que explica cómo el ejercicio melhora la salud y el bienestar.',
        etiquetas: ['ejercicio', 'salud', 'dominio público']
    },

    // --- Nutrición ---
    {
        id: 'FoodAndNutrition',
        categoria: 'nutricion',
        titulo: 'Alimentos y Nutrición',
        descripcion: 'Muestra cómo se distribuyen por el cuerpo los carbohidratos, las grasas, las proteínas, los minerales y las vitaminas.',
        etiquetas: ['nutrición', 'vitaminas', 'proteínas', 'alimentos']
    },
    {
        id: 'wexler-films-vitamins-from-food',
        categoria: 'nutricion',
        titulo: 'Vitaminas en los Alimentos',
        descripcion: 'De dónde obtenemos las vitaminas que necesita el organismo y por qué conviene una dieta variada.',
        etiquetas: ['vitaminas', 'alimentos', 'dieta']
    },
    {
        id: 'NutritionAllAmericanMeal',
        categoria: 'nutricion',
        titulo: 'Nutrición: La Comida Norteamericana',
        descripcion: 'Analiza la hamburguesa, las papas fritas y los refrescos, y explica los problemas de la comida rápida para la salud.',
        etiquetas: ['nutrición', 'dieta', 'comida rápida', 'hábitos']
    },
    {
        id: 'WartimeN1943',
        categoria: 'nutricion',
        titulo: 'Nutrición en Tiempos de Guerra',
        descripcion: 'El papel de las agencias de bienestar social en la alimentación de las familias y su efecto en la salud.',
        etiquetas: ['nutrición', 'alimentos', 'bienestar']
    },
    {
        id: '200716_Citrus_in_Nutrition',
        categoria: 'nutricion',
        titulo: 'Cítricos en la Nutrición',
        descripcion: 'Beneficios nutrimentales de los citrus y su historia para prevenir el escorbuto en los barcos.',
        etiquetas: ['nutrición', 'cítricos', 'vitaminas', 'frutas']
    },
    {
        id: 'water-friend-or-enemy',
        categoria: 'nutricion',
        titulo: 'Agua: ¿Amiga o Enemiga?',
        descripcion: 'Corto animado de Disney de 1943 sobre la importancia de beber agua todos los días.',
        etiquetas: ['hidratación', 'agua', 'animación']
    },

    // --- Para el cuidador ---
    {
        id: 'youtube-SWZpN4LiPBo',
        categoria: 'cuidador',
        titulo: 'Cómo Transferir a un Paciente de la Cama a la Silla de Ruedas',
        descripcion: 'Pasos a seguir para mover a un paciente de la cama a la silla de ruedas con ayuda y sin lastimarse.',
        etiquetas: ['transferencia', 'cama', 'silla de ruedas', 'movimiento seguro']
    },
    {
        id: '5360-MCDHWellnessLectureBackInjuryPreventionandTreatment',
        categoria: 'cuidador',
        titulo: 'Prevención y Tratamiento de Lesiones de la Espalda',
        descripcion: 'Charla del Dr. Michael Mortenson sobre cómo prevenir y tratar las lesiones de espalda, clave para el cuidador.',
        etiquetas: ['espalda', 'ergonomía', 'prevención', 'cuidador']
    },
    {
        id: 'Family_Caregiver_Series_-_The_Mechanics_of_Caregiving_-_Personal_Care_and_Equipment',
        categoria: 'cuidador',
        titulo: 'Mecánica del Cuidado: Higiene Personal y Equipo',
        descripcion: 'Serie de cuidados en el hogar: cómo dar el baño en la cama, la higiene bucal y los cambios de posición.',
        etiquetas: ['higiene', 'baño en cama', 'equipo', 'cuidado en casa']
    },
    {
        id: 'Family_Caregiver_Series_-_The_Challenges_and_Rewards_of_Caregiving',
        categoria: 'cuidador',
        titulo: 'Retos y Recompensas del Cuidado',
        descripcion: 'Una trabajadora social explica los retos emocionales del cuidado y las formas de sobrellevarlos.',
        etiquetas: ['cuidador', 'emociones', 'apoyo', 'bienestar']
    },
    {
        id: 'Family_Caregiver_Series_-_Resources_for_Caregivers',
        categoria: 'cuidador',
        titulo: 'Recursos para Cuidadores',
        descripcion: 'Dónde encontrar apoyo, servicios y orientación para cuidar a un familiar con enfermedad grave.',
        etiquetas: ['cuidador', 'recursos', 'red de apoyo']
    },
    {
        id: 'the-educated-caregiver-vol-2',
        archivo: 'VTS_01_1.mp4',
        categoria: 'cuidador',
        titulo: 'El Cuidador Preparado: Habilidades Prácticas',
        descripcion: 'Baño en la cama, higiene bucal, cambio de sábana con el paciente, transferencias seguras y señales de alarma.',
        etiquetas: ['cuidador', 'higiene', 'transferencias', 'habilidades']
    },
    {
        id: 'NursingCareOfTheSickandInjured',
        categoria: 'cuidador',
        titulo: 'Cuidados de Enfermería para Enfermos y Lesionados',
        descripcion: 'Cuidados generales del enfermo y atención a largo plazo de las lesiones en el hogar.',
        etiquetas: ['enfermería', 'cuidados', 'paciente']
    },
    {
        id: 'Nursing1942',
        categoria: 'cuidador',
        titulo: 'Enfermería: Una Carrera de Servicio',
        descripcion: 'Película de 1942 de dominio público que presenta la enfermería como una carrera de servicio.',
        etiquetas: ['enfermería', 'profesional', 'dominio público']
    },
    {
        id: 'Aging_in_Place_A_Review_of_Home_Care',
        categoria: 'cuidador',
        titulo: 'Envejecer en Casa: Una Revisión del Cuidado en el Hogar',
        descripcion: 'Conferencia sobre el cuidado domiciliario y las opciones para seguir viviendo en casa.',
        etiquetas: ['envejecer en casa', 'cuidado domiciliario', 'adultos mayores']
    },
    {
        id: 'cg_0130-Fall_Prevention_101_for_Older_Adults',
        categoria: 'cuidador',
        titulo: 'Prevención de Caídas 101 para Adultos Mayores',
        descripcion: 'Una enfermera gerontóloga explica los riesgos de caída y qué puede hacer el cuidador para prevenirlas en casa.',
        etiquetas: ['caídas', 'prevención', 'seguridad', 'cuidador']
    },
    {
        id: 'Mature_Matters_-_Balance_and_Fall_Prevention',
        categoria: 'cuidador',
        titulo: 'Equilibrio y Prevención de Caídas',
        descripcion: 'Los kinesiólogos explican cómo el trabajo de equilibrio reduce el riesgo de caídas en adultos mayores.',
        etiquetas: ['equilibrio', 'caídas', 'kinesiología']
    },
    {
        id: 'Preventing_falls_at_home',
        categoria: 'cuidador',
        titulo: 'Prevención de Caídas en Casa',
        descripcion: 'Taller en un centro para adultos mayores con consejos para evitar accidentes por caídas dentro del hogar.',
        etiquetas: ['caídas', 'hogar', 'prevención', 'seguridad']
    },
    {
        id: 'Firstaidlifesavingandresuscitation-wellcome',
        categoria: 'cuidador',
        titulo: 'Primeros Auxilios, Rescate y Reanimación',
        descripcion: 'Demostración de las técnicas de rescate, reanimación y uso del inhalador en caso de intoxicación.',
        etiquetas: ['primeros auxilios', 'reanimación', 'rescate', 'emergencia']
    },
    {
        id: 'Personal1950',
        categoria: 'cuidador',
        titulo: 'Higiene Personal (Parte I)',
        descripcion: 'Película de 1942 de dominio público sobre los hábitos de higiene personal en la vida diaria.',
        etiquetas: ['higiene', 'hábitos', 'dominio público']
    },
    {
        id: 'general_personal_hygiene',
        categoria: 'cuidador',
        titulo: 'Higiene Personal General',
        descripcion: 'Explicación de los cuidados diarios de la higiene personal y de cómo influyen en la salud.',
        etiquetas: ['higiene', 'cuidados diarios', 'salud']
    },
    {
        id: 'teeth_lesson_in_health_hygiene',
        categoria: 'cuidador',
        titulo: 'Dientes: Salud e Higiene',
        descripcion: 'Clase práctica sobre el cuidado de los dientes y la higiene de la boca.',
        etiquetas: ['salud bucal', 'dientes', 'higiene']
    },
    {
        id: 'hpact-The_Golden_Years_Ep_10_Home_Safety',
        categoria: 'cuidador',
        titulo: 'Hogar Seguro para Personas Mayores',
        descripcion: 'Cómo adaptar una casa para que sea segura y cómoda para una persona mayor.',
        etiquetas: ['hogar', 'adaptaciones', 'seguridad', 'adultos mayores']
    },
    {
        id: 'uxctvma-Uxbridge_Senior_Center_Presents_-_Home_Safety_Tips_More',
        categoria: 'cuidador',
        titulo: 'Consejos de Seguridad en el Hogar',
        descripcion: 'Tips de seguridad doméstica dados por la policía local para adultos mayores.',
        etiquetas: ['seguridad', 'hogar', 'consejos']
    },
    {
        id: 'gov.dod.dimoc.25884',
        categoria: 'cuidador',
        titulo: 'Introducción a la Terapia Ocupacional',
        descripcion: 'Casos que ilustran el valor y los principios de la terapia ocupacional en la vida diaria.',
        etiquetas: ['terapia ocupacional', 'autonomía', 'actividades']
    },
    {
        id: 'gov.dod.dimoc.30476',
        categoria: 'cuidador',
        titulo: 'Terapia Ocupacional en la Sala de Enfermería',
        descripcion: 'Por qué el personal de enfermería debe dejar que el paciente se vista y se asee por sí mismo.',
        etiquetas: ['terapia ocupacional', 'enfermería', 'autonomía']
    },
    {
        id: 'AH-Our_Journey_Together-Best_Friends_Approach_to_Dementia_Care',
        categoria: 'cuidador',
        titulo: 'Cuidado de la Demencia: Enfoque de Mejores Amigos',
        descripcion: 'Cómo acompañar día a día a personas con Alzheimer desde el respeto y la cercanía.',
        etiquetas: ['demencia', 'alzheimer', 'cuidador', 'conducta']
    },
    {
        id: 'Dementia_Care_-_What_s_Happening_Inside_the_Brain_and_How_Best_to_Connect_With_Your_Loved_One',
        categoria: 'cuidador',
        titulo: 'Cuidado de la Demencia: Qué Pasa en el Cerebro',
        descripcion: 'Serie de charlas sobre el cuidado de la demencia y la mejor forma de conectar con el familiar.',
        etiquetas: ['demencia', 'alzheimer', 'comunicación']
    },
    {
        id: 'youtube-H4S1Afq4fps',
        categoria: 'cuidador',
        titulo: 'Ejercicios para Fortalecer la Deglución',
        descripcion: 'Serie de ejercicios de deglución recomendados por el hospital para pacientes con problemas al comer.',
        etiquetas: ['deglución', 'alimentación', 'paciente']
    }
];

// ---------------------------------------------------------------
// Cache en memoria de los videos ya consultados
// ---------------------------------------------------------------
const cacheVideos = new Map();
const DURACION_CACHE = 6 * 60 * 60 * 1000; // 6 horas

// ---------------------------------------------------------------
// Utilidades pequeñas
// ---------------------------------------------------------------

// Quita etiquetas HTML y deja el texto limpio
function limpiarTexto(texto) {
    if (!texto) {
        return '';
    }

    return String(texto)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Convierte "10:41" o "0:16:00" en segundos
function aSegundos(valor) {
    if (valor === undefined || valor === null || valor === '') {
        return 0;
    }

    if (typeof valor === 'number') {
        return valor;
    }

    const partes = String(valor).split(':').map((parte) => parseFloat(parte));

    if (partes.some((parte) => Number.isNaN(parte))) {
        return 0;
    }

    return partes.reduce((total, parte) => total * 60 + parte, 0);
}

// Muestra la duración en formato "8:45" o "1:02:30"
function formatearDuracion(segundos) {
    if (!segundos || segundos < 0) {
        return null;
    }

    const total = Math.round(segundos);
    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const segundosFinales = total % 60;

    if (horas > 0) {
        return `${horas}:${String(minutos).padStart(2, '0')}:${String(segundosFinales).padStart(2, '0')}`;
    }

    return `${minutos}:${String(segundosFinales).padStart(2, '0')}`;
}

// Arma la URL de descarga de un archivo de Internet Archive
function urlDescarga(identificador, nombreArchivo) {
    const ruta = String(nombreArchivo)
        .split('/')
        .map((parte) => encodeURIComponent(parte))
        .join('/');

    return `https://archive.org/download/${identificador}/${ruta}`;
}

// Elige el mejor archivo de video para reproducir en la web
function elegirArchivoVideo(archivos) {
    const candidatos = (archivos || [])
        .filter((archivo) => /\.(mp4|m4v)$/i.test(archivo.name || ''))
        .filter((archivo) => Number(archivo.size || 0) > 2_000_000)
        .filter((archivo) => Number(archivo.length || 0) > 15);

    if (candidatos.length === 0) {
        return null;
    }

    // Preferimos los formatos ligeros para la web
    const prioridad = {
        '512kb mpeg4': 0,
        'h.264': 1,
        'h.264 ia': 2,
        'mpeg4': 3,
        'h.264 sd': 4,
        'h.264 hd': 5,
        'm4v': 6
    };

    candidatos.sort((a, b) => {
        const diferencia = (prioridad[a.format] ?? 9) - (prioridad[b.format] ?? 9);

        if (diferencia !== 0) {
            return diferencia;
        }

        // En empates gana el archivo más largo (partes de una misma película)
        return Number(b.length || 0) - Number(a.length || 0);
    });

    return candidatos[0];
}

// Saca las palabras clave de un texto (para buscar y filtrar)
function palabrasClave(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita los acentos
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((palabra) => palabra.length > 2);
}

// ---------------------------------------------------------------
// Internet Archive
// ---------------------------------------------------------------

// Pide los metadatos de un video en Internet Archive
async function pedirMetadatosInternetArchive(identificador) {
    const respuesta = await fetch(
        `https://archive.org/metadata/${encodeURIComponent(identificador)}`,
        { headers: { Accept: 'application/json' } }
    );

    if (!respuesta.ok) {
        throw new Error(`Internet Archive respondió ${respuesta.status}`);
    }

    return respuesta.json();
}

// Pide los metadatos pero reintentando si el servidor se satura
async function pedirMetadatosConReintento(identificador) {
    for (let intento = 1; intento <= 3; intento++) {
        try {
            return await pedirMetadatosInternetArchive(identificador);
        } catch (error) {
            if (intento === 3) {
                throw error;
            }

            // Esperamos un poquito y volvemos a intentar
            await new Promise((resolver) => setTimeout(resolver, 400 * intento));
        }
    }
}

// Convierte los metadatos de Internet Archive al formato de la videoteca
function normalizarInternetArchive(identificador, metadatos, curado) {
    const datos = metadatos.metadata || {};

    // Si el catálogo dice qué archivo usar, lo buscamos por su nombre
    let archivo = null;

    if (curado && curado.archivo) {
        archivo = (metadatos.files || []).find((item) => item.name === curado.archivo);
    }

    if (!archivo) {
        archivo = elegirArchivoVideo(metadatos.files || []);
    }

    const duracion = archivo
        ? Number(archivo.length || 0)
        : aSegundos(datos.runtime);

    // Cada archivo tiene su propio id para no repetir el mismo video
    const id = curado && curado.archivo
        ? `ia:${identificador}::${curado.archivo}`
        : `ia:${identificador}`;

    return {
        id,
        titulo: (curado && curado.titulo) || limpiarTexto(datos.title) || identificador,
        descripcion:
            (curado && curado.descripcion) ||
            limpiarTexto(datos.description) ||
            'Video de cuidados disponible en Internet Archive.',
        categoria: (curado && curado.categoria) || inferirCategoria(`${datos.title} ${datos.subject}`),
        etiquetas: (curado && curado.etiquetas) || [],
        duracionSegundos: Math.round(duracion),
        duracion: formatearDuracion(duracion),
        miniatura: `https://archive.org/services/img/${identificador}`,
        videoUrl: archivo ? urlDescarga(identificador, archivo.name) : null,
        embedUrl: `https://archive.org/embed/${identificador}`,
        pagina: `https://archive.org/details/${identificador}`,
        fuente: 'Internet Archive',
        autor: limpiarTexto(datos.creator) || 'Internet Archive',
        licencia: datos.licenseurl || 'Consulta la licencia en Internet Archive',
        anio: datos.year || null
    };
}

// Deduce la categoría según las palabras del título
function inferirCategoria(texto) {
    const palabras = palabrasClave(texto).join(' ');

    if (/nutricion|alimento|comida|vitamina|dieta|agua|fruta|higiene/.test(palabras)) {
        return 'nutricion';
    }

    if (/masaje|fisioterapia|movilidad|estiramiento|articulacion|ejercicio|yoga|rehabilitacion/.test(palabras)) {
        return 'terapia';
    }

    return 'cuidador';
}

// Temas ya revisados para buscar en Internet Archive.
// Cada tema trae las palabras con las que el usuario puede escribirlo en español.
const TEMAS_BUSQUEDA = [
    { claves: ['nursing', 'enfermeria', 'enfermero', 'enfermera'], consulta: 'nursing care', categoria: 'cuidador' },
    { claves: ['higiene', 'hygiene', 'bano', 'aseo'], consulta: 'personal hygiene', categoria: 'cuidador' },
    { claves: ['caida', 'caidas', 'balance', 'equilibrio'], consulta: 'fall prevention', categoria: 'cuidador' },
    { claves: ['primeros', 'auxilios', 'rescate', 'urgencia'], consulta: 'first aid', categoria: 'cuidador' },
    { claves: ['demencia', 'alzheimer'], consulta: 'dementia care', categoria: 'cuidador' },
    { claves: ['fisioterapia', 'fisiatra', 'terapia'], consulta: 'physical therapy', categoria: 'terapia' },
    { claves: ['movilidad', 'articulacion', 'articulaciones', 'estiramiento', 'estiramientos'], consulta: 'joint mobility exercise', categoria: 'terapia' },
    { claves: ['masaje', 'masajes'], consulta: 'massage therapy', categoria: 'terapia' },
    { claves: ['nutricion', 'vitaminas', 'dieta', 'alimento', 'alimentos'], consulta: 'nutrition food', categoria: 'nutricion' },
    { claves: ['agua', 'hidratacion'], consulta: 'water drinking health', categoria: 'nutricion' }
];

// Busca los temas que tienen que ver con lo que escribió el usuario
function buscarTemas(termino) {
    const palabras = palabrasClave(termino);

    if (palabras.length === 0) {
        return [];
    }

    return TEMAS_BUSQUEDA.filter((tema) =>
        tema.claves.some((clave) => palabras.some((palabra) => palabra === clave || clave.startsWith(palabra)))
    );
}

// Busca videos en Internet Archive (búsqueda por título)
async function buscarEnInternetArchive(consulta) {
    const query = `title:("${consulta}") AND mediatype:(movies) AND NOT subject:(erotic OR nsfw OR porn)`;
    const url =
        'https://archive.org/advancedsearch.php?q=' +
        encodeURIComponent(query) +
        '&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=description&fl%5B%5D=subject&fl%5B%5D=year' +
        '&rows=20&page=1&output=json';

    const respuesta = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!respuesta.ok) {
        throw new Error(`La búsqueda en Internet Archive falló (${respuesta.status})`);
    }

    const datos = await respuesta.json();
    const encontrados = (datos.response && datos.response.docs) || [];

    return encontrados
        .filter((item) => !PALABRAS_BLOQUEADAS.test(`${item.title} ${item.subject} ${item.description || ''}`))
        .filter((item) => PALABRAS_DE_CUIDADO.test(`${item.title || ''}`))
        .filter((item) => !PALABRAS_NO_CUIDADO.test(`${item.title || ''}`))
        .slice(0, 6);
}

// Carga el catálogo curado (usando el archivo local si ya existe)
async function cargarCatalogoCurado() {
    const catalogo = [];

    // Vamos de cinco en cinco para no saturar el servidor de Internet Archive
    const tamanhoLote = 5;

    for (let inicio = 0; inicio < CATALOGO_CURADO.length; inicio += tamanhoLote) {
        const parte = CATALOGO_CURADO.slice(inicio, inicio + tamanhoLote);

        const resultados = await Promise.all(
            parte.map(async (curado) => {
                try {
                    const metadatos = await pedirMetadatosConReintento(curado.id);
                    return normalizarInternetArchive(curado.id, metadatos, curado);
                } catch (error) {
                    console.error(`No se pudo cargar el video ${curado.id}:`, error.message);
                    return null;
                }
            })
        );

        catalogo.push(...resultados.filter((video) => video && video.videoUrl));
    }

    return catalogo;
}

// Si la API está caída, usamos el archivo JSON guardado en public/data
function leerCatalogoLocal() {
    const ruta = path.join(__dirname, '..', '..', 'public', 'data', 'videos.json');

    if (!fs.existsSync(ruta)) {
        return null;
    }

    try {
        const contenido = fs.readFileSync(ruta, 'utf8');
        const datos = JSON.parse(contenido);

        if (!Array.isArray(datos.videos)) {
            return null;
        }

        // Ignoramos los videos que ya no tienen archivo reproducible
        return datos.videos.filter((video) => video && video.videoUrl);
    } catch (error) {
        console.error('No se pudo leer el catálogo local:', error.message);
        return null;
    }
}

// Devuelve el catálogo curado completo (de la caché, de la API o del archivo local)
async function obtenerCatalogo() {
    if (cacheVideos.size > 0) {
        return Array.from(cacheVideos.values());
    }

    const local = leerCatalogoLocal();

    // Si ya tenemos el catálogo guardado, lo usamos de inmediato
    if (local && local.length > 0) {
        local.forEach((video) => cacheVideos.set(video.id, video));

        // Y en segundo plano(actualizamos los datos con la API)
        refrescarCatalogo().catch((error) =>
            console.error('No se pudo refrescar el catálogo:', error.message)
        );

        return local;
    }

    const catalogo = await cargarCatalogoCurado();

    catalogo.forEach((video) => cacheVideos.set(video.id, video));

    return catalogo;
}

// Vuelve a consultar Internet Archive para tener los datos frescos
async function refrescarCatalogo() {
    const catalogo = await cargarCatalogoCurado();

    catalogo.forEach((video) => cacheVideos.set(video.id, video));

    return catalogo;
}

// ---------------------------------------------------------------
// Pexels (opcional: necesita PEXELS_API_KEY)
// ---------------------------------------------------------------
async function buscarEnPexels(termino) {
    const clave = process.env.PEXELS_API_KEY;

    if (!clave) {
        return [];
    }

    // Si el usuario escribe en español, buscamos también la palabra en inglés
    const traducciones = palabrasClave(termino)
        .map((palabra) => PALABRAS_TRADUCIDAS[palabra])
        .filter(Boolean);

    const busqueda = traducciones.length > 0 ? traducciones.join(' ') : termino;

    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(busqueda)}&per_page=12&locale=es-MX`;
    const respuesta = await fetch(url, { headers: { Authorization: clave } });

    if (!respuesta.ok) {
        throw new Error(`Pexels respondió ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    return (datos.videos || [])
        .filter((video) => !PALABRAS_BLOQUEADAS.test(video.url || ''))
        .map((video) => {
            const archivos = (video.video_files || []).filter((archivo) => archivo.file_type === 'video/mp4');
            const hd = archivos.find((archivo) => archivo.quality === 'hd');
            const elegido = hd || archivos[0];

            return {
                id: `pexels:${video.id}`,
                titulo: video.url || 'Video de cuidados',
                descripcion: `Video de stock gratuito de Pexels${video.user ? `, subido por ${video.user.name}` : ''}.`,
                categoria: inferirCategoria(`${video.url} ${(video.tags || []).join(' ')}`),
                etiquetas: [],
                duracionSegundos: Math.round(video.duration || 0),
                duracion: formatearDuracion(video.duration),
                miniatura: video.image || '',
                videoUrl: elegido ? elegido.link : null,
                embedUrl: elegido ? elegido.link : null,
                pagina: video.url,
                fuente: 'Pexels',
                autor: video.user ? video.user.name : 'Pexels',
                licencia: 'Gratis para uso libre (Pexels)',
                anio: null
            };
        });
}

// ---------------------------------------------------------------
// Pixabay (opcional: necesita PIXABAY_API_KEY)
// ---------------------------------------------------------------
async function buscarEnPixabay(termino) {
    const clave = process.env.PIXABAY_API_KEY;

    if (!clave) {
        return [];
    }

    const url = `https://pixabay.com/api/videos/?key=${clave}&q=${encodeURIComponent(termino)}&per_page=12&safesearch=true`;
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error(`Pixabay respondió ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    return (datos.hits || []).map((video) => ({
        id: `pixabay:${video.id}`,
        titulo: `Video de ${(video.tags || []).join(', ')}`,
        descripcion: `Video de stock gratuito de Pixabay${video.user ? `, subido por ${video.user}` : ''}.`,
        categoria: inferirCategoria((video.tags || []).join(' ')),
        etiquetas: video.tags || [],
        duracionSegundos: Math.round(video.duration || 0),
        duracion: formatearDuracion(video.duration),
        miniatura: video.videos && video.videos.medium ? video.videos.medium.url : '',
        videoUrl: video.videos && video.videos.large ? video.videos.large.url : null,
        embedUrl: video.videos && video.videos.large ? video.videos.large.url : null,
        pagina: video.pageURL,
        fuente: 'Pixabay',
        autor: video.user || 'Pixabay',
        licencia: 'Gratis para uso libre (Pixabay)',
        anio: null
    }));
}

// ---------------------------------------------------------------
// Filtrado (esto es lo que usa la página)
// ---------------------------------------------------------------

// Revisa si un video coincide con el texto buscado
function coincideConTexto(video, texto) {
    if (!texto) {
        return true;
    }

    const palabras = palabrasClave(texto);

    if (palabras.length === 0) {
        return true;
    }

    const info = palabrasClave(
        `${video.titulo} ${video.descripcion} ${(video.etiquetas || []).join(' ')} ${video.fuente}`
    ).join(' ');

    // Basta con que una de las palabras aparezca
    return palabras.some((palabra) => info.includes(palabra));
}

// Función principal: devuelve los videos filtrados
async function obtenerVideos({ consulta = '', categoria = 'todos' } = {}) {
    const catalogo = await obtenerCatalogo();
    const termino = String(consulta || '').trim();

    let videos = catalogo.filter((video) => {
        const coincideCategoria =
            categoria === 'todos' || categoria === 'sin filtro' || video.categoria === categoria;

        return coincideCategoria && coincideConTexto(video, termino);
    });

    // Si el usuario escribió algo, también buscamos en las APIs públicas
    if (termino) {
        const externos = await buscarExternos(termino);

        const yaTenemos = new Set(videos.map((video) => video.id));

        externos.forEach((video) => {
            const coincideCategoria =
                categoria === 'todos' || categoria === 'sin filtro' || video.categoria === categoria;

            // Los videos que vienen de las APIs ya vinieron filtrados por la búsqueda,
            // así que aquí solo revisamos que no se repitan y que sí sean de la categoría.
            if (!yaTenemos.has(video.id) && coincideCategoria) {
                videos.push(video);
            }
        });
    }

    return videos;
}

// Busca en las APIs externas y junta los resultados
async function buscarExternos(termino) {
    const resultados = [];
    const errores = [];

    // En Internet Archive buscamos con los temas ya revisados
    const temas = buscarTemas(termino);

    const consultas = [
        ...temas.map((tema) => [
            `Internet Archive (${tema.consulta})`,
            async () => {
                const crudos = await buscarEnInternetArchive(tema.consulta);

                // Le ponemos la categoría del tema
                return crudos.map((crudo) => ({ ...crudo, categoriaTema: tema.categoria }));
            }
        ]),
        ['Pexels', () => buscarEnPexels(termino)],
        ['Pixabay', () => buscarEnPixabay(termino)]
    ];
    const respuestas = await Promise.all(
        consultas.map(async ([nombre, buscar]) => {
            try {
                const datos = await buscar();
                return { nombre, datos };
            } catch (error) {
                errores.push(`${nombre}: ${error.message}`);
                return { nombre, datos: [] };
            }
        })
    );

    respuestas.forEach(({ datos }) => {
        datos.forEach((item) => resultados.push(item));
    });

    if (errores.length > 0) {
        console.warn('Búsqueda parcial en las APIs públicas ->', errores.join(' | '));
    }

    // Completamos los datos de los videos externos de Internet Archive
    const externos = [];
    for (const video of resultados) {
        // Los resultados de Internet Archive vienen "crudos", hay que completarlos
        if (video.identifier) {
            try {
                const metadatos = await pedirMetadatosConReintento(video.identifier);
                const normalizado = normalizarInternetArchive(video.identifier, metadatos, null);

                // Si el video es de un tema, usamos la categoría de ese tema
                if (video.categoriaTema) {
                    normalizado.categoria = video.categoriaTema;
                    normalizado.etiquetas = [video.categoriaTema, 'internet archive'];
                }

                externos.push(normalizado);
            } catch (error) {
                console.error(`No se pudo completar el video ${video.identifier}:`, error.message);
            }
        } else {
            externos.push(video);
        }
    }

    return externos;
}

module.exports = {
    CATEGORIAS,
    CATALOGO_CURADO,
    obtenerVideos,
    refrescarCatalogo,
    formatearDuracion
};
