// App — root router with role-based protected routes
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Patient pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import Symptoms from "./pages/patient/Symptoms";
import Appointments from "./pages/patient/Appointments";
import Recommendations from "./pages/patient/Recommendations";
import Chatbot from "./pages/patient/Chatbot";
import Notifications from "./pages/patient/Notifications";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManagePatients from "./pages/admin/ManagePatients";
import ManageAppointments from "./pages/admin/ManageAppointments";
import ManageContent from "./pages/admin/ManageContent";
import ManageNotifications from "./pages/admin/ManageNotifications";
import CreateAdmin from "./pages/admin/CreateAdmin";

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

        {/* Patient routes */}
        <Route path="/dashboard"      element={<ProtectedRoute role="patiente"><PatientDashboard /></ProtectedRoute>} />
        <Route path="/symptoms"       element={<ProtectedRoute role="patiente"><Symptoms /></ProtectedRoute>} />
        <Route path="/appointments"   element={<ProtectedRoute role="patiente"><Appointments /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute role="patiente"><Recommendations /></ProtectedRoute>} />
        <Route path="/chat"           element={<ProtectedRoute role="patiente"><Chatbot /></ProtectedRoute>} />
        <Route path="/notifications"  element={<ProtectedRoute role="patiente"><Notifications /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin"                element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/patients"       element={<ProtectedRoute role="admin"><ManagePatients /></ProtectedRoute>} />
        <Route path="/admin/appointments"   element={<ProtectedRoute role="admin"><ManageAppointments /></ProtectedRoute>} />
        <Route path="/admin/content"        element={<ProtectedRoute role="admin"><ManageContent /></ProtectedRoute>} />
        <Route path="/admin/notifications"  element={<ProtectedRoute role="admin"><ManageNotifications /></ProtectedRoute>} />
        <Route path="/admin/create-admin"   element={<ProtectedRoute role="admin"><CreateAdmin /></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
