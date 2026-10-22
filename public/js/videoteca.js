/**
 * Lógica de la videoteca.
 *
 * - Pide los videos al servidor (que los trae de las APIs públicas).
 * - Filtra por texto y por categoría.
 * - Si el servidor no está encendido, usa el catálogo guardado en data/videos.json.
 */

document.addEventListener('DOMContentLoaded', () => {
    const campoBusqueda = document.getElementById('buscarVideo');
    const botonLimpiar = document.getElementById('limpiarBusqueda');
    const contenedorFiltros = document.getElementById('filtrosCategorias');
    const galeria = document.getElementById('galeriaVideos');
    const estadoCarga = document.getElementById('estadoCarga');
    const sinResultados = document.getElementById('sinResultados');
    const mensajeAviso = document.getElementById('estadoAviso');
    const contadorVideos = document.getElementById('contadorVideos');
    const modalVideo = document.getElementById('modalVideo');
    const reproductor = document.getElementById('reproductorVideo');
    const tituloModal = document.getElementById('tituloVideoModal');
    const descripcionModal = document.getElementById('descripcionVideoModal');
    const fichaModal = document.getElementById('fichaVideoModal');

    // Estado actual de la página
    const estado = {
        categoria: 'todos',
        consulta: ''
    };

    // Número de la búsqueda en curso (para no mezclar respuestas)
    let contadorPeticiones = 0;

    // Lista de videos que se están mostrando (la usa el reproductor)
    let videosCargados = [];

    // ---------------------------------------------------------------
    // Peticiones al servidor
    // ---------------------------------------------------------------

    // Intenta la API del servidor donde está la página y, si no hay,
    // intenta el servidor local de INADEJ (puerto 3000).
    async function pedirVideos(parametros) {
        const bases = ['', 'http://localhost:3000'];
        let ultimoError = null;

        for (const base of bases) {
            try {
                const respuesta = await fetch(`${base}/api/videos?${parametros.toString()}`, {
                    headers: { Accept: 'application/json' }
                });

                if (!respuesta.ok) {
                    throw new Error(`El servidor respondió ${respuesta.status}`);
                }

                const datos = await respuesta.json();

                if (!datos || !Array.isArray(datos.videos)) {
                    throw new Error('La respuesta del servidor no tiene videos');
                }

                return datos;
            } catch (error) {
                ultimoError = error;
            }
        }

        throw ultimoError || new Error('No hay conexión con el servidor');
    }

    // Catálogo guardado en el sitio (respaldo sin servidor)
    async function pedirCatalogoLocal() {
        const respuesta = await fetch('./data/videos.json');

        if (!respuesta.ok) {
            throw new Error('No se encontró el catálogo local');
        }

        const datos = await respuesta.json();

        return Array.isArray(datos.videos) ? datos.videos : [];
    }

    // ---------------------------------------------------------------
    // Filtrado (también se usa en el catálogo local)
    // ---------------------------------------------------------------

    // Quita acentos y deja el texto en minúsculas para comparar mejor
    function textoSimple(texto) {
        return String(texto || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // Escapa el texto para poder ponerlo dentro del HTML de las tarjetas
    function escapar(texto) {
        return String(texto || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Revisa si un video tiene que ver con lo que el usuario escribió
    function coincideConConsulta(video, consulta) {
        if (!consulta) {
            return true;
        }

        const palabras = textoSimple(consulta)
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((palabra) => palabra.length > 2);

        if (palabras.length === 0) {
            return true;
        }

        const info = textoSimple(
            `${video.titulo} ${video.descripcion} ${(video.etiquetas || []).join(' ')}`
        );

        return palabras.some((palabra) => info.includes(palabra));
    }

    // Aplica los filtros (texto y categoría) sobre una lista de videos
    function filtrarVideos(videos, consulta, categoria) {
        return videos.filter((video) => {
            const coincideCategoria =
                !categoria || categoria === 'todos' || video.categoria === categoria;

            return coincideCategoria && coincideConConsulta(video, consulta);
        });
    }

    // ---------------------------------------------------------------
    // Dibujar los videos
    // ---------------------------------------------------------------

    // Clase de la etiqueta según la categoría
    const claseCategoria = {
        terapia: 'bg-primary-subtle text-primary',
        nutricion: 'bg-success-subtle text-success',
        cuidador: 'bg-warning-subtle text-dark'
    };

    const nombreCategoria = {
        terapia: 'Masajes y Terapia',
        nutricion: 'Nutrición',
        cuidador: 'Para el Cuidador'
    };

    // Devuelve el HTML de una tarjeta de video
    function crearTarjeta(video) {
        const clase = claseCategoria[video.categoria] || 'bg-secondary-subtle text-secondary';
        const categoria = nombreCategoria[video.categoria] || 'Cuidados';
        const duracion = video.duracion ? `${video.duracion} min` : 'Video';
        const titulo = escapar(video.titulo);
        const descripcion = escapar(video.descripcion);
        const enlace = video.pagina
            ? `<a class="btn btn-link w-100 small text-decoration-none mt-1" href="${escapar(video.pagina)}" target="_blank" rel="noopener">
                   <i class="bi bi-box-arrow-up-right me-1"></i> Ver en ${escapar(video.fuente)}
               </a>`
            : '';

        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden video-card">
                    <div class="position-relative">
                        <img src="${escapar(video.miniatura)}" class="card-img-top video-thumb" alt="${titulo}" loading="lazy">
                        <div class="play-overlay d-flex align-items-center justify-content-center">
                            <i class="bi bi-play-circle-fill display-3 text-warning"></i>
                        </div>
                        <span class="badge bg-dark position-absolute bottom-0 end-0 m-3 px-2 py-1 fs-6">${duracion}</span>
                    </div>
                    <div class="card-body p-4">
                        <span class="badge ${clase} mb-2 px-3 py-2 rounded-pill fw-bold">${categoria}</span>
                        <h3 class="card-title fw-bold h5 text-dark mb-2">${titulo}</h3>
                        <p class="card-text text-muted small">${descripcion}</p>
                        <button class="btn btn-primary w-100 rounded-3 fw-bold mt-2 py-2 fs-5 boton-ver-video" data-id="${escapar(video.id)}">
                            <i class="bi bi-play-fill me-1"></i> Ver Video
                        </button>
                        ${enlace}
                    </div>
                </div>
            </div>
        `;
    }

    // Muestra la lista de videos en la galería
    function mostrarVideos(videos) {
        videosCargados = videos;
        galeria.innerHTML = videos.map(crearTarjeta).join('');

        const hayVideos = videos.length > 0;

        galeria.classList.toggle('d-none', !hayVideos);
        sinResultados.classList.toggle('d-none', hayVideos);
        estadoCarga.classList.add('d-none');

        if (hayVideos) {
            contadorVideos.textContent =
                videos.length === 1 ? '1 video encontrado' : `${videos.length} videos encontrados`;
        } else {
            contadorVideos.textContent = 'Sin resultados';
        }
    }

    // Muestra las cajas de "cargando"
    function mostrarCarga() {
        estadoCarga.classList.remove('d-none');
        galeria.classList.add('d-none');
        sinResultados.classList.add('d-none');
        contadorVideos.textContent = 'Buscando videos...';
    }

    // Aviso amarillo (por ejemplo, cuando no hay servidor)
    function mostrarAviso(texto) {
        mensajeAviso.textContent = texto;
        mensajeAviso.classList.remove('d-none');
    }

    function ocultarAviso() {
        mensajeAviso.classList.add('d-none');
    }

    // ---------------------------------------------------------------
    // Cargar los videos (con filtros)
    // ---------------------------------------------------------------
    async function cargarVideos() {
        // Cada búsqueda tiene su número, así no se mezclan las respuestas
        const numeroPeticion = ++contadorPeticiones;
        mostrarCarga();

        const parametros = new URLSearchParams();

        if (estado.consulta) {
            parametros.set('q', estado.consulta);
        }

        if (estado.categoria !== 'todos') {
            parametros.set('categoria', estado.categoria);
        }

        try {
            const datos = await pedirVideos(parametros);

            // Si el usuario ya escribió otra cosa, no pintamos esta respuesta
            if (numeroPeticion !== contadorPeticiones) {
                return;
            }

            ocultarAviso();
            mostrarVideos(datos.videos);
        } catch (error) {
            // Sin servidor: usamos el catálogo guardado en el sitio
            try {
                const catalogo = await pedirCatalogoLocal();

                if (numeroPeticion !== contadorPeticiones) {
                    return;
                }

                const videos = filtrarVideos(catalogo, estado.consulta, estado.categoria);

                mostrarVideos(videos);
                mostrarAviso(
                    'El servidor de INADEJ no está encendido, por eso mostramos el catálogo guardado en la página. El filtrado sigue funcionando.'
                );
            } catch (errorLocal) {
                galeria.classList.add('d-none');
                estadoCarga.classList.add('d-none');
                sinResultados.classList.remove('d-none');
                contadorVideos.textContent = 'Sin resultados';
                mostrarAviso('No se pudieron cargar los videos. Revisa tu conexión a internet.');
            }
        }
    }

    // ---------------------------------------------------------------
    // Reproductor (ventana modal)
    // ---------------------------------------------------------------
    function abrirVideo(video) {
        tituloModal.textContent = video.titulo;
        descripcionModal.textContent = video.descripcion;

        const datos = [
            `Fuente: ${video.fuente}`,
            video.autor ? `Autor: ${video.autor}` : '',
            video.duracion ? `Duración: ${video.duracion} min` : '',
            video.anio ? `Año: ${video.anio}` : '',
            video.licencia ? `Licencia: ${video.licencia}` : ''
        ].filter(Boolean);

        fichaModal.innerHTML = datos
            .map((dato) => `<li class="small text-muted">${dato}</li>`)
            .join('');

        if (video.videoUrl) {
            reproductor.src = video.videoUrl;
            reproductor.poster = video.miniatura || '';
            reproductor.classList.remove('d-none');
        } else {
            reproductor.removeAttribute('src');
            reproductor.classList.add('d-none');
        }

        const modal = new bootstrap.Modal(modalVideo);
        modal.show();

        // Intentamos que el video empiece a reproducirse solo
        const reproducción = reproductor.play();

        if (reproduccion && typeof reproduction.catch === 'function') {
            reproducción.catch(() => {
                // Si el navegador no lo permite, el usuario lo reproduce con el botón
            });
        }
    }

    // Al cerrar la modal, paramos el video
    modalVideo.addEventListener('hidden.bs.modal', () => {
        reproductor.pause();
        reproductor.removeAttribute('src');
        reproductor.load();
    });

    // Botón "Ver Video" de cada tarjeta
    galeria.addEventListener('click', (evento) => {
        const boton = evento.target.closest('.boton-ver-video');

        if (!boton) {
            return;
        }

        const id = boton.dataset.id;
        const video = videosCargados.find((item) => item.id === id);

        if (video) {
            abrirVideo(video);
        }
    });

    // ---------------------------------------------------------------
    // Buscador y botones de categoría
    // ---------------------------------------------------------------

    // Cuando el usuario escribe, esperamos un poquito antes de buscar
    let temporizador = null;

    campoBusqueda.addEventListener('input', () => {
        estado.consulta = campoBusqueda.value.trim();

        botonLimpiar.classList.toggle('d-none', !estado.consulta);

        clearTimeout(temporizador);
        temporizador = setTimeout(cargarVideos, 400);
    });

    // Botón para borrar lo escrito
    botonLimpiar.addEventListener('click', () => {
        campoBusqueda.value = '';
        estado.consulta = '';
        botonLimpiar.classList.add('d-none');
        cargarVideos();
    });

    // Botones de categoría
    contenedorFiltros.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button[data-categoria]');

        if (!boton) {
            return;
        }

        // Quitamos la opción activa de todos los botones
        contenedorFiltros.querySelectorAll('button[data-categoria]').forEach((otro) => {
            otro.classList.remove('active', 'fw-bold');
        });

        // Dejamos activa la opción que se acaba de elegir
        boton.classList.add('active', 'fw-bold');

        estado.categoria = boton.dataset.categoria;
        cargarVideos();
    });

    // Primera carga
    cargarVideos();
});
