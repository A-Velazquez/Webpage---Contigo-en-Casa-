// Data base mock of medical announcements
const avisosMedicos = [
    {
        id: 1,
        categoria: "Rehabilitación",
        titulo: "Nuevos horarios para visitas domiciliarias en zona norte",
        mensaje: "Recordamos a las familias que las visitas de fisioterapia se reprogramaron.",
        doctor: "Dr. Alejandro Torres"
    },
    {
        id: 2,
        categoria: "Nutrición",
        titulo: "Entrega de suplementos alimenticios",
        mensaje: "La dotación mensual estará disponible en la sede del DIF municipal.",
        doctor: "Dra. Sofía Ramírez"
    }
];

// Controller to process the virtual medical office
exports.procesarConsultaIA = (req, res) => {
    const { nombre, categoria, descripcion } = req.body;

    if (!nombre || !categoria || !descripcion) {
        return res.status(400).json({ 
            error: "Faltan datos obligatorios (nombre, categoría o descripción)." 
        });
    }

    // this is temporary, the plan is to connect it to an ai api so the answers are personalized
    let respuestaIA = "";

    switch (categoria) {
        case 'rehabilitacion':
            respuetaIA = `Hola ${nombre}. Analizando tu duda de rehabilitación: Para problemas de movilidad en casa, se recomienda realizar movilizaciones suaves y evitar forzar articulaciones rígidas. Un especialista de INADEJ evaluará el caso para dar seguimiento domiciliario.`;
            break;
        case 'nutricion':
            respuetaIA = `Estimado(a) ${nombre}, referente a nutrición: Es fundamental mantener una adecuada hidratación y considerar los suplementos alimenticios especializados que contempla nuestro programa para evitar pérdida de masa muscular.`;
            break;
        case 'psicologia':
            respuetaIA = `Hola ${nombre}. Comprendemos el desgaste emocional que implica el cuidado diario. Te recordamos que el apoyo psicológico para cuidadores primarios es clave para reducir el estrés y la ansiedad.`;
            break;
        default:
            respuetaIA = `Hola ${nombre}. Hemos recibido tu consulta en INADEJ. Un especialista la revisará a la brevedad.`;
    }

    return res.status(200).json({
        exito: true,
        mensaje: "Consulta exitosa",
        nombrePaciente: nombre,
        area: categoria,
        respuestaIA: respuetaIA
    });
};

exports.obtenerAvisos = (req, res) => {
    return res.status(200).json(avisosMedicos);
};