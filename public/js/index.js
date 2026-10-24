document.addEventListener('DOMContentLoaded', () => {
    inicializarAnimacionesTarjetas();
    cargarAvisosDelServidor();
});

// Tips from the api
async function cargarAvisosDelServidor() {
    try {
        const response = await fetch('/api/avisos');
        if (!response.ok) return;

        const avisos = await response.json();
        
        if (avisos && avisos.length > 0) {
            mostrarBannerAviso(avisos[0]);
        }
    } catch (error) {
        console.log('Servidor en modo estático o aviso no disponible.');
    }
}

// Show reactive alert on the hero section
function mostrarBannerAviso(aviso) {
    const heroMain = document.querySelector('.hero-main .hero-content');
    if (!heroMain) return;

    const bannerHtml = document.createElement('div');
    bannerHtml.className = 'alert alert-info alert-dismissible fade show shadow-sm mb-4 border-0 rounded-3';
    bannerHtml.role = 'alert';
    bannerHtml.innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <i class="bi bi-bell-fill fs-5 text-primary"></i>
            <div>
                <strong>${aviso.titulo} (${aviso.categoria}):</strong> ${aviso.mensaje}
            </div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    heroMain.insertBefore(bannerHtml, heroMain.firstChild);
}


function inicializarAnimacionesTarjetas() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px)';
            card.classList.remove('shadow-sm');
            card.classList.add('shadow');
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.classList.remove('shadow');
            card.classList.add('shadow-sm');
        });
    });
}