const express = require('express');
const cors = require('cors');
const path = require('path');
const { cargarEnv } = require('./config');
const apiRoutes = require('./routes/api');

// Cargamos el archivo .env (si existe) antes de todo
cargarEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// API rest route, to be defined
app.use('/api', apiRoutes);

// Sirvimos las páginas del proyecto (public/index.html, public/videoteca.html, etc.)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
    res.json({ 
        estado: "Activo", 
        mensaje: "API REST de INADEJ - Contigo en Casa funcionando correctamente" 
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
});
