const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');

router.post('/consultas', consultaController.procesarConsultaIA);

router.get('/avisos', consultaController.obtenerAvisos);

module.exports = router;