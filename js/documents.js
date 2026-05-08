// documents.js — MySQL version

async function renderDocuments() {
  var c = document.getElementById('documents-list');
  if (!c) return;
  c.innerHTML = '<p style="color:var(--muted);padding:1rem"><i class="fas fa-spinner fa-spin"></i> Chargement...</p>';

  var res     = await api.documents.list();
  var user    = getCurrentUser();
  var isAdmin = (user.role === 'admin' || user.role === 'superadmin');

  if (!res.success) { c.innerHTML = '<p style="color:var(--muted);padding:1rem">Erreur chargement.</p>'; return; }
  if (!res.documents.length) { c.innerHTML = '<p style="color:var(--muted);padding:1rem">Aucun document disponible.</p>'; return; }

  var icons = { pdf: '📄', doc: '📝', autre: '📁' };
  c.innerHTML = res.documents.map(function(d) {
    return '<div class="doc-card">' +
      '<div class="doc-icon">' + (icons[d.type] || '📁') + '</div>' +
      '<div class="doc-name">' + escHtml(d.name) + '</div>' +
      '<div class="doc-actions">' +
        '<a href="' + escHtml(d.url) + '" target="_blank" rel="noopener" class="btn-primary sm"><i class="fas fa-download"></i> Télécharger</a>' +
        (isAdmin ? '<button class="btn-icon del" onclick="deleteDocument(' + d.id + ')"><i class="fas fa-trash"></i></button>' : '') +
      '</div></div>';
  }).join('');
}

function openDocumentModal() {
  document.getElementById('doc-name').value = '';
  document.getElementById('doc-url').value  = '';
  document.getElementById('doc-type').value = 'pdf';
  openModal('modal-document');
}

async function saveDocument() {
  var name = document.getElementById('doc-name').value.trim();
  var url  = document.getElementById('doc-url').value.trim();
  var type = document.getElementById('doc-type').value;

  if (!name || !url) { showToast('Nom et lien requis.', 'error'); return; }
  try { new URL(url); } catch(e) { showToast('URL invalide.', 'error'); return; }

  var res = await api.documents.create({ name: name, url: url, type: type });
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast('Document ajouté ✅');
  closeModal('modal-document');
  renderDocuments();
}

async function deleteDocument(id) {
  if (!confirmDelete('Supprimer ce document ?')) return;
  var res = await api.documents.remove(id);
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast('Document supprimé.');
  renderDocuments();
}
