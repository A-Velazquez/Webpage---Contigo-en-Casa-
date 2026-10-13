document.addEventListener('DOMContentLoaded', () => {
    const consultaForm = document.getElementById('consultaForm');
    const respuestaContainer = document.getElementById('respuestaContainer');
    const textoRespuesta = document.getElementById('textoRespuesta');

    consultaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombrePaciente').value;
        const categoria = document.getElementById('categoriaConsulta').value;
        const descripcion = document.getElementById('descripcionProblema').value;

        textoRespuesta.textContent = "Conectando con la IA médica de INADEJ...";
        respuestaContainer.classList.remove('d-none');

        try {
            const response = await fetch('http://localhost:3000/api/consultas', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ nombre, categoria, descripcion })
            });

            if (!response.ok) {
                throw new Error("Error en la respuesta del servidor");
            }

            const data = await response.json();
            
            textoRespuesta.textContent = data.respuestaIA;

        } catch (error) {
            console.error("Error al conectar con la API:", error);
            textoRespuesta.textContent = "No se pudo conectar con el servidor local. Asegúrate de que tu servidor de Node.js esté encendido.";
        }
    });
});