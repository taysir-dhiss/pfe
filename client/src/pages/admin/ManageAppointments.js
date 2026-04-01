// ManageAppointments — admin view and status update for all appointments
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const STATUS = {
  pending:   { label: "En attente", cls: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmé",   cls: "bg-green-100 text-green-700"  },
  cancelled: { label: "Annulé",     cls: "bg-gray-100 text-gray-500"    },
};

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/appointments").then(({ data }) => setAppointments(data)).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/admin/appointments/${id}/status`, { status });
    setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">📅 Gestion des rendez-vous</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-100">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Patiente</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Médecin</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {appointments.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Aucun rendez-vous.</td></tr>
            ) : appointments.map(a => (
              <tr key={a._id} className="hover:bg-brand-50 transition">
                <td className="py-3 px-4 font-medium text-gray-800">{a.patientId?.nom || "—"}</td>
                <td className="py-3 px-4 text-gray-500">{a.medecin}</td>
                <td className="py-3 px-4 text-gray-500">{a.type}</td>
                <td className="py-3 px-4 text-gray-500">{new Date(a.date).toLocaleString("fr-FR")}</td>
                <td className="py-3 px-4">
                  <select
                    className={`badge cursor-pointer border-0 focus:outline-none ${STATUS[a.status]?.cls} py-1 px-2`}
                    value={a.status}
                    onChange={e => updateStatus(a._id, e.target.value)}>
                    {Object.entries(STATUS).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
