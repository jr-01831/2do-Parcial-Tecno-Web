// Mercado Requis Jonathan Rodrigo
const API_KEY = 'TU_API_KEY_AQUI'; //Para q ponga su API KEY ahi
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const seriesGrid    = document.getElementById('series-grid');
const loadingDiv    = document.getElementById('loading');
const errorDiv      = document.getElementById('error');
const errorMessage  = document.getElementById('error-message');
const resultsTitle  = document.getElementById('results-title');
const resultsCount  = document.getElementById('results-count');
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-search');
const retryBtn      = document.getElementById('retry-btn');
const themeToggle   = document.getElementById('theme-toggle');
const modal         = document.getElementById('serie-modal');
const modalBody     = document.getElementById('modal-body');
const modalClose    = document.getElementById('modal-close');
const modalOverlay  = document.getElementById('modal-overlay');


// ============================================================================
// UTILIDADES DE UI (DADO - no modificar)
// ============================================================================
const mostrarLoading = () => {
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';
    seriesGrid.innerHTML = '';
};

const ocultarLoading = () => {
    loadingDiv.style.display = 'none';
};

const mostrarError = (mensaje) => {
    ocultarLoading();
    errorMessage.textContent = mensaje;
    errorDiv.style.display = 'flex';
    seriesGrid.innerHTML = '';
};


// ============================================================================
// DARK MODE (DADO - no modificar)
// ============================================================================
const aplicarTema = (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    themeToggle.textContent = tema === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', tema);
};

const cargarTema = () => {
    const guardado = localStorage.getItem('theme');
    const preferido = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(guardado || preferido);
};

themeToggle.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme');
    aplicarTema(actual === 'dark' ? 'light' : 'dark');
});

cargarTema();

let ultimaBusqueda = '';
let numeroPeticion = 0;
let temporizadorBusqueda;

const obtenerDatos = async (url) => {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
    }
    return await respuesta.json();
};

//Cragar series populares

const cargarSeriesPopulares = async () => {
    ultimaBusqueda = '';
    searchInput.value = '';
    resultsTitle.textContent = 'Series Populares';
    await buscarSeriesPopulares();
};

const buscarSeriesPopulares = async () => {
    const peticionActual = ++numeroPeticion;
    const url = `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`;
    mostrarLoading();
    try {
        const datos = await obtenerDatos(url);
        if (peticionActual !== numeroPeticion) return;
        mostrarSeries(datos.results);
        resultsTitle.textContent = 'Series Populares';
    } catch (error) {
        if (peticionActual !== numeroPeticion) return;
        if (error.message.includes('401')) {
            mostrarError('API key inválida');
        } else {
            mostrarError('Error de conexión');
        }
    } finally {
        if (peticionActual === numeroPeticion) {
            ocultarLoading();
        }
    }
};

//Mostrar tarjeta de series

const mostrarSeries = (series) => {
    seriesGrid.innerHTML = '';
    errorDiv.style.display = 'none';
    resultsCount.textContent = `${series.length} series encontradas`;
    if (series.length === 0) {
        seriesGrid.innerHTML = '<p>No se encontraron series.</p>';
        return;
    }
    series.forEach((serie) => {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'serie-card';
        tarjeta.tabIndex = 0;
        tarjeta.setAttribute('role', 'button');
        tarjeta.setAttribute(
            'aria-label',
            `Ver detalles de ${serie.name}`
        );
        const contenedorPoster = document.createElement('div');
        contenedorPoster.className = 'serie-card__poster';
        if (serie.poster_path) {
            const imagen = document.createElement('img');
            imagen.className = 'serie-card__image';
            imagen.src = `${IMAGE_URL}${serie.poster_path}`;
            imagen.alt = `Póster de ${serie.name}`;
            imagen.loading = 'lazy';
            imagen.onerror = () => {
                imagen.style.display = 'none';
                contenedorPoster.textContent = 'Imagen no disponible';
            };
            contenedorPoster.appendChild(imagen);
        } else {
            contenedorPoster.textContent = 'Imagen no disponible';
        }
        const rating = document.createElement('span');
        rating.className = 'serie-card__rating';
        rating.textContent = `⭐ ${
            serie.vote_average != null
                ? Number(serie.vote_average).toFixed(1)
                : 'N/A'
        }`;
        contenedorPoster.appendChild(rating);
        const contenido = document.createElement('div');
        contenido.className = 'serie-card__content';
        const titulo = document.createElement('h3');
        titulo.className = 'serie-card__title';
        titulo.textContent = serie.name || 'Sin título';
        const anio = document.createElement('p');
        anio.className = 'serie-card__year';
        anio.textContent = serie.first_air_date
            ? `Año: ${serie.first_air_date.split('-')[0]}`
            : 'Año no disponible';
        contenido.appendChild(titulo);
        contenido.appendChild(anio);
        tarjeta.appendChild(contenedorPoster);
        tarjeta.appendChild(contenido);
        tarjeta.addEventListener('click', () => {
            mostrarDetalle(serie.id);
        });
        tarjeta.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                mostrarDetalle(serie.id);
            }
        });
        seriesGrid.appendChild(tarjeta);
    });
};

//Busqueda de series

const buscarSeries = async (termino) => {
    const texto = termino.trim();
    if (!texto) {
        await buscarSeriesPopulares();
        return;
    }
    const peticionActual = ++numeroPeticion;
    const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(texto)}`;
    mostrarLoading();
    resultsTitle.textContent = `Resultados para "${texto}"`;
    try {
        const datos = await obtenerDatos(url);
        if (peticionActual !== numeroPeticion) return;
        mostrarSeries(datos.results);
    } catch (error) {
        if (peticionActual !== numeroPeticion) return;
        if (error.message.includes('401')) {
            mostrarError('API key inválida');
        } else {
            mostrarError('Error de conexión');
        }
    } finally {
        if (peticionActual === numeroPeticion) {
            ocultarLoading();
        }
    }
};
searchInput.addEventListener('input', () => {
    clearTimeout(temporizadorBusqueda);
    const texto = searchInput.value.trim();
    ultimaBusqueda = texto;
    if (!texto) {
        cargarSeriesPopulares();
        return;
    }
    temporizadorBusqueda = setTimeout(() => {
        buscarSeries(texto);
    }, 400);
});
clearBtn.addEventListener('click', () => {
    clearTimeout(temporizadorBusqueda);
    ultimaBusqueda = '';
    searchInput.value = '';
    cargarSeriesPopulares();
});
retryBtn.addEventListener('click', () => {
    if (searchInput.value.trim()) {
        buscarSeries(searchInput.value.trim());
    } else {
        cargarSeriesPopulares();
    }
});

//Modal de detalle

const mostrarDetalle = async (id) => {
    const url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`;
    modal.classList.add('modal--show');
    modalBody.innerHTML = '<p>Cargando detalles...</p>';
    try {
        const serie = await obtenerDatos(url);
        modalBody.innerHTML = '';
        const titulo = document.createElement('h2');
        titulo.className = 'modal__title';
        titulo.textContent = serie.name || 'Sin título';
        const subtitulo = document.createElement('p');
        subtitulo.className = 'modal__subtitle';
        const anio = serie.first_air_date
            ? serie.first_air_date.split('-')[0]
            : 'No disponible';
        subtitulo.textContent =
            `Año: ${anio} | ⭐ ${
                serie.vote_average != null
                    ? Number(serie.vote_average).toFixed(1)
                    : 'N/A'
            }`;
        if (serie.poster_path) {
            const imagen = document.createElement('img');
            imagen.src = `${IMAGE_URL}${serie.poster_path}`;
            imagen.alt = `Póster de ${serie.name}`;
            imagen.style.width = '180px';
            imagen.style.maxWidth = '100%';
            imagen.style.borderRadius = '8px';
            imagen.loading = 'lazy';
            modalBody.appendChild(imagen);
        }
        const informacion = document.createElement('div');
        informacion.className = 'modal__info';
        const temporadas = document.createElement('span');
        temporadas.textContent =
            `Temporadas: ${serie.number_of_seasons ?? 'N/D'}`;
        const episodios = document.createElement('span');
        episodios.textContent =
            `Episodios: ${serie.number_of_episodes ?? 'N/D'}`;
        const estado = document.createElement('span');
        estado.textContent =
            `Estado: ${serie.status || 'No disponible'}`;
        const generos = document.createElement('span');
        const nombresGeneros = serie.genres?.map(genero => genero.name) || [];
        generos.textContent =
            `Géneros: ${nombresGeneros.length
                ? nombresGeneros.join(', ')
                : 'No disponibles'}`;
        informacion.appendChild(temporadas);
        informacion.appendChild(episodios);
        informacion.appendChild(estado);
        informacion.appendChild(generos);
        const tituloSinopsis = document.createElement('h3');
        tituloSinopsis.textContent = 'Sinopsis';
        const sinopsis = document.createElement('p');
        sinopsis.className = 'modal__overview';
        sinopsis.textContent =
            serie.overview || 'No hay sinopsis disponible en español.';
        modalBody.appendChild(titulo);
        modalBody.appendChild(subtitulo);
        modalBody.appendChild(informacion);
        modalBody.appendChild(tituloSinopsis);
        modalBody.appendChild(sinopsis);

    } catch (error) {
        modalBody.innerHTML = '';
        const mensaje = document.createElement('p');
        if (error.message.includes('401')) {
            mensaje.textContent = 'API key inválida';
        } else {
            mensaje.textContent = 'Error de conexión';
        }
        modalBody.appendChild(mensaje);
    }
};

const cerrarModal = () => {
    modal.classList.remove('modal--show');
};
modalClose.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', cerrarModal);
document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
        cerrarModal();
    }
});

//Carga inicial de la aplicación

cargarSeriesPopulares();