const store = new Map();

let _counter = 0;
function newId() { return `n_${Date.now()}_${++_counter}`; }

function push(patientId, { type, message, appointmentId = null }) {
  const key  = patientId.toString();
  const list = store.get(key) || [];
  list.push({
    id:            newId(),
    type,
    message,
    appointmentId,
    triggerTime:   new Date().toISOString(),
  });
  store.set(key, list);
}

function getAll(patientId) {
  const list = store.get(patientId.toString()) || [];
  return [...list].reverse();
}

function remove(patientId, id) {
  const key  = patientId.toString();
  const list = store.get(key) || [];
  store.set(key, list.filter(n => n.id !== id));
}

function clearAll(patientId) {
  store.set(patientId.toString(), []);
}

function count(patientId) {
  return (store.get(patientId.toString()) || []).length;
}

module.exports = { push, getAll, remove, clearAll, count };
