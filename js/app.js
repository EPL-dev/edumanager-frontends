// app.js — Version finale sans boucle

document.addEventListener('DOMContentLoaded', async function() {
  var user = checkAuth();
  if (!user) return; // checkAuth redirige déjà vers index.html

  applyInterface(user);
  initNav();
  initSidebar();
  await updateDashboard();
});

function applyInterface(user) {
  var labels = { superadmin: '👑 Super Admin', admin: '🔑 Admin', etudiant: '🎓 Étudiant' };
  var nameEl = document.getElementById('user-display-name');
  var roleEl = document.getElementById('user-display-role');
  if (nameEl) nameEl.textContent = user.nom || user.username;
  if (roleEl) roleEl.textContent = labels[user.role] || user.role;

  var tb = document.getElementById('topbar-role');
  if (tb) { tb.textContent = labels[user.role] || user.role; tb.className = 'role-badge rb-' + user.role; }

  var isAdmin = (user.role === 'admin' || user.role === 'superadmin');
  var isSA    = (user.role === 'superadmin');
  var isEtu   = (user.role === 'etudiant');

  document.querySelectorAll('.admin-only').forEach(function(el) { el.classList[isAdmin ? 'remove' : 'add']('role-hidden'); });
  document.querySelectorAll('.superadmin-only').forEach(function(el) { el.classList[isSA ? 'remove' : 'add']('role-hidden'); });
  document.querySelectorAll('.student-visible').forEach(function(el) { el.classList[isEtu ? 'remove' : 'add']('role-hidden'); });
}

function initNav() {
  document.querySelectorAll('.nav-item[data-section]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      var id   = el.getAttribute('data-section');
      var span = el.querySelector('span');
      navigateTo(id, span ? span.textContent : id);
      closeSidebar();
    });
  });
}

function navigateTo(id, title) {
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
  var nav = document.querySelector('.nav-item[data-section="' + id + '"]');
  if (nav) nav.classList.add('active');
  var sec = document.getElementById('section-' + id);
  if (sec) { sec.style.display = 'block'; sec.classList.add('active'); }
  var tt = document.getElementById('topbar-title');
  if (tt) tt.textContent = title || id;
  loadSection(id);
}

async function loadSection(id) {
  switch (id) {
    case 'dashboard':     await updateDashboard(); break;
    case 'students':      await renderStudents(); break;
    case 'subjects':      await renderSubjects(); break;
    case 'attendance':    await initAttFilters(); await renderAttendance(); break;
    case 'grades':        await initGradeFilters(); await renderGrades(); await renderRanking(); break;
    case 'schedule':      await renderSchedule(); break;
    case 'announcements': await renderAnnouncements(); break;
    case 'documents':     await renderDocuments(); break;
    case 'users':         await renderUsers(); break;
    case 'my-grades':     await renderMyGrades(); break;
    case 'my-attendance': await renderMyAttendance(); break;
  }
}

function initSidebar() {
  var ham  = document.getElementById('hamburger');
  var cls  = document.getElementById('sidebar-close');
  var side = document.getElementById('sidebar');
  if (ham && side) ham.addEventListener('click', function() { side.classList.add('open'); });
  if (cls && side) cls.addEventListener('click', closeSidebar);
}
function closeSidebar() { var s = document.getElementById('sidebar'); if (s) s.classList.remove('open'); }

async function updateDashboard() {
  var res = await api.dashboard.stats();
  if (!res.success) {
    // Si erreur 401 → déjà géré par api.js
    // Sinon afficher message sans bloquer
    var ac = document.getElementById('absence-alerts');
    if (ac) ac.innerHTML = '<p class="empty-msg">Données non disponibles</p>';
    var arc = document.getElementById('recent-announcements');
    if (arc) arc.innerHTML = '<p class="empty-msg">Données non disponibles</p>';
    return;
  }

  var st = res.stats;
  setEl('stat-students', st.totalStudents || 0);
  setEl('stat-subjects', st.totalSubjects || 0);
  setEl('stat-presence', st.presenceRate !== null ? st.presenceRate + '%' : 'N/A');
  setEl('stat-avg',      st.classAvg !== null ? st.classAvg + '/20' : 'N/A');

  var ac = document.getElementById('absence-alerts');
  if (ac) {
    if (!st.absenceAlerts || !st.absenceAlerts.length) {
      ac.innerHTML = '<p class="empty-msg">Aucune alerte ✅</p>';
    } else {
      ac.innerHTML = st.absenceAlerts.map(function(a) {
        return '<div class="alert-item"><i class="fas fa-triangle-exclamation"></i> ' +
          escHtml(a.nom + ' ' + a.prenom) + ' — <strong>' + a.absences + ' absences</strong></div>';
      }).join('');
    }
  }

  var arc = document.getElementById('recent-announcements');
  if (arc) {
    if (!st.recentAnnouncements || !st.recentAnnouncements.length) {
      arc.innerHTML = '<p class="empty-msg">Aucune annonce publiée</p>';
    } else {
      arc.innerHTML = st.recentAnnouncements.map(function(a) {
        return '<div style="padding:.8rem;background:var(--bg3);border-radius:8px;margin-bottom:.5rem">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:.3rem">' +
          '<strong>' + escHtml(a.title) + '</strong>' +
          '<span style="font-size:.75rem;color:var(--muted)">' +
          new Date(a.createdAt).toLocaleDateString('fr-FR') + '</span></div>' +
          '<p style="color:var(--muted);font-size:.85rem">' + escHtml(a.body) + '</p></div>';
      }).join('');
    }
  }
}

async function renderMyGrades() {
  var tbody = document.getElementById('my-grades-tbody');
  var avgEl = document.getElementById('my-avg-display');
  if (!tbody) return;
  var user = getCurrentUser();
  showLoading(tbody, 4);
  var res = await api.grades.list({ student: user.studentId || '' });
  if (!res.success || !res.grades || !res.grades.length) {
    tbody.innerHTML = emptyRow(4, 'Aucune note enregistrée.');
    if (avgEl) avgEl.textContent = '–';
    return;
  }
  tbody.innerHTML = res.grades.map(function(g) {
    var c = parseFloat(g.value) >= 10 ? 'var(--green)' : 'var(--red)';
    return '<tr><td>' + escHtml(g.subjectName || '–') + '</td>' +
      '<td><strong style="color:' + c + '">' + g.value + '/20</strong></td>' +
      '<td><span class="badge" style="background:rgba(59,130,246,.1);color:var(--blue)">' + g.semester + '</span></td>' +
      '<td>' + getAppreciation(parseFloat(g.value)) + '</td></tr>';
  }).join('');
  var tp = 0, tc = 0;
  res.grades.forEach(function(g) { var co = g.coeff || 1; tp += parseFloat(g.value) * co; tc += co; });
  if (avgEl && tc) {
    var avg = (tp / tc).toFixed(2);
    avgEl.textContent = avg + '/20';
    avgEl.style.color = parseFloat(avg) >= 10 ? 'var(--green)' : 'var(--red)';
  }
}

async function renderMyAttendance() {
  var tbody = document.getElementById('my-attendance-tbody');
  if (!tbody) return;
  var user = getCurrentUser();
  showLoading(tbody, 3);
  var res = await api.attendance.list({ student: user.studentId || '' });
  if (!res.success) { tbody.innerHTML = emptyRow(3, 'Erreur chargement.'); return; }
  var recs = res.records || [];
  setEl('my-present-count', recs.filter(function(r) { return r.status === 'present'; }).length);
  setEl('my-retard-count',  recs.filter(function(r) { return r.status === 'retard'; }).length);
  setEl('my-absent-count',  recs.filter(function(r) { return r.status === 'absent'; }).length);
  if (!recs.length) { tbody.innerHTML = emptyRow(3, 'Aucun enregistrement.'); return; }
  var labels = { present: '✅ Présent', absent: '❌ Absent', retard: '⏰ Retard' };
  tbody.innerHTML = recs.map(function(r) {
    return '<tr><td>' + escHtml(r.subjectName || '–') + '</td>' +
      '<td>' + formatDate(r.date) + '</td>' +
      '<td><span class="badge badge-' + r.status + '">' + (labels[r.status] || r.status) + '</span></td></tr>';
  }).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  var clean = String(dateStr).split('T')[0];
  var parts = clean.split('-');
  if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
  return dateStr;
}

// Utilitaires
function setEl(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
function escHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function emptyRow(c, m) { return '<tr><td colspan="' + c + '" style="text-align:center;color:var(--muted);padding:2rem;font-style:italic">' + m + '</td></tr>'; }
function showLoading(el, cols) { if (typeof el === 'string') el = document.getElementById(el); if (el) el.innerHTML = emptyRow(cols, '<i class="fas fa-spinner fa-spin"></i> Chargement...'); }
function getAppreciation(v) {
  if (v >= 16) return '🌟 Très bien'; if (v >= 14) return '👍 Bien';
  if (v >= 12) return '✅ Assez bien'; if (v >= 10) return '📘 Passable';
  return '❌ Insuffisant';
}
function openModal(id)  { var m = document.getElementById(id); if (m) m.classList.add('open'); }
function closeModal(id) { var m = document.getElementById(id); if (m) m.classList.remove('open'); }
document.addEventListener('click', function(e) { if (e.target && e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); });
function showToast(msg, type) {
  var t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.className = 'toast ' + (type || 'success'); t.classList.remove('hidden');
  clearTimeout(t._t); t._t = setTimeout(function() { t.classList.add('hidden'); }, 3500);
}
function confirmDelete(msg) { return confirm(msg || 'Confirmer la suppression ?'); }
function fillSelect(id, items, valueFn, labelFn, allLabel) {
  var sel = document.getElementById(id); if (!sel) return;
  var prev = sel.value;
  sel.innerHTML = allLabel ? '<option value="">' + allLabel + '</option>' : '';
  (items || []).forEach(function(item) {
    var o = document.createElement('option');
    o.value = valueFn(item);
    o.textContent = labelFn(item);
    sel.appendChild(o);
  });
  if (prev) sel.value = prev;
}
