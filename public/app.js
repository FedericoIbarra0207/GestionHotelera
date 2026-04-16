/

// Smooth scroll para links internos - 
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // No prevenir si es solo "#"
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Manejo del formulario de contacto
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtener datos del formulario
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // Mostrar mensaje de éxito
        alert('✅ Gracias por tu interés. Nos pondremos en contacto pronto.');
        this.reset();
    });
}

// Efecto parallax en hero
window.addEventListener('scroll', function() {
    const hero = document.querySelector('.hero');
    if (hero) {
        const scrollPosition = window.pageYOffset;
        hero.style.backgroundPosition = `0 ${scrollPosition * 0.5}px`;
    }
});

// Animación de entrada de elementos
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .benefit-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// Contador de stats (animación)
function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Iniciar contadores cuando se ve la sección
const statsElements = document.querySelectorAll('.stat-number');
const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.textContent);
            animateCounter(entry.target, target);
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

statsElements.forEach(el => statsObserver.observe(el));

console.log('✅ Landing Page cargado correctamente');

function authFetch(url, opts = {}) {
  const headers = opts.headers || {};
  headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  /**
   * authFetch: wrapper sobre fetch que añade Authorization cuando hay token.
   * - url: ruta relativa a la API (ej. '/habitaciones')
   * - opts: mismas opciones que fetch
   * Retorna la Response. Lanza Error y limpia token en caso de 401.
   */
  return fetch(base + url, { ...opts, headers }).then(async res => {
    if (res.status === 401) {
      // Token inválido o expirado -> redirigir a login y limpiar token
      setToken(null);
      // pequeña espera para que UI actualice
      window.location.hash = '#home';
      throw new Error('Unauthorized');
    }
    return res;
  });
}

function renderToken() {
  const block = document.getElementById('tokenBlock');
  const t = getToken();
  block.textContent = t ? t : '(no autenticado)';
}

// Login
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMsg');
  msg.textContent = 'Enviando...';
  try {
    const res = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login falló: ' + res.status);
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      msg.textContent = 'Login OK';
      renderUserInfo();
      // After login, populate selects and availability
      populateHabitacionSelects();
      populateReservaSelects();
    } else {
      msg.textContent = 'Respuesta no contiene token';
    }
  } catch (err) {
    console.error(err);
    msg.textContent = 'Error en login. Mira la consola.';
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  setToken(null);
});

// Register
const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('regNombre').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const rol = document.getElementById('regRol').value;
  const msg = document.getElementById('regMsg');
  msg.textContent = 'Enviando...';
  try {
    const res = await fetch(base + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, rol })
    });
    if (res.status === 201) {
      const data = await res.json();
      msg.textContent = 'Usuario creado. id: ' + (data.id || '(sin id)');
    } else {
      const err = await res.json();
      msg.textContent = err.message || ('Error: ' + res.status);
    }
  } catch (err) {
    console.error(err);
    msg.textContent = 'Error registrando. Mira la consola.';
  }
});

// Cargar habitaciones
document.getElementById('loadHabitaciones').addEventListener('click', async () => {
  const container = document.getElementById('habitacionesList');
  container.innerHTML = 'Cargando...';
  try {
    const res = await authFetch('/habitaciones');
    if (!res.ok) throw new Error('Status ' + res.status);
    const list = await res.json();
    if (!Array.isArray(list)) {
      container.textContent = JSON.stringify(list, null, 2);
      return;
    }
    // Render rooms with type and price
    container.innerHTML = '';
    list.forEach(h => {
      const el = document.createElement('div');
      el.className = 'habitacion-card mb-2';
      const tipo = h.tipo || h.category || h.tipoHabitacion || 'N/A';
      const precio = h.precio != null ? `\$ ${h.precio}` : '—';
      el.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <strong>${h.nombre || 'Habitación ' + (h.id || '')}</strong>
            <div class="text-muted small">Tipo: ${tipo}</div>
          </div>
          <div class="text-end">
            <div class="fw-bold">${precio}</div>
          </div>
        </div>
        <div class="mt-2">ID: ${h.id || ''}</div>
      `;
      container.appendChild(el);
    });
  } catch (err) {
    console.error(err);
    container.textContent = 'Error cargando habitaciones. Mira la consola.';
  }
});

/**
 * loadHabitaciones: helper para cargar y renderizar habitaciones.
 * Llamado al pulsar el botón "Cargar habitaciones" o al navegar a la sección.
 */


/**
 * Check availability for a room between two dates (inclusive start, exclusive end).
 * Calls GET /api/disponibilidades/:habitacionId and looks for any entry with
 * fecha inside [fechaInicio, fechaFin) and disponible === false.
 * @param {string} habitacionId
 * @param {string} fechaInicio - YYYY-MM-DD
 * @param {string} fechaFin - YYYY-MM-DD
 * @returns {Promise<{available:boolean, blockedDates:string[]}>}
 */
async function checkAvailability(habitacionId, fechaInicio, fechaFin){
  if(!habitacionId || !fechaInicio || !fechaFin) return { available: true, blockedDates: [] };
  try{
    const res = await authFetch(`/disponibilidades/${habitacionId}`);
    if(!res.ok) return { available: true, blockedDates: [] };
    const list = await res.json();
    // build set of blocked dates
    const blocked = new Set(list.filter(x=>x.disponible===false).map(x=>x.fecha));
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    const blockedDates = [];
    const cur = new Date(start);
    while(cur < end){
      const y = cur.getFullYear();
      const m = String(cur.getMonth()+1).padStart(2,'0');
      const d = String(cur.getDate()).padStart(2,'0');
      const s = `${y}-${m}-${d}`;
      if(blocked.has(s)) blockedDates.push(s);
      cur.setDate(cur.getDate()+1);
    }
    return { available: blockedDates.length === 0, blockedDates };
  }catch(e){
    console.error('checkAvailability error', e);
    return { available: true, blockedDates: [] };
  }
}

// utility: parse JWT payload
function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g,'+').replace(/_/g,'/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch (e) { return null; }
}

/**
 * parseJwt: extrae payload de un JWT (no valida firma). Devuelve objeto JSON del payload.
 * Uso: obtener email/rol del token para mostrar en UI.
 */

function renderUserInfo(){
  const info = document.getElementById('userInfo');
  const token = getToken();
  if(!info) return;
  if(!token) { info.textContent = 'No autenticado'; return; }
  const p = parseJwt(token);
  if(p){
    info.textContent = `${p.email || ''} · ${p.rol || ''}`;
  } else {
    info.textContent = '(usuario)';
  }
}

// Simple hash-based routing: show/hide containers
function initRouting(){
  const links = document.querySelectorAll('nav a');
  links.forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      links.forEach(l=>l.classList.remove('active'));
      a.classList.add('active');
      const h = a.getAttribute('href') || '';
      window.location.hash = h;
      // call loaders based on hash
      if(h.includes('#habitaciones')){
        document.getElementById('habitacionesList').scrollIntoView();
      } else if(h.includes('#usuarios')){
        loadUsers();
        document.getElementById('usersList').scrollIntoView();
      
      } else if(h.includes('#reservas')){
        populateReservaSelects();
        document.getElementById('createReservaForm').scrollIntoView();
      }
    });
  });

  // initial load based on hash
  const h = window.location.hash || '#home';
  const target = document.querySelector(`nav a[href="${h}"]`);
  if(target){ target.classList.add('active'); target.click(); }
}

// Usuarios: listar (solo ADMIN)
async function loadUsers(){
  const container = document.getElementById('habitacionesList');
  const usersBox = document.getElementById('usersList');
  if (!usersBox) return;
  usersBox.innerHTML = 'Cargando usuarios...';
  try{
    const res = await authFetch('/users');
    if (!res.ok) throw new Error('Status ' + res.status);
    const users = await res.json();
    if (!Array.isArray(users)) {
      usersBox.textContent = JSON.stringify(users, null, 2);
      return;
    }
    usersBox.innerHTML = '';
    // show full table for admin
    const table = document.createElement('table');
    table.className = 'table table-sm text-white';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Nombre</th><th>Email</th><th>Rol</th><th>ID</th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.nombre || ''}</td><td>${u.email}</td><td>${u.rol}</td><td>${u.id}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    usersBox.appendChild(table);
  }catch(err){
    console.error(err);
    usersBox.textContent = 'Error cargando usuarios. Revisa permisos o inicia sesión como admin.';
  }
}

/**
 * loadUsers: solicita el listado de usuarios (requiere token ADMIN) y muestra una tabla.
 */

// Disponibilidades removed: frontend simplified for demo

// Reserva: poblar selects (usuarios y habitaciones)
async function populateReservaSelects(){
  const userSelect = document.getElementById('reservaUsuarioId');
  const habSelect = document.getElementById('reservaHabitacionId');
  if(!userSelect || !habSelect) return;
  userSelect.innerHTML = '<option value="">Cargando...</option>';
  habSelect.innerHTML = '<option value="">Cargando...</option>';
  try{
    // Usuarios: requiere ADMIN endpoint; if fails, allow current user as option
    let users = [];
    try{
      const ru = await authFetch('/users');
      if(ru.ok) users = await ru.json();
    }catch(e){
      // no listado disponible, fallback: use current token user info not available in frontend
      users = [];
    }
    userSelect.innerHTML = '';
    if(users.length===0){
      userSelect.innerHTML = '<option value="">(No hay usuarios listados - usar ID manual)</option>';
    } else {
      users.forEach(u=>{
        const o = document.createElement('option'); o.value = u.id; o.textContent = `${u.nombre || ''} (${u.email})`; userSelect.appendChild(o);
      });
    }

    // poblar selects de habitaciones también
    await populateHabitacionSelects();
    // now populate reserva's habitacion select from populated options
    const habOptions = document.querySelectorAll('#reservaHabitacionId option');
    if(habOptions.length === 0) {
      habSelect.innerHTML = '<option value="">No hay habitaciones</option>';
    }
  }catch(e){
    console.error(e);
    if(e.message && e.message.toLowerCase().includes('unauthorized')){
      habSelect.innerHTML = '<option value="">Inicia sesión para ver habitaciones</option>';
    } else {
      habSelect.innerHTML = '<option value="">Error cargando habitaciones</option>';
    }
  }
}

/**
 * populateReservaSelects: carga usuarios (si es posible) y habitaciones para los selects del formulario de reserva.
 */

// Poblar selects de habitaciones para reservas y disponibilidades
async function populateHabitacionSelects(){
  try{
    const rh = await authFetch('/habitaciones');
    if(!rh.ok) throw new Error('No se pudieron obtener habitaciones');
    const hs = await rh.json();
    const habSelect = document.getElementById('reservaHabitacionId');
    const dispSelect = document.getElementById('dispHabitacionId');
    if(habSelect){ habSelect.innerHTML = ''; hs.forEach(h=>{ const o = document.createElement('option'); o.value = h.id; o.textContent = h.nombre || h.id; habSelect.appendChild(o); }); }
    if(dispSelect){ dispSelect.innerHTML = ''; hs.forEach(h=>{ const o = document.createElement('option'); o.value = h.id; o.textContent = h.nombre || h.id; dispSelect.appendChild(o); }); }
  }catch(e){
    console.error('Error poblando selects habitaciones', e);
    const habSelect = document.getElementById('reservaHabitacionId');
    const dispSelect = document.getElementById('dispHabitacionId');
    if(habSelect) habSelect.innerHTML = '<option value="">No hay habitaciones</option>';
    if(dispSelect) dispSelect.innerHTML = '<option value="">No hay habitaciones</option>';
  }
}

/**
 * populateHabitacionSelects: consulta /habitaciones y rellena los selects usados por reservas.
 */

// Handler crear reserva (completo)
const createReservaForm2 = document.getElementById('createReservaForm');
createReservaForm2.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const usuarioId = document.getElementById('reservaUsuarioId').value;
  const habitacionId = document.getElementById('reservaHabitacionId').value;
  const fechaInicio = document.getElementById('reservaFechaInicio').value;
  const fechaFin = document.getElementById('reservaFechaFin').value;
  const msg = document.getElementById('reservaMsg');
  msg.textContent = '';
  // Validaciones claras
  if(!usuarioId){ msg.textContent='Selecciona un usuario.'; return; }
  if(!habitacionId){ msg.textContent='Selecciona una habitación.'; return; }
  if(!fechaInicio || !fechaFin){ msg.textContent='Completa ambas fechas.'; return; }
  if(new Date(fechaInicio) >= new Date(fechaFin)){ msg.textContent='La fecha de inicio debe ser anterior a la de fin.'; return; }
  // Antes de crear, comprobar disponibilidad para el rango
  try{
    const avail = await checkAvailability(habitacionId, fechaInicio, fechaFin);
    if(!avail.available){
      msg.textContent = `No disponible en las fechas: ${avail.blockedDates.join(', ')}`;
      return;
    }

    const body = { usuarioId, habitacionId, fechaInicio, fechaFin };
    const res = await authFetch('/reservas', { method: 'POST', body: JSON.stringify(body) });
    if(res.status===201||res.status===200){ const data = await res.json(); msg.textContent = 'Reserva creada.'; }
    else { const err = await res.json(); msg.textContent = err.message || ('Error: '+res.status); }
  }catch(e){ console.error(e); msg.textContent = 'Error creando reserva. Revisa permisos o token.'; }
});

// Disponibilidades management removed from frontend (handled by backend/admin tools)

// Inicializaciones
initRouting();
renderToken();
renderUserInfo();
populateReservaSelects();

// Mostrar base en consola para depuración
console.log('API base:', base);
