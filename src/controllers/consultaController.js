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
        const systemInstruction = "Eres un asistente médico virtual empático del programa 'Contigo en Casa' de la organización INADEJ en Arandas, Jalisco. Atiendes a personas con problemas de movilidad y adultos mayores. Das orientaciones breves, prácticas y seguras de salud, recordando siempre que es una guía preliminar y no sustituye una consulta médica. No hagas preguntas de seguimiento ni hagas saludos o introducciones, solo da la orientación";

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


exports.obtenerAvisos = async (req, res) => {
    try {
        const apiKey = process.env.AI_API_KEY;

        if (!apiKey) {
            throw new Error("No hay API Key configurada en el .env");
        }

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

        const promptTip = "Actúa como un especialista médico dando un consejo de bienestar personal breve, de no más de dos líneas";

        const apiResponse = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptTip }]
                }]
            })
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error("Error devuelto por Gemini API:", errorBody);
            throw new Error("Error en la respuesta de Gemini");
        }

        const data = await apiResponse.json();
        const textoGenerado = data.candidates[0].content.parts[0].text;

        return res.status(200).json([
            {
                id: 1,
                categoria: "Consejo del Día",
                titulo: "Recomendación Médica",
                mensaje: textoGenerado.trim()
            }
        ]);

    } catch (error) {
        console.error("Error al generar tip dinámico con IA:", error.message);
        
        // Default
        return res.status(200).json([
            {
                id: 1,
                categoria: "Rehabilitación",
                titulo: "Tip de Movilización",
                mensaje: "Cambie de postura al paciente encamado frecuentemente para cuidar su piel y salud."
            }
        ]);
    }
};