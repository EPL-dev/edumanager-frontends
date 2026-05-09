// users.js — avec liaison matière pour admins

async function renderUsers() {
  var tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  showLoading(tbody, 8);

  var res  = await api.users.list();
  var user = getCurrentUser();

  if (!res.success) { tbody.innerHTML = emptyRow(8, 'Erreur : ' + res.message); return; }

  var labels = { superadmin: '👑 Super Admin', admin: '🔑 Admin', etudiant: '🎓 Étudiant' };
  var colors = { superadmin: 'badge-sa', admin: 'badge-ad', etudiant: 'badge-et' };

  tbody.innerHTML = res.users.map(function(u, i) {
    var isSelf  = u.id === user.id;
    var linked  = (u.studentNom && u.studentPrenom) ? u.studentNom + ' ' + u.studentPrenom : '–';
    var subject = u.subjectName || '–';

    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td><code style="font-family:monospace;color:var(--blue)">' + escHtml(u.username) + '</code></td>' +
      '<td>' + escHtml(u.nom || '–') + '</td>' +
      '<td><span class="badge ' + (colors[u.role] || '') + '">' + (labels[u.role] || u.role) + '</span></td>' +
      '<td>' + escHtml(subject) + '</td>' +
      '<td>' + escHtml(linked) + '</td>' +
      '<td>' + (u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '–') + '</td>' +
      '<td>' + (isSelf
        ? '<em style="color:var(--muted);font-size:.78rem">Vous</em>'
        : '<button class="btn-icon edit" onclick="openEditUser(' + u.id + ')"><i class="fas fa-pen"></i></button>' +
          '<button class="btn-icon del"  onclick="deleteUser(' + u.id + ')"><i class="fas fa-trash"></i></button>'
      ) + '</td></tr>';
  }).join('');
}

function openUserModal() {
  ['user-id','user-username','user-nom','user-email','user-password'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('user-role').value = 'etudiant';
  setEl('modal-user-title', 'Ajouter un compte');
  setEl('user-password-hint', '');
  toggleStudentLink('etudiant');
  toggleSubjectLink('etudiant');
  openModal('modal-user');
}

async function openEditUser(id) {
  var res = await api.users.list();
  if (!res.success) return;
  var u = res.users.find(function(x) { return x.id === id; });
  if (!u) return;

  document.getElementById('user-id').value       = u.id;
  document.getElementById('user-username').value = u.username;
  document.getElementById('user-nom').value      = u.nom || '';
  document.getElementById('user-email').value    = u.email || '';
  document.getElementById('user-password').value = '';
  document.getElementById('user-role').value     = u.role;

  setEl('modal-user-title', 'Modifier le compte');
  setEl('user-password-hint', 'Laisser vide = mot de passe inchangé');

  toggleStudentLink(u.role);
  toggleSubjectLink(u.role);

  if (u.role === 'etudiant') await fillStudentLinkSelect(u.studentId);
  if (u.role === 'admin')    await fillSubjectLinkSelect(u.subjectId);

  openModal('modal-user');
}

async function fillStudentLinkSelect(selected) {
  var res = await api.students.list({ limit: 1000 });
  fillSelect('user-student-link', res.students || [],
    function(s) { return s.id; },
    function(s) { return s.nom + ' ' + s.prenom + ' (' + s.matricule + ')'; },
    '— Aucun étudiant lié —'
  );
  if (selected) document.getElementById('user-student-link').value = selected;
}

async function fillSubjectLinkSelect(selected) {
  var res = await api.subjects.list();
  fillSelect('user-subject-link', res.subjects || [],
    function(s) { return s.id; },
    function(s) { return s.name; },
    '— Aucune matière assignée —'
  );
  if (selected) document.getElementById('user-subject-link').value = selected;
}

function toggleStudentLink(role) {
  var row = document.getElementById('student-link-row');
  if (row) row.style.display = (role === 'etudiant') ? '' : 'none';
  if (role === 'etudiant') fillStudentLinkSelect(null);
}

function toggleSubjectLink(role) {
  var row = document.getElementById('subject-link-row');
  if (row) row.style.display = (role === 'admin') ? '' : 'none';
  if (role === 'admin') fillSubjectLinkSelect(null);
}

async function saveUser() {
  var id        = document.getElementById('user-id').value;
  var username  = (document.getElementById('user-username').value || '').trim();
  var nom       = (document.getElementById('user-nom').value || '').trim();
  var email     = (document.getElementById('user-email').value || '').trim();
  var password  = document.getElementById('user-password').value || '';
  var role      = document.getElementById('user-role').value;
  var studentId = role === 'etudiant' ? (document.getElementById('user-student-link')?.value || null) : null;
  var subjectId = role === 'admin'    ? (document.getElementById('user-subject-link')?.value || null) : null;

  if (!username || !nom) { showToast('Identifiant et nom requis.', 'error'); return; }
  if (!id && (!password || password.length < 4)) { showToast('Mot de passe requis (min 4 caractères).', 'error'); return; }

  var data = { username: username, nom: nom, email: email, role: role, studentId: studentId, subjectId: subjectId };
  if (password) data.password = password;

  var res = id ? await api.users.update(id, data) : await api.users.create(data);
  if (!res.success) { showToast(res.message, 'error'); return; }

  showToast(id ? 'Compte modifié ✅' : 'Compte créé ✅');
  closeModal('modal-user');
  renderUsers();
}

async function deleteUser(id) {
  if (!confirmDelete('Supprimer ce compte utilisateur ?')) return;
  var res = await api.users.remove(id);
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast('Compte supprimé.');
  renderUsers();
}
