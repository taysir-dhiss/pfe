// App — root router with role-based protected routes
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
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
import Notifications from "./pages/patient/Notifications";
import MedicalContent from "./pages/patient/MedicalContent";
import ChatbotAI from "./pages/patient/ChatbotAI";
import CommunityChat from "./pages/patient/CommunityChat";
import SharedConversation from "./pages/SharedConversation";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManagePatients from "./pages/admin/ManagePatients";
import ManageContent from "./pages/admin/ManageContent";
import CreateAdmin from "./pages/admin/CreateAdmin";

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="app-bg min-h-screen" style={{
      backgroundImage: `linear-gradient(160deg, rgba(255,240,245,0.25) 0%, rgba(255,224,235,0.20) 100%), url(${process.env.PUBLIC_URL}/images/Rose.png)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
    }}>
      {user && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/login"    element={!user ? <Login />    : <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

        {/* Patient routes */}
        <Route path="/dashboard"       element={<ProtectedRoute role="patiente"><PatientDashboard /></ProtectedRoute>} />
        <Route path="/symptoms"        element={<ProtectedRoute role="patiente"><Symptoms /></ProtectedRoute>} />
        <Route path="/appointments"    element={<ProtectedRoute role="patiente"><Appointments /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute role="patiente"><Recommendations /></ProtectedRoute>} />
        <Route path="/notifications"   element={<ProtectedRoute role="patiente"><Notifications /></ProtectedRoute>} />
        <Route path="/content"         element={<ProtectedRoute role="patiente"><MedicalContent /></ProtectedRoute>} />
        <Route path="/chatbot"         element={<ProtectedRoute role="patiente"><ChatbotAI /></ProtectedRoute>} />
        <Route path="/community"       element={<ProtectedRoute role="patiente"><CommunityChat /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin"                element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/patients"       element={<ProtectedRoute role="admin"><ManagePatients /></ProtectedRoute>} />
<Route path="/admin/content"        element={<ProtectedRoute role="admin"><ManageContent /></ProtectedRoute>} />
        <Route path="/admin/create-admin"   element={<ProtectedRoute role="admin"><CreateAdmin /></ProtectedRoute>} />
        <Route path="/admin/community"      element={<ProtectedRoute role="admin"><CommunityChat /></ProtectedRoute>} />

        {/* Public shared conversation — no auth */}
        <Route path="/share/:token" element={<SharedConversation />} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"} />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
