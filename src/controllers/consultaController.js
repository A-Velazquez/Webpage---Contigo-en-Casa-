require('dotenv').config();

exports.procesarConsultaIA = async (req, res) => {
    const { nombre, categoria, descripcion } = req.body;

    // Inputs
    if (!nombre || !categoria || !descripcion) {
        return res.status(400).json({ 
            error: "Faltan datos obligatorios (nombre, categoría o descripción)." 
        });
    }

    try {
        // Instructions so gemini has a context
        const systemInstruction = "Eres un asistente médico virtual empático del programa 'Contigo en Casa' de la organización INADEJ en Arandas, Jalisco. Atiendes a personas con problemas de movilidad y adultos mayores. Das orientaciones breves, prácticas y seguras de salud, recordando siempre que es una guía preliminar y no sustituye una consulta médica.";

        // Create the message from the user
        const mensajeUsuario = `Hola, mi nombre es ${nombre}. Mi consulta es de la categoría de '${categoria}'. Mi duda o problema es: "${descripcion}".`;

        // Gemini api endpoint
        const apiKey = process.env.AI_API_KEY;
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

        const apiResponse = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: [{
                    parts: [{ text: mensajeUsuario }]
                }]
            })
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error("Detalle del error de Gemini:", errorData);
            throw new Error("Error en el servicio de Gemini API");
        }

        const data = await apiResponse.json();

        // Extract the answer
        const respuestaIA = data.candidates[0].content.parts[0].text;

        return res.status(200).json({
            exito: true,
            mensaje: "Consulta procesada correctamente con Gemini IA",
            respuestaIA: respuestaIA
        });

    } catch (error) {
        console.error("Error al procesar la IA:", error);
        return res.status(500).json({ 
            error: "Ocurrió un error interno al procesar la consulta con la inteligencia artificial." 
        });
    }
};

exports.obtenerAvisos = (req, res) => {
    return res.status(200).json([
        {
            id: 1,
            categoria: "Rehabilitación",
            titulo: "Nuevos horarios para visitas domiciliarias",
            mensaje: "Las visitas de fisioterapia se reprogramaron para los días martes.",
            doctor: "Dr. Alejandro Torres"
        }
    ]);
};