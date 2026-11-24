import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import BrowseBikes from "./pages/client/BrowseBikes";
import MyBookings from "./pages/client/MyBookings";
import ClientProfile from "./pages/client/ClientProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";

import OwnerDashboard from "./pages/owner/OwnerDashboard";
import MyBikes from "./pages/owner/MyBikes";
import AddBike from "./pages/owner/AddBike";
import BookingRequests from "./pages/owner/BookingRequests";
import OwnerBookings from "./pages/owner/OwnerBookings";
import OwnerEarnings from "./pages/owner/OwnerEarnings";
import OwnerProfile from "./pages/owner/OwnerProfile";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PendingApprovals from "./pages/admin/PendingApprovals";
import Clients from "./pages/admin/Clients";
import Owners from "./pages/admin/Owners";
import AdminBikes from "./pages/admin/AdminBikes";
import Reports from "./pages/admin/Reports";
import AdminRoute from "./components/admin/AdminRoute";
import OwnerRoute from "./components/owner/OwnerRoute";
import ProtectedRoute from "./components/common/ProtectedRoute";
import "./App.css";

// Entry route handler: redirects unauthenticated visitors to /login, or authenticated users to their dashboard
const RootEntry = () => {
    const rawToken = localStorage.getItem("token") || localStorage.getItem("motorent_token");
    let storedUser = null;
    try {
        const rawUser = localStorage.getItem("user") || localStorage.getItem("motorent_user");
        storedUser = rawUser ? JSON.parse(rawUser) : null;
    } catch {
        storedUser = null;
    }

    if (!rawToken || !storedUser) {
        return <Navigate to="/login" replace />;
    }

    if (storedUser.role === "admin") {
        return <Navigate to="/admin/dashboard" replace />;
    }
    if (storedUser.role === "owner") {
        return <Navigate to="/owner/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Default Entry Route: Unauthenticated users are redirected to Main Login */}
                <Route
                    path="/"
                    element={<RootEntry />}
                />

                {/* Customer Dashboard / Marketplace (Protected) */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["customer", "client", "owner", "admin"]}>
                            <BrowseBikes />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/browse"
                    element={
                        <ProtectedRoute allowedRoles={["customer", "client", "owner", "admin"]}>
                            <BrowseBikes />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/bikes"
                    element={
                        <ProtectedRoute allowedRoles={["customer", "client", "owner", "admin"]}>
                            <BrowseBikes />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/client/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["customer", "client", "owner", "admin"]}>
                            <BrowseBikes />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/bookings"
                    element={
                        <ProtectedRoute allowedRoles={["customer", "owner", "admin"]}>
                            <MyBookings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/my-bookings"
                    element={
                        <ProtectedRoute allowedRoles={["customer", "owner", "admin"]}>
                            <MyBookings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/client/bookings"
                    element={
                        <ProtectedRoute allowedRoles={["customer", "owner", "admin"]}>
                            <MyBookings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/client/profile"
                    element={
                        <ProtectedRoute allowedRoles={["customer", "owner", "admin"]}>
                            <ClientProfile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute allowedRoles={["customer", "owner", "admin"]}>
                            <ClientProfile />
                        </ProtectedRoute>
                    }
                />

                {/* Authentication */}
                <Route
                    path="/login"
                    element={<Login />}
                />
                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* Owner Portal (Protected with OwnerRoute) */}
                <Route
                    path="/owner/dashboard"
                    element={
                        <OwnerRoute>
                            <OwnerDashboard />
                        </OwnerRoute>
                    }
                />
                <Route
                    path="/owner/bikes"
                    element={
                        <OwnerRoute>
                            <MyBikes />
                        </OwnerRoute>
                    }
                />
                <Route
                    path="/owner/add-bike"
                    element={
                        <OwnerRoute>
                            <AddBike />
                        </OwnerRoute>
                    }
                />
                <Route
                    path="/owner/bikes/add"
                    element={
                        <OwnerRoute>
                            <AddBike />
                        </OwnerRoute>
                    }
                />
                <Route
                    path="/owner/bikes/edit/:id"
                    element={
                        <OwnerRoute>
                            <AddBike />
                        </OwnerRoute>
                    }
                />
                <Route
                    path="/owner/booking-requests"
                    element={
                        <OwnerRoute>
                            <BookingRequests />
                        </OwnerRoute>
                    }
                />
                <Route
                    path="/owner/payment-verification"
                    element={
                        <OwnerRoute>
                            <BookingRequests activeTabDefault="verification" />
                        </OwnerRoute>
                    }
                />
                <Route
                    path="/owner/bookings"
                    element={
                        <OwnerRoute>
                            <OwnerBookings />
                        </OwnerRoute>
                    }
                />
                <Route
                    path="/owner/earnings"
                    element={
                        <OwnerRoute>
                            <OwnerEarnings />
                        </OwnerRoute>
                    }
                />
                <Route
                    path="/owner/profile"
                    element={
                        <OwnerRoute>
                            <OwnerProfile />
                        </OwnerRoute>
                    }
                />

                {/* Admin Portal */}
                <Route
                    path="/admin/login"
                    element={<AdminLogin />}
                />

                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/clients"
                    element={
                        <AdminRoute>
                            <Clients />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/owners"
                    element={
                        <AdminRoute>
                            <Owners />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/bikes"
                    element={
                        <AdminRoute>
                            <AdminBikes />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/pending-approvals"
                    element={
                        <AdminRoute>
                            <PendingApprovals />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/approvals"
                    element={
                        <AdminRoute>
                            <PendingApprovals />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/reports"
                    element={
                        <AdminRoute>
                            <Reports />
                        </AdminRoute>
                    }
                />

                {/* Fallback */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
