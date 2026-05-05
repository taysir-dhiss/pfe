// Page Gestion des rendez-vous (admin) — vue en lecture seule de tous les rendez-vous patients
// L'admin ne peut pas modifier ni supprimer les rendez-vous (ils appartiennent aux patientes)
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState([]); // Liste de tous les rendez-vous
  const [loading, setLoading] = useState(true);

  // Charge tous les rendez-vous au montage du composant
  useEffect(() => {
    api.get("/admin/appointments").then(({ data }) => setAppointments(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">📅 Rendez-vous</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-100">
              <th className="text-left py-3 px-4 text-gray-700 font-medium">Patiente</th>
              <th className="text-left py-3 px-4 text-gray-700 font-medium">Médecin</th>
              <th className="text-left py-3 px-4 text-gray-700 font-medium">Type</th>
              <th className="text-left py-3 px-4 text-gray-700 font-medium">Date</th>
              <th className="text-left py-3 px-4 text-gray-700 font-medium">Rappel auto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {appointments.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-700">Aucun rendez-vous.</td></tr>
            ) : appointments.map(a => (
              <tr key={a._id} className="hover:bg-brand-50 transition">
                <td className="py-3 px-4 font-medium text-gray-800">{a.patientId?.nom || "—"}</td>
                <td className="py-3 px-4 text-gray-700">{a.medecin || "—"}</td>
                <td className="py-3 px-4 text-gray-700">{a.type || "—"}</td>
                <td className="py-3 px-4 text-gray-700">
                  {new Date(a.date).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="py-3 px-4">
                  <span className={`badge text-xs ${a.reminderSent ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-700"}`}>
                    {a.reminderSent ? "✓ Envoyé" : "En attente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
