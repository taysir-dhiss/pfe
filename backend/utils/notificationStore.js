// Stockage des notifications en mémoire RAM — les données sont perdues au redémarrage du serveur
const store = new Map();

let _counter = 0;
// Génère un identifiant unique pour chaque notification en combinant le timestamp et un compteur
function newId() { return `n_${Date.now()}_${++_counter}`; }

// Ajoute une nouvelle notification dans la liste de la patiente
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

// Retourne toutes les notifications d'une patiente, les plus récentes en premier
function getAll(patientId) {
  const list = store.get(patientId.toString()) || [];
  return [...list].reverse();
}

// Supprime une notification précise dans la liste de la patiente
function remove(patientId, id) {
  const key  = patientId.toString();
  const list = store.get(key) || [];
  store.set(key, list.filter(n => n.id !== id));
}

// Vide toutes les notifications d'une patiente d'un seul coup
function clearAll(patientId) {
  store.set(patientId.toString(), []);
}

// Retourne le nombre de notifications en attente pour une patiente, utilisé pour afficher le badge
function count(patientId) {
  return (store.get(patientId.toString()) || []).length;
}

module.exports = { push, getAll, remove, clearAll, count };
