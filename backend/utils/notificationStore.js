// notificationStore.js — in-memory notification store (no DB persistence)
// Notifications live only in RAM: they appear when scheduler fires,
// disappear when the user dismisses them or the server restarts.

const store = new Map(); // key: patientId string → value: Notification[]

let _counter = 0;
function newId() { return `n_${Date.now()}_${++_counter}`; }

/**
 * Push a notification for a patient.
 * @param {string|ObjectId} patientId
 * @param {{ type: "appointment"|"alarm", message: string, appointmentId?: string }} notif
 */
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

/** Return all pending notifications for a patient (most recent first). */
function getAll(patientId) {
  const list = store.get(patientId.toString()) || [];
  return [...list].reverse();
}

/** Remove a specific notification. */
function remove(patientId, id) {
  const key  = patientId.toString();
  const list = store.get(key) || [];
  store.set(key, list.filter(n => n.id !== id));
}

/** Remove all notifications for a patient. */
function clearAll(patientId) {
  store.set(patientId.toString(), []);
}

/** Count pending (unread) notifications for a patient. */
function count(patientId) {
  return (store.get(patientId.toString()) || []).length;
}

module.exports = { push, getAll, remove, clearAll, count };
