// ==========================================================================
// Universo Big Data — script.js
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initVideoCard();
  initPodcastCard();
  initContactForm();
});

/* ---------- Menú móvil ---------- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

/* ---------- Card de video (página Acerca de) ----------
   Al hacer clic en el botón de play, la miniatura se reemplaza
   por un iframe real de YouTube usando el id guardado en
   data-yt-id. Esto evita cargar el video antes de tiempo
   (mejor rendimiento) y hace que el video sí se reproduzca. */
function initVideoCard() {
  const thumb = document.querySelector('.video-thumb');
  if (!thumb) return;

  const playBtn = thumb.querySelector('.play-btn');
  if (!playBtn) return;

  playBtn.addEventListener('click', () => {
    const videoId = thumb.getAttribute('data-yt-id');
    if (!videoId) return;

    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.border = '0';
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.title = 'Video informativo sobre Big Data';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;

    thumb.innerHTML = '';
    thumb.appendChild(iframe);
  });
}

/* ---------- Card de podcast (página Acerca de) ----------
   Controla el elemento <audio> real: reproduce/pausa, cambia
   el ícono del botón, actualiza el contador de tiempo, y
   convierte la barra de ondas en un control de progreso real:
   se pinta de azul a medida que avanza el audio y se puede
   hacer clic (o usar las flechas del teclado) para saltar a
   cualquier punto. */
function initPodcastCard() {
  const audio = document.getElementById('podcastAudio');
  const btn = document.getElementById('podcastPlayBtn');
  const timeLabel = document.getElementById('podcastTime');
  const waveform = document.getElementById('podcastWaveform');
  if (!audio || !btn) return;

  const barras = waveform ? Array.from(waveform.querySelectorAll('span')) : [];

  const iconPlay = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  const iconPause = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

  function formatTime(segundos) {
    if (!isFinite(segundos)) return '00:00';
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = Math.floor(segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function progresoActual() {
    if (!audio.duration) return 0;
    return audio.currentTime / audio.duration;
  }

  function pintarBarras() {
    if (!barras.length) return;
    const progreso = progresoActual();
    const barrasLlenas = Math.round(progreso * barras.length);
    barras.forEach((barra, i) => {
      barra.classList.toggle('played', i < barrasLlenas);
    });
    if (waveform) waveform.setAttribute('aria-valuenow', Math.round(progreso * 100));
  }

  function actualizarTiempo() {
    if (timeLabel) {
      const actual = formatTime(audio.currentTime);
      const total = formatTime(audio.duration);
      timeLabel.textContent = `${actual} / ${total}`;
    }
    pintarBarras();
  }

  function saltarConRatio(ratio) {
    if (!audio.duration) return;
    ratio = Math.min(Math.max(ratio, 0), 1);
    audio.currentTime = ratio * audio.duration;
    actualizarTiempo();
  }

  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      btn.innerHTML = iconPause;
      btn.setAttribute('aria-label', 'Pausar episodio');
    } else {
      audio.pause();
      btn.innerHTML = iconPlay;
      btn.setAttribute('aria-label', 'Reproducir episodio');
    }
  });

  if (waveform) {
    // Clic (o toque) en cualquier punto de la barra = saltar ahí
    waveform.addEventListener('click', (e) => {
      const rect = waveform.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      saltarConRatio(ratio);
    });

    // Flechas del teclado, ya que la barra es enfocable (tabindex="0")
    waveform.addEventListener('keydown', (e) => {
      if (!audio.duration) return;
      const paso = 5; // segundos por pulsación
      if (e.key === 'ArrowRight') {
        saltarConRatio((audio.currentTime + paso) / audio.duration);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        saltarConRatio((audio.currentTime - paso) / audio.duration);
        e.preventDefault();
      }
    });
  }

  audio.addEventListener('loadedmetadata', actualizarTiempo);
  audio.addEventListener('timeupdate', actualizarTiempo);
  audio.addEventListener('ended', () => {
    btn.innerHTML = iconPlay;
    btn.setAttribute('aria-label', 'Reproducir episodio');
  });
}

/* ---------- Formulario de contacto ----------
   Valida los 4 campos obligatorios en el navegador y, si son
   válidos, envía los datos a guardar.php para que el servidor
   los agregue a data/mensajes.txt. */
function initContactForm() {
  const form = document.querySelector('.contact-form-card form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validación nativa de los 4 campos obligatorios (nombre, correo, área, mensaje)
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());

    if (submitBtn) submitBtn.disabled = true;
    if (status) {
      status.classList.remove('show', 'is-error');
      status.textContent = 'Enviando...';
      status.classList.add('show');
    }

    fetch('guardar.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then(() => {
        if (status) {
          status.textContent = 'Gracias, tu consulta fue registrada correctamente.';
          status.classList.remove('is-error');
        }
        form.reset();
      })
      .catch(() => {
        if (status) {
          status.textContent = 'No se pudo conectar con el servidor (guardar.php). Verifica que el sitio esté en un hosting con soporte PHP.';
          status.classList.add('is-error');
        }
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}
