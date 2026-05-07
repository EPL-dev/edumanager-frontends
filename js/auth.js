// auth.js — Authentification JWT Production

async function handleLogin() {
  var username = (document.getElementById('username').value || '').trim();
  var password = document.getElementById('password').value || '';

  if (!username || !password) {
    showLoginError('Veuillez remplir tous les champs.');
    return;
  }

  // Afficher loading
  var btn = document.getElementById('btn-login');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
  }

  try {
    var res = await api.auth.login({ username: username, password: password });

    if (!res.success) {
      showLoginError(res.message || 'Identifiants incorrects.');
      return;
    }

    // Stocker le token JWT et les infos utilisateur
    localStorage.setItem('edu_token', res.token);
    localStorage.setItem('edu_user', JSON.stringify(res.user));

    // Rediriger vers le dashboard
    window.location.href = 'dashboard.html';

  } catch (err) {
    showLoginError('Erreur de connexion. Réessayez.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Se connecter</span><i class="fas fa-arrow-right"></i>';
    }
  }
}

function showLoginError(msg) {
  var d = document.getElementById('login-error');
  var m = document.getElementById('login-error-msg');
  if (m) m.textContent = msg;
  if (d) d.classList.remove('hidden');
}

function handleLogout() {
  localStorage.removeItem('edu_token');
  localStorage.removeItem('edu_user');
  window.location.href = 'index.html';
}

function checkAuth() {
  var token = localStorage.getItem('edu_token');
  var user  = getCurrentUser();
  if (!token || !user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('edu_user'));
  } catch(e) {
    return null;
  }
}

function applyInterface(user) {
  var labels = {
    superadmin: '👑 Super Admin',
    admin:      '🔑 Admin',
    etudiant:   '🎓 Étudiant'
  };

  var nameEl = document.getElementById('user-display-name');
  var roleEl = document.getElementById('user-display-role');
  if (nameEl) nameEl.textContent = user.nom || user.username;
  if (roleEl) roleEl.textContent = labels[user.role] || user.role;

  var tb = document.getElementById('topbar-role');
  if (tb) {
    tb.textContent = labels[user.role] || user.role;
    tb.className   = 'role-badge rb-' + user.role;
  }

  var isAdmin = (user.role === 'admin' || user.role === 'superadmin');
  var isSA    = (user.role === 'superadmin');
  var isEtu   = (user.role === 'etudiant');

  document.querySelectorAll('.admin-only').forEach(function(el) {
    el.classList[isAdmin ? 'remove' : 'add']('role-hidden');
  });
  document.querySelectorAll('.superadmin-only').forEach(function(el) {
    el.classList[isSA ? 'remove' : 'add']('role-hidden');
  });
  document.querySelectorAll('.student-visible').forEach(function(el) {
    el.classList[isEtu ? 'remove' : 'add']('role-hidden');
  });
}

// Toggle mot de passe
document.addEventListener('DOMContentLoaded', function() {
  var toggleBtn = document.getElementById('toggle-pw');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      var inp = document.getElementById('password');
      var ico = document.getElementById('eye-icon');
      if (!inp) return;
      if (inp.type === 'password') {
        inp.type = 'text';
        ico.className = 'fas fa-eye-slash';
      } else {
        inp.type = 'password';
        ico.className = 'fas fa-eye';
      }
    });
  }

  // Connexion avec Entrée
  var pw = document.getElementById('password');
  if (pw) {
    pw.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleLogin();
    });
  }
});
