// api.js — Client HTTP centralisé avec JWT automatique

const api = {

  // ── Requête principale avec token automatique ────────
  async request(method, endpoint, data) {
    const token = localStorage.getItem('edu_token');

    const headers = { 'Content-Type': 'application/json' };

    // Ajouter le token JWT automatiquement
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const options = { method: method, headers: headers };
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const url = CONFIG.API_URL + endpoint;

    try {
      const response = await fetch(url, options);

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { success: false, message: 'Réponse invalide du serveur.' };
      }

      const json = await response.json();

      // Token expiré ou invalide → rediriger vers login
      if (response.status === 401) {
        localStorage.removeItem('edu_token');
        localStorage.removeItem('edu_user');
        if (!window.location.pathname.includes('index')) {
          window.location.href = 'index.html';
        }
        return { success: false, message: json.message || 'Session expirée.' };
      }

      return json;

    } catch (error) {
      console.error('Erreur API :', error);
      return {
        success: false,
        message: 'Impossible de contacter le serveur. Vérifiez votre connexion.'
      };
    }
  },

  // ── Raccourcis ────────────────────────────────────────
  get:    function(ep)       { return api.request('GET',    ep, null); },
  post:   function(ep, data) { return api.request('POST',   ep, data); },
  put:    function(ep, data) { return api.request('PUT',    ep, data); },
  delete: function(ep)       { return api.request('DELETE', ep, null); },

  // ── Auth ──────────────────────────────────────────────
  auth: {
    login:          function(d) { return api.post('/auth/login', d); },
    me:             function()  { return api.get('/auth/me'); },
    changePassword: function(d) { return api.put('/auth/change-password', d); },
    setup:          function(d) { return api.post('/auth/setup', d); },
  },

  // ── Users ─────────────────────────────────────────────
  users: {
    list:   function()      { return api.get('/users'); },
    create: function(d)     { return api.post('/users', d); },
    update: function(id, d) { return api.put('/users/' + id, d); },
    remove: function(id)    { return api.delete('/users/' + id); },
  },

  // ── Students ──────────────────────────────────────────
  students: {
    list:   function(p)     { return api.get('/students?' + new URLSearchParams(p || {}).toString()); },
    get:    function(id)    { return api.get('/students/' + id); },
    create: function(d)     { return api.post('/students', d); },
    update: function(id, d) { return api.put('/students/' + id, d); },
    remove: function(id)    { return api.delete('/students/' + id); },
  },

  // ── Subjects ──────────────────────────────────────────
  subjects: {
    list:   function()      { return api.get('/subjects'); },
    create: function(d)     { return api.post('/subjects', d); },
    update: function(id, d) { return api.put('/subjects/' + id, d); },
    remove: function(id)    { return api.delete('/subjects/' + id); },
  },

  // ── Grades ────────────────────────────────────────────
  grades: {
    list:    function(p)     { return api.get('/grades?' + new URLSearchParams(p || {}).toString()); },
    ranking: function()      { return api.get('/grades/ranking'); },
    create:  function(d)     { return api.post('/grades', d); },
    update:  function(id, d) { return api.put('/grades/' + id, d); },
    remove:  function(id)    { return api.delete('/grades/' + id); },
  },

  // ── Attendance ────────────────────────────────────────
  attendance: {
    list:        function(p) { return api.get('/attendance?' + new URLSearchParams(p || {}).toString()); },
    saveSession: function(d) { return api.post('/attendance/session', d); },
    update:      function(id, d) { return api.put('/attendance/' + id, d); },
  },

  // ── Schedule ──────────────────────────────────────────
  schedule: {
    list:   function()   { return api.get('/schedule'); },
    create: function(d)  { return api.post('/schedule', d); },
    remove: function(id) { return api.delete('/schedule/' + id); },
  },

  // ── Announcements ─────────────────────────────────────
  announcements: {
    list:   function()   { return api.get('/announcements'); },
    create: function(d)  { return api.post('/announcements', d); },
    remove: function(id) { return api.delete('/announcements/' + id); },
  },

  // ── Documents ─────────────────────────────────────────
  documents: {
    list:   function()   { return api.get('/documents'); },
    create: function(d)  { return api.post('/documents', d); },
    remove: function(id) { return api.delete('/documents/' + id); },
  },

  // ── Dashboard ─────────────────────────────────────────
  dashboard: {
    stats: function() { return api.get('/dashboard/stats'); },
  },
};
