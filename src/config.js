/**
 * Configuración general del proyecto.
 * Lee el archivo .env (si existe) y lo pasa a process.env.
 * Se hace a mano para no agregar dependencias extra al proyecto.
 */
const fs = require('fs');
const path = require('path');

function cargarEnv() {
    const rutaEnv = path.join(__dirname, '..', '.env');

    if (!fs.existsSync(rutaEnv)) {
        return;
    }

    const contenido = fs.readFileSync(rutaEnv, 'utf8');

    contenido.split('\n').forEach((linea) => {
        const limpia = linea.trim();

        // Saltamos comentarios y líneas vacías
        if (!limpia || limpia.startsWith('#')) {
            return;
        }

        const posicionIgual = limpia.indexOf('=');

        if (posicionIgual === -1) {
            return;
        }

        const clave = limpia.slice(0, posicionIgual).trim();
        const valor = limpia.slice(posicionIgual + 1).trim().replace(/^["']|["']$/g, '');

        // Si ya viene definida en el sistema, no la sobrescribimos
        if (clave && !(clave in process.env)) {
            process.env[clave] = valor;
        }
    });
}

module.exports = { cargarEnv };
