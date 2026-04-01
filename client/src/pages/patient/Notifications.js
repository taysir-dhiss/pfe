// Notifications — list and mark-as-read for patient notifications
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/notifications").then(({ data }) => setNotifs(data)).finally(() => setLoading(false));
  }, []);

  const markRead = async id => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, statut: "lu" } : n));
    } catch { /* silent */ }
  };

  const unreadCount = notifs.filter(n => n.statut === "non_lu").length;

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="page-title mb-0">🔔 Notifications</h1>
        {unreadCount > 0 && (
          <span className="bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="card text-center text-gray-500 py-16">
          <p className="text-5xl mb-3">📭</p>
          <p>Aucune notification.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map(n => (
            <div key={n._id}
              className={`card flex items-start justify-between gap-4 py-4 transition ${n.statut === "non_lu" ? "border-brand-300 bg-brand-50" : ""}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 text-xl ${n.statut === "non_lu" ? "" : "opacity-40"}`}>
                  {n.statut === "non_lu" ? "🔔" : "📭"}
                </span>
                <div>
                  <p className={`text-sm ${n.statut === "non_lu" ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.dateEnvoi).toLocaleString("fr-FR")}</p>
                </div>
              </div>
              {n.statut === "non_lu" && (
                <button onClick={() => markRead(n._id)}
                  className="btn-secondary btn-sm whitespace-nowrap text-xs">
                  Marquer lu
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
