// ManagePatients — admin patient list with search and delete
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

export default function ManagePatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/admin/patients").then(({ data }) => setPatients(data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async id => {
    if (!window.confirm("Supprimer cette patiente ?")) return;
    await api.delete(`/admin/patients/${id}`);
    setPatients(prev => prev.filter(p => p._id !== id));
  };

  const filtered = patients.filter(p =>
    `${p.nom} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">👥 Gestion des patientes</h1>

      <div className="card">
        {/* Search + count */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <input className="input w-64" placeholder="Rechercher par nom ou email..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <span className="text-sm text-gray-500">{filtered.length} patiente(s)</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Nom</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Stade</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date naissance</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Aucune patiente trouvée.</td></tr>
              ) : filtered.map(p => (
                <tr key={p._id} className="hover:bg-brand-50 transition">
                  <td className="py-3 px-4 font-medium text-gray-800">{p.nom}</td>
                  <td className="py-3 px-4 text-gray-500">{p.email}</td>
                  <td className="py-3 px-4">
                    {p.stadeCancer
                      ? <span className="badge bg-brand-100 text-brand-700">{p.stadeCancer}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {p.dateNaissance ? new Date(p.dateNaissance).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDelete(p._id)}
                      className="btn-danger btn-sm">🗑️ Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
