// schedule.js — MySQL version
var DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

async function renderSchedule() {
  var grid = document.getElementById('schedule-grid');
  if (!grid) return;
  grid.innerHTML = '<p style="color:var(--muted);padding:1rem"><i class="fas fa-spinner fa-spin"></i> Chargement...</p>';

  var res     = await api.schedule.list();
  var user    = getCurrentUser();
  var isAdmin = (user.role === 'admin' || user.role === 'superadmin');

  if (!res.success) { grid.innerHTML = '<p style="color:var(--muted);padding:1rem">Erreur chargement.</p>'; return; }

  grid.innerHTML = DAYS.map(function(day) {
    var slots = (res.schedule || []).filter(function(s) { return s.day === day; })
      .sort(function(a, b) { return a.startTime.localeCompare(b.startTime); });

    var slotsHtml = slots.length
      ? slots.map(function(s) {
          return '<div class="slot">' +
            '<span class="slot-time">' + s.startTime + ' – ' + s.endTime + '</span>' +
            '<span class="slot-name">' + escHtml(s.subjectName || '–') + '</span>' +
            (isAdmin ? '<button class="btn-icon del sm" onclick="deleteSlot(' + s.id + ')"><i class="fas fa-xmark"></i></button>' : '') +
          '</div>';
        }).join('')
      : '<p class="slot-empty">Pas de cours</p>';

    return '<div class="sched-col"><div class="sched-day">' + day + '</div>' + slotsHtml + '</div>';
  }).join('');
}

async function openScheduleModal() {
  await fillSubjectsSelect('sched-subject', false);
  openModal('modal-schedule');
}

async function saveSchedule() {
  var subjectId = document.getElementById('sched-subject')?.value;
  var day       = document.getElementById('sched-day')?.value;
  var startTime = document.getElementById('sched-start')?.value;
  var endTime   = document.getElementById('sched-end')?.value;

  if (!subjectId || !day || !startTime || !endTime) { showToast('Tous les champs requis.', 'error'); return; }
  if (startTime >= endTime) { showToast('Heure de début invalide.', 'error'); return; }

  var res = await api.schedule.create({ subjectId: subjectId, day: day, startTime: startTime, endTime: endTime });
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast('Cours ajouté ✅');
  closeModal('modal-schedule');
  renderSchedule();
}

async function deleteSlot(id) {
  if (!confirmDelete('Supprimer ce cours ?')) return;
  var res = await api.schedule.remove(id);
  if (!res.success) { showToast(res.message, 'error'); return; }
  showToast('Cours supprimé.');
  renderSchedule();
}
