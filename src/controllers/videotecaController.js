// Controlador de la videoteca: entrega los videos de las APIs públicas ya filtrados
const videoService = require('../services/videoService');

exports.obtenerVideos = async (req, res) => {
    const consulta = (req.query.q || req.query.buscar || '').toString().trim();
    const categoria = (req.query.categoria || 'todos').toString().trim();

    try {
        const videos = await videoService.obtenerVideos({ consulta, categoria });

        return res.status(200).json({
            exito: true,
            total: videos.length,
            consulta,
            categoria,
            categorias: videoService.CATEGORIAS,
            fuentes: ['Internet Archive', 'Pexels', 'Pixabay'],
            videos
        });
    } catch (error) {
        console.error('Error al obtener los videos:', error);
        return res.status(500).json({
            exito: false,
            error: 'No se pudieron cargar los videos de la videoteca.',
            videos: []
        });
    }
};
