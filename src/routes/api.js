const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const videotecaController = require('../controllers/videotecaController');

router.post('/consultas', consultaController.procesarConsultaIA);

router.get('/avisos', consultaController.obtenerAvisos);

// Videos de la videoteca (vienen de APIs públicas de video)
router.get('/videos', videotecaController.obtenerVideos);

module.exports = router;
