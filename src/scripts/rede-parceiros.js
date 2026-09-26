import { GOOGLE_MAPS_API_KEY } from './config.js';
const ESTABELECIMENTOS = [
  // Barueri
  { id: 1, nome: 'Academia Xnadú', categoria: 'academia', cidade: 'Barueri', parceiro: true, lat: -23.5105, lng: -46.8763 },
  { id: 2, nome: 'Estabelecimento', categoria: 'academia', cidade: 'Barueri', parceiro: true, lat: -23.5138, lng: -46.879 },
  { id: 3, nome: 'Estabelecimento', categoria: 'academia', cidade: 'Barueri', parceiro: true, lat: -23.507, lng: -46.872 },
  { id: 4, nome: 'Academia de Ginástica Artística', categoria: 'academia', cidade: 'Barueri', parceiro: true, lat: -23.519, lng: -46.881 },
  { id: 5, nome: 'Estabelecimento', categoria: 'academia', cidade: 'Barueri', parceiro: true, lat: -23.504, lng: -46.8695 },
  { id: 6, nome: 'Box CrossFit Barueri', categoria: 'crossfit', cidade: 'Barueri', parceiro: true, lat: -23.5165, lng: -46.8845 },
  { id: 7, nome: 'Academia Alphaville Fit', categoria: 'academia', cidade: 'Barueri', parceiro: true, lat: -23.4985, lng: -46.866 },
  { id: 8, nome: 'Studio Pilates Barueri', categoria: 'pilates', cidade: 'Barueri', parceiro: true, lat: -23.512, lng: -46.8635 },
  { id: 9, nome: 'Muay Thai Barueri', categoria: 'luta', cidade: 'Barueri', parceiro: true, lat: -23.521, lng: -46.871 },
  { id: 10, nome: 'Estabelecimento', categoria: 'academia', cidade: 'Barueri', parceiro: true, lat: -23.5055, lng: -46.888 },
  { id: 11, nome: 'Estabelecimento', categoria: 'academia', cidade: 'Barueri', parceiro: true, lat: -23.5225, lng: -46.86 },

  // São Paulo
  { id: 12, nome: 'Academia Paulista', categoria: 'academia', cidade: 'São Paulo', parceiro: true, lat: -23.5613, lng: -46.6565 },
  { id: 13, nome: 'Yoga Space SP', categoria: 'yoga', cidade: 'São Paulo', parceiro: true, lat: -23.5489, lng: -46.6388 },
  { id: 14, nome: 'Natação Clube SP', categoria: 'natacao', cidade: 'São Paulo', parceiro: true, lat: -23.5701, lng: -46.691 },
  { id: 15, nome: 'Beach Arena SP', categoria: 'beach', cidade: 'São Paulo', parceiro: true, lat: -23.5825, lng: -46.6291 },
  { id: 16, nome: 'Box CrossFit Pinheiros', categoria: 'crossfit', cidade: 'São Paulo', parceiro: true, lat: -23.567, lng: -46.6825 },

  // Osasco
  { id: 17, nome: 'Academia Osasco Fit', categoria: 'academia', cidade: 'Osasco', parceiro: true, lat: -23.5329, lng: -46.7916 },
  { id: 18, nome: 'Estúdio Pilates Osasco', categoria: 'pilates', cidade: 'Osasco', parceiro: true, lat: -23.539, lng: -46.7845 },
  { id: 19, nome: 'Luta Livre Osasco', categoria: 'luta', cidade: 'Osasco', parceiro: true, lat: -23.527, lng: -46.798 },
  { id: 20, nome: 'Piscina Municipal Osasco', categoria: 'natacao', cidade: 'Osasco', parceiro: true, lat: -23.541, lng: -46.776 },
];

const CATEGORY_LABELS = {
  academia: 'Academia',
  luta: 'Luta',
  pilates: 'Pilates',
  yoga: 'Yoga',
  natacao: 'Natação',
  beach: 'Beach',
  crossfit: 'CrossFit',
};

/** Estilo escuro do mapa, aproximando da cor do site. */
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0b0f14' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#07090b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#85898e' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#26384f' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a232e' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#85898e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#26384f' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#07090b' }] },
];

const GOOGLE_MAPS_CALLBACK_NAME = 'initRedeParceirosMap';

/** Injeta o SDK do Google Maps só quando esta seção existe. */
function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }

    window[GOOGLE_MAPS_CALLBACK_NAME] = () => resolve();

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=${GOOGLE_MAPS_CALLBACK_NAME}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Não foi possível carregar o Google Maps.'));
    document.head.appendChild(script);
  });
}

async function initRedeParceiros(root) {
  const searchForm = root.querySelector('[data-rede-parceiros="search-form"]');
  const searchInput = root.querySelector('[data-rede-parceiros="search-input"]');
  const filtersContainer = root.querySelector('[data-rede-parceiros="filters"]');
  const errorEl = root.querySelector('[data-rede-parceiros="error"]');
  const emptyStateEl = root.querySelector('[data-rede-parceiros="empty-state"]');
  const listEl = root.querySelector('[data-rede-parceiros="list"]');
  const resultsCountEl = root.querySelector('[data-rede-parceiros="results-count"]');

  let map;
  let markers = [];
  let selectedCategory = 'todos';

  function setError(message) {
    if (message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    } else {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  }

  function clearMarkers() {
    markers.forEach((marker) => marker.setMap(null));
    markers = [];
  }

  function renderList(results) {
    listEl.innerHTML = '';

    results.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'rede-parceiros-card';
      li.innerHTML = `
        <div class="rede-parceiros-card__row">
          <p class="rede-parceiros-card__name">${item.nome}</p>
          ${item.parceiro ? '<span class="rede-parceiros-card__badge">Parceiro</span>' : ''}
        </div>
        <p class="rede-parceiros-card__category">${CATEGORY_LABELS[item.categoria]}</p>
      `;
      listEl.appendChild(li);
    });
  }

  function renderMarkers(results) {
    clearMarkers();

    results.forEach((item) => {
      const marker = new google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        map,
        title: item.nome,
        icon: {
          url: '../../../public/assets/icons/map-pin.svg',
          scaledSize: new google.maps.Size(32, 32),
        },
      });
      markers.push(marker);
    });

    if (results.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      results.forEach((item) => bounds.extend({ lat: item.lat, lng: item.lng }));
      map.fitBounds(bounds);
    }
  }

  function showResults(results) {
    emptyStateEl.hidden = true;
    listEl.hidden = false;
    renderList(results);
    renderMarkers(results);
    resultsCountEl.textContent = `${results.length} estabelecimento${results.length === 1 ? '' : 's'} encontrado${
      results.length === 1 ? '' : 's'
    }`;
  }

  function showEmptyState() {
    emptyStateEl.hidden = false;
    listEl.hidden = true;
    clearMarkers();
    resultsCountEl.textContent = '';
  }

  function applyFilters() {
    const cityTerm = searchInput.value.trim().toLowerCase();

    if (!cityTerm) {
      setError(null);
      showEmptyState();
      return;
    }

    const filtered = ESTABELECIMENTOS.filter((item) => {
      const matchesCity = item.cidade.toLowerCase().includes(cityTerm);
      const matchesCategory = selectedCategory === 'todos' || item.categoria === selectedCategory;
      return matchesCity && matchesCategory;
    });

    if (filtered.length === 0) {
      setError('Localização não encontrada. Tente outra busca.');
      showEmptyState();
      return;
    }

    setError(null);
    showResults(filtered);
  }

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilters();
  });

  filtersContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.rede-parceiros__filter');
    if (!button) return;

    filtersContainer.querySelectorAll('.rede-parceiros__filter').forEach((btn) => {
      btn.classList.toggle('is-active', btn === button);
    });

    selectedCategory = button.dataset.category;

    // Recombina com a categoria apenas se já existe uma busca de cidade ativa.
    if (searchInput.value.trim()) {
      applyFilters();
    }
  });

  try {
    await loadGoogleMapsScript();

    map = new google.maps.Map(document.getElementById("googleMap"), {
      center: { lat: -23.5505, lng: -46.6333 }, // São Paulo, ponto de partida do mapa
      zoom: 11,
      styles: MAP_STYLE,
      streetViewControl: false,
      fullscreenControl: false,
    });
  } catch (error) {
    console.error(error);
    setError('Não foi possível carregar o mapa. Tente novamente mais tarde.');
  }
}

document.addEventListener('section:loaded', (event) => {
  if (event.detail?.sectionName !== 'rede-parceiros') return;
  initRedeParceiros(event.target);
});