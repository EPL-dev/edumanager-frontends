// subjects.js — Admin lecture seule uniquement

async function renderSubjects() {
  var tbody = document.getElementById('subjects-tbody');
  if (!tbody) return;
  showLoading(tbody, 4);

  var res  = await api.subjects.list();
  var user = getCurrentUser();
  var isSA = (user.role === 'superadmin');

  var btnAdd = document.querySelector('#section-subjects .btn-primary');
  if (btnAdd) btnAdd.style.display = isSA ? '' : 'none';

  if (!res.success) { tbody.innerHTML = emptyRow(4, 'Erreur chargement.'); return; }
  if (!res.subjects.length) { tbody.innerHTML = emptyRow(4, 'Aucune matière.'); return; }

  tbody.innerHTML = res.subjects.map(function(s, i) {
    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td><strong>' + escHtml(s.name) + '</strong></td>' +
      '<td><span class="badge badge-coeff">Coeff. ' + s.coeff + '</span></td>' +
      '<td>' + (isSA
        ? '<button class="btn-icon edit" onclick="editSubject(' + s.id + ',\'' + escHtml(s.name) + '\',' + s.coeff + ')"><i class="fas fa-pen"></i></button>' +
          '<button class="btn-icon del" onclick="deleteSubject(' + s.id + ')"><i class="fas fa-trash"></i></button>'
        : '–') +
      '</td></tr>';
  }).join('');
}

function openSubjectModal() {
  document.getElementById('subject-id').value    = '';
  document.getElementById('subject-name').value  = '';
  document.getElementById('subject-coeff').value = '';
  setEl('modal-subject-title', 'Ajouter une matière');
  openModal('modal-subject');
}

function editSubject(id, name, coeff) {
  document.getElementById('subject-id').value    = id;
  document.getElementById('subject-name').value  = name;
  document.getElementById('subject-coeff').value = coeff;
  setEl('modal-subject-title', 'Modifier la matière');
  openModal('modal-subject');
}

async function saveSubject() {
  var id    = document.getElementById('subject-id').value;
  var name  = document.getElementById('subject-name').value.trim();
  var coeff = parseInt(document.getElementById('subject-coeff').value);
  if (!name || !coeff || coeff < 1 || coeff > 10) { showToast('Données invalides.', 'error'); return; }
  var res = id
    ? await api.subjects.update(id, { name: name, coeff: coeff })
    : await api.subjects.create({ name: name, coeff: coeff });
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast(id ? 'Matière modifiée ✅' : 'Matière ajoutée ✅');
  closeModal('modal-subject');
  renderSubjects();
}

async function deleteSubject(id) {
  if (!confirmDelete('Supprimer cette matière ?')) return;
  var res = await api.subjects.remove(id);
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast('Matière supprimée.');
  renderSubjects();
}

async function fillSubjectsSelect(selId, withAll) {
  var res  = await api.subjects.list();
  var user = getCurrentUser();
  var list = res.subjects || [];

  if (user.role === 'admin' && user.subjectId) {
    list = list.filter(function(s) { return s.id == user.subjectId; });
  }

  fillSelect(selId, list,
    function(s) { return s.id; },
    function(s) { return s.name; },
    withAll ? '— Toutes les matières —' : null
  );
}
