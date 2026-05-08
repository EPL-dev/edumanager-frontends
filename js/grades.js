// grades.js — MySQL version

async function initGradeFilters() {
  await fillSubjectsSelect('grade-subject-filter', true);
  await fillSubjectsSelect('grade-subject', false);
  await fillStudentsSelect('grade-student');
}

async function renderGrades() {
  var tbody = document.getElementById('grades-tbody');
  if (!tbody) return;
  showLoading(tbody, 5);

  var params = {};
  var sem  = document.getElementById('grade-sem-filter')?.value;
  var subj = document.getElementById('grade-subject-filter')?.value;
  if (sem)  params.semester = sem;
  if (subj) params.subject  = subj;

  var res = await api.grades.list(params);
  if (!res.success) { tbody.innerHTML = emptyRow(5, 'Erreur chargement.'); return; }
  if (!res.grades.length) { tbody.innerHTML = emptyRow(5, 'Aucune note enregistrée.'); return; }

  tbody.innerHTML = res.grades.map(function(g) {
    var c = parseFloat(g.value) >= 10 ? 'var(--green)' : 'var(--red)';
    return '<tr>' +
      '<td>' + escHtml((g.nom || '') + ' ' + (g.prenom || '')) + '</td>' +
      '<td>' + escHtml(g.subjectName || '–') + '</td>' +
      '<td><strong style="color:' + c + ';font-size:1rem">' + g.value + '/20</strong></td>' +
      '<td><span class="badge badge-sem">' + g.semester + '</span></td>' +
      '<td>' +
        '<button class="btn-icon edit" onclick="editGrade(' + g.id + ',' + g.studentId + ',' + g.subjectId + ',' + g.value + ',\'' + g.semester + '\')"><i class="fas fa-pen"></i></button>' +
        '<button class="btn-icon del"  onclick="deleteGrade(' + g.id + ')"><i class="fas fa-trash"></i></button>' +
      '</td></tr>';
  }).join('');

  await renderRanking();
}

async function renderRanking() {
  var tbody = document.getElementById('ranking-tbody');
  if (!tbody) return;
  showLoading(tbody, 4);

  var res = await api.grades.ranking();
  if (!res.success || !res.ranking.length) { tbody.innerHTML = emptyRow(4, 'Aucun classement disponible.'); return; }

  var medals = ['🥇', '🥈', '🥉'];
  tbody.innerHTML = res.ranking.map(function(r, i) {
    var avg = r.average !== null ? parseFloat(r.average).toFixed(2) : null;
    var c   = avg !== null ? (parseFloat(avg) >= 10 ? 'color:var(--green)' : 'color:var(--red)') : '';
    return '<tr class="' + (i < 3 ? 'rank-' + (i + 1) : '') + '">' +
      '<td style="font-size:1.1rem">' + (i < 3 ? medals[i] : (i + 1)) + '</td>' +
      '<td>' + escHtml((r.nom || '') + ' ' + (r.prenom || '')) + '</td>' +
      '<td style="' + c + ';font-weight:700">' + (avg !== null ? avg + '/20' : 'N/A') + '</td>' +
      '<td style="font-size:.82rem">' + (avg !== null ? getAppreciation(parseFloat(avg)) : '–') + '</td></tr>';
  }).join('');
}

function openGradeModal() {
  document.getElementById('grade-id').value    = '';
  document.getElementById('grade-value').value = '';
  document.getElementById('grade-sem').value   = 'S1';
  setEl('modal-grade-title', 'Ajouter une note');
  openModal('modal-grade');
}

function editGrade(id, studentId, subjectId, value, semester) {
  document.getElementById('grade-id').value      = id;
  document.getElementById('grade-student').value = studentId;
  document.getElementById('grade-subject').value = subjectId;
  document.getElementById('grade-value').value   = value;
  document.getElementById('grade-sem').value     = semester;
  setEl('modal-grade-title', 'Modifier la note');
  openModal('modal-grade');
}

async function saveGrade() {
  var id        = document.getElementById('grade-id').value;
  var studentId = document.getElementById('grade-student').value;
  var subjectId = document.getElementById('grade-subject').value;
  var value     = parseFloat(document.getElementById('grade-value').value);
  var semester  = document.getElementById('grade-sem').value;

  if (!studentId || !subjectId || isNaN(value) || value < 0 || value > 20) {
    showToast('Données invalides (note entre 0 et 20).', 'error'); return;
  }

  var data = { studentId: studentId, subjectId: subjectId, value: value, semester: semester };
  var res  = id ? await api.grades.update(id, data) : await api.grades.create(data);

  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast(id ? 'Note modifiée ✅' : 'Note ajoutée ✅');
  closeModal('modal-grade');
  renderGrades();
}

async function deleteGrade(id) {
  if (!confirmDelete('Supprimer cette note ?')) return;
  var res = await api.grades.remove(id);
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast('Note supprimée.');
  renderGrades();
}

async function fillStudentsSelect(selId) {
  var res = await api.students.list({ limit: 1000 });
  fillSelect(selId, res.students || [], function(s) { return s.id; }, function(s) { return s.nom + ' ' + s.prenom; }, null);
}
