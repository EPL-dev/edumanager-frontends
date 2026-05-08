// attendance.js — MySQL version (corrigé)

var attSession = {};

// Formater la date proprement
function formatDate(dateStr) {
  if (!dateStr) return '–';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // Si c'est déjà au format YYYY-MM-DD
    var parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return dateStr;
  }
  return d.toLocaleDateString('fr-FR');
}

async function initAttFilters() {
  await fillSubjectsSelect('att-subject-filter', true);
  var d = document.getElementById('att-date-filter');
  if (d && !d.value) d.value = new Date().toISOString().split('T')[0];
}

async function renderAttendance() {
  var tbody = document.getElementById('attendance-tbody');
  if (!tbody) return;
  showLoading(tbody, 5);

  var params = {};
  var subj = document.getElementById('att-subject-filter')?.value;
  var date = document.getElementById('att-date-filter')?.value;
  if (subj) params.subject = subj;
  if (date) params.date    = date;

  var res     = await api.attendance.list(params);
  var user    = getCurrentUser();
  var isAdmin = (user.role === 'admin' || user.role === 'superadmin');

  if (!res.success) { tbody.innerHTML = emptyRow(5, 'Erreur chargement.'); return; }
  if (!res.records.length) { tbody.innerHTML = emptyRow(5, 'Aucune présence enregistrée.'); return; }

  var labels = { present: '✅ Présent', absent: '❌ Absent', retard: '⏰ Retard' };

  tbody.innerHTML = res.records.map(function(r) {
    return '<tr>' +
      '<td>' + escHtml((r.nom || '') + ' ' + (r.prenom || '')) + '</td>' +
      '<td>' + escHtml(r.subjectName || '–') + '</td>' +
      '<td>' + formatDate(r.date) + '</td>' +
      '<td><span class="badge badge-' + r.status + '">' + (labels[r.status] || r.status) + '</span></td>' +
      '<td>' + (isAdmin
        ? '<button class="btn-icon del" onclick="deleteAttendance(' + r.id + ')"><i class="fas fa-trash"></i></button>'
        : '–') +
      '</td></tr>';
  }).join('');
}

async function openAttendanceSession() {
  await fillSubjectsSelect('att-modal-subject', false);
  var d = document.getElementById('att-modal-date');
  if (d) d.value = new Date().toISOString().split('T')[0];
  attSession = {};
  await buildAttList();
  openModal('modal-attendance');
}

async function buildAttList() {
  var container = document.getElementById('att-student-list');
  if (!container) return;
  container.innerHTML = '<p style="color:var(--muted);padding:.5rem"><i class="fas fa-spinner fa-spin"></i> Chargement...</p>';

  var res = await api.students.list({ limit: 1000 });
  if (!res.success || !res.students.length) {
    container.innerHTML = '<p style="color:var(--muted);padding:.5rem">Aucun étudiant enregistré.</p>';
    return;
  }

  container.innerHTML = res.students.map(function(s) {
    return '<div class="att-row" id="arow-' + s.id + '">' +
      '<span class="att-name">' + escHtml(s.nom) + ' ' + escHtml(s.prenom) +
      ' <small>(' + escHtml(s.matricule) + ')</small></span>' +
      '<div class="att-btns">' +
        '<button class="att-btn att-p" onclick="setAtt(' + s.id + ',\'present\',this)">✅ Présent</button>' +
        '<button class="att-btn att-a" onclick="setAtt(' + s.id + ',\'absent\',this)">❌ Absent</button>' +
        '<button class="att-btn att-r" onclick="setAtt(' + s.id + ',\'retard\',this)">⏰ Retard</button>' +
      '</div></div>';
  }).join('');
}

function setAtt(sid, status, btn) {
  attSession[sid] = status;
  var row = document.getElementById('arow-' + sid);
  if (!row) return;
  row.querySelectorAll('.att-btn').forEach(function(b) { b.classList.remove('att-active'); });
  btn.classList.add('att-active');
}

async function saveAttendance() {
  var subjectId = document.getElementById('att-modal-subject')?.value;
  var date      = document.getElementById('att-modal-date')?.value;

  if (!subjectId || !date) { showToast('Matière et date requises.', 'error'); return; }
  if (!Object.keys(attSession).length) { showToast('Marquez au moins un étudiant.', 'error'); return; }

  var records = Object.keys(attSession).map(function(sid) {
    return { studentId: sid, status: attSession[sid] };
  });

  var res = await api.attendance.saveSession({ subjectId: subjectId, date: date, records: records });
  if (!res.success) { showToast(res.message, 'error'); return; }

  showToast('Séance enregistrée (' + records.length + ' étudiants) ✅');
  closeModal('modal-attendance');
  renderAttendance();
}

async function deleteAttendance(id) {
  if (!confirmDelete('Supprimer cet enregistrement de présence ?')) return;
  var res = await api.attendance.remove(id);
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast('Présence supprimée.');
  renderAttendance();
}
