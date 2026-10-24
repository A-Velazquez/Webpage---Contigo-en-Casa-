document.addEventListener('DOMContentLoaded', () => {
    const consultaForm = document.getElementById('consultaForm');
    const respuestaContainer = document.getElementById('respuestaContainer');
    const textoRespuesta = document.getElementById('textoRespuesta');
    const btnEnviar = document.getElementById('btnEnviar');

    consultaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombrePaciente').value;
        const categoria = document.getElementById('categoriaConsulta').value;
        const descripcion = document.getElementById('descripcionProblema').value;

        // Loader
        btnEnviar.disabled = true;
        btnEnviar.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Procesando con IA...`;
        textoRespuesta.textContent = "Conectando con la IA médica de INADEJ...";
        respuestaContainer.classList.remove('d-none');

        try {
            // Relative route (for render)
            const response = await fetch('/api/consultas', {
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
            textoRespuesta.textContent = "Ocurrió un problema al procesar la consulta. Por favor, asegúrate de que el servidor esté activo e intenta de nuevo.";
        } finally {
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = `<i class="bi bi-send-fill me-2"></i> Enviar consulta a la IA Médica`;
        }
    });
});