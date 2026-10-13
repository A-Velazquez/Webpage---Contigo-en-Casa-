const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// API rest route, to be defined
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.json({ 
        estado: "Activo", 
        mensaje: "API REST de INADEJ - Contigo en Casa funcionando correctamente" 
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
});