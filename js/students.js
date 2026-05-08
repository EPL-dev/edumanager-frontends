// students.js — MySQL version

var studentPage   = 1;
var studentSearch = '';

async function renderStudents() {
  var tbody = document.getElementById('students-tbody');
  if (!tbody) return;
  showLoading(tbody, 5);

  var res = await api.students.list({ page: studentPage, limit: CONFIG.PAGE_SIZE, q: studentSearch });
  if (!res.success) { tbody.innerHTML = emptyRow(5, 'Erreur : ' + res.message); return; }

  var students = res.students || [];
  var user     = getCurrentUser();
  var isAdmin  = (user.role === 'admin' || user.role === 'superadmin');

  if (!students.length) {
    tbody.innerHTML = emptyRow(5, studentSearch ? 'Aucun résultat pour "' + studentSearch + '"' : 'Aucun étudiant enregistré.');
  } else {
    tbody.innerHTML = students.map(function(s, i) {
      return '<tr>' +
        '<td>' + ((studentPage - 1) * CONFIG.PAGE_SIZE + i + 1) + '</td>' +
        '<td><code style="font-family:monospace;color:var(--blue);font-size:.8rem">' + escHtml(s.matricule) + '</code></td>' +
        '<td><strong>' + escHtml(s.nom) + '</strong> ' + escHtml(s.prenom) + '</td>' +
        '<td><span class="badge ' + (s.sexe === 'M' ? 'badge-m' : 'badge-f') + '">' + (s.sexe === 'M' ? '♂ M' : '♀ F') + '</span></td>' +
        '<td>' + (isAdmin
          ? '<button class="btn-icon edit" onclick="editStudent(' + s.id + ')"><i class="fas fa-pen"></i></button>' +
            '<button class="btn-icon del"  onclick="deleteStudent(' + s.id + ')"><i class="fas fa-trash"></i></button>'
          : '–') + '</td></tr>';
    }).join('');
  }

  var pages = res.pages || 1;
  var total = res.total || 0;
  setEl('page-info', 'Page ' + studentPage + ' / ' + pages + ' — ' + total + ' étudiant' + (total > 1 ? 's' : ''));
  var bp = document.getElementById('btn-prev');
  var bn = document.getElementById('btn-next');
  if (bp) bp.disabled = (studentPage <= 1);
  if (bn) bn.disabled = (studentPage >= pages);
}

function searchStudents() { studentSearch = document.getElementById('search-student')?.value || ''; studentPage = 1; renderStudents(); }
function prevStudentPage() { if (studentPage > 1) { studentPage--; renderStudents(); } }
function nextStudentPage() { studentPage++; renderStudents(); }

function openStudentModal() {
  ['student-id','student-matricule','student-nom','student-prenom'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  var sx = document.getElementById('student-sexe'); if (sx) sx.value = 'M';
  setEl('modal-student-title', 'Ajouter un étudiant');
  openModal('modal-student');
}

async function editStudent(id) {
  var res = await api.students.get(id);
  if (!res.success) { showToast('Erreur chargement.', 'error'); return; }
  var s = res.student;
  document.getElementById('student-id').value        = s.id;
  document.getElementById('student-matricule').value = s.matricule;
  document.getElementById('student-nom').value       = s.nom;
  document.getElementById('student-prenom').value    = s.prenom;
  document.getElementById('student-sexe').value      = s.sexe;
  setEl('modal-student-title', 'Modifier l\'étudiant');
  openModal('modal-student');
}

async function saveStudent() {
  var id        = document.getElementById('student-id').value;
  var matricule = document.getElementById('student-matricule').value.trim();
  var nom       = document.getElementById('student-nom').value.trim();
  var prenom    = document.getElementById('student-prenom').value.trim();
  var sexe      = document.getElementById('student-sexe').value;

  if (!matricule || !nom || !prenom) { showToast('Tous les champs sont requis.', 'error'); return; }

  var data = { matricule: matricule, nom: nom, prenom: prenom, sexe: sexe };
  var res  = id ? await api.students.update(id, data) : await api.students.create(data);

  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast(id ? 'Étudiant modifié ✅' : 'Étudiant ajouté ✅');
  closeModal('modal-student');
  renderStudents();
}

async function deleteStudent(id) {
  if (!confirmDelete('Supprimer cet étudiant ? Ses notes et présences seront supprimées.')) return;
  var res = await api.students.remove(id);
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast('Étudiant supprimé.');
  renderStudents();
}
