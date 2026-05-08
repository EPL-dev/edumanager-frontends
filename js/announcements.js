// announcements.js — MySQL version

async function renderAnnouncements() {
  var c = document.getElementById('announcements-list');
  if (!c) return;
  c.innerHTML = '<p style="color:var(--muted);padding:1rem"><i class="fas fa-spinner fa-spin"></i> Chargement...</p>';

  var res     = await api.announcements.list();
  var user    = getCurrentUser();
  var isAdmin = (user.role === 'admin' || user.role === 'superadmin');

  if (!res.success) { c.innerHTML = '<p style="color:var(--muted);padding:1rem">Erreur chargement.</p>'; return; }
  if (!res.announcements.length) { c.innerHTML = '<p style="color:var(--muted);padding:1rem">Aucune annonce publiée.</p>'; return; }

  c.innerHTML = res.announcements.map(function(a) {
    return '<div class="ann-card">' +
      '<div class="ann-card-hd">' +
        '<span class="ann-card-title">📢 ' + escHtml(a.title) + '</span>' +
        '<span class="ann-date">' + new Date(a.createdAt).toLocaleDateString('fr-FR') + '</span>' +
      '</div>' +
      '<p class="ann-body">' + escHtml(a.body) + '</p>' +
      (isAdmin ? '<div style="margin-top:.75rem"><button class="btn-icon del" onclick="deleteAnnouncement(' + a.id + ')"><i class="fas fa-trash"></i> Supprimer</button></div>' : '') +
    '</div>';
  }).join('');
}

function openAnnouncementModal() {
  document.getElementById('ann-title').value = '';
  document.getElementById('ann-body').value  = '';
  openModal('modal-announcement');
}

async function saveAnnouncement() {
  var title = document.getElementById('ann-title').value.trim();
  var body  = document.getElementById('ann-body').value.trim();
  if (!title || !body) { showToast('Titre et message requis.', 'error'); return; }

  var res = await api.announcements.create({ title: title, body: body });
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast('Annonce publiée ✅');
  closeModal('modal-announcement');
  renderAnnouncements();
}

async function deleteAnnouncement(id) {
  if (!confirmDelete('Supprimer cette annonce ?')) return;
  var res = await api.announcements.remove(id);
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast('Annonce supprimée.');
  renderAnnouncements();
}
