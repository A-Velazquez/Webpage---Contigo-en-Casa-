/**
 * Genera el archivo public/data/videos.json
 *
 * Ese archivo guarda una copia del catálogo de videos que viene de las APIs
 * públicas. La página lo usa como respaldo cuando el servidor Node no está
 * encendido, para que el filtrado siempre funcione.
 *
 * Cómo se usa:  node scripts/generar-catalogo.js
 */
const fs = require('fs');
const path = require('path');
const { cargarEnv } = require('../src/config');
const videoService = require('../src/services/videoService');

cargarEnv();

async function main() {
    console.log('Consultando las APIs públicas de video...');

    const videos = await videoService.refrescarCatalogo();

    if (videos.length === 0) {
        console.error('No se obtuvo ningún video. Revisa tu conexión a internet.');
        process.exit(1);
    }

    const contenido = {
        generado: new Date().toISOString(),
        total: videos.length,
        categorias: videoService.CATEGORIAS,
        videos
    };

    const carpeta = path.join(__dirname, '..', 'public', 'data');
    const archivo = path.join(carpeta, 'videos.json');

    if (!fs.existsSync(carpeta)) {
        fs.mkdirSync(carpeta, { recursive: true });
    }

    fs.writeFileSync(archivo, JSON.stringify(contenido, null, 2), 'utf8');

    console.log(`Listo: ${videos.length} videos guardados en ${archivo}`);
}

main().catch((error) => {
    console.error('Error al generar el catálogo:', error);
    process.exit(1);
});
