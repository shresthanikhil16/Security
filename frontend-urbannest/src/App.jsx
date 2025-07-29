import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { toast } from "react-toastify";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import SearchBar from "./components/Searchbar.jsx";

const EditProfile = lazy(() => import("./pages/account/editProfile.jsx"));
const ForgotPassword = lazy(() => import("./pages/account/forgetPassword.jsx"));
const ForgotPasswordOTP = lazy(() => import("./pages/account/forgotPasswordOTP.jsx"));
const Login = lazy(() => import("./pages/account/Login"));
const Register = lazy(() => import("./pages/account/Register"));
const VerifyOTP = lazy(() => import("./pages/account/verifyOTP.jsx"));
const ResetPassword = lazy(() => import("./pages/account/resetPassword.jsx"));
const AboutUs = lazy(() => import("./pages/homepage/AboutUs.jsx"));
const Address = lazy(() => import("./pages/homepage/Address.jsx"));
const ContactUs = lazy(() => import("./pages/homepage/ContactUs.jsx"));
const Dashboard = lazy(() => import("./pages/homepage/Dashboard.jsx"));
const FAQ = lazy(() => import("./pages/homepage/Faq.jsx"));
const FlatDetails = lazy(() => import("./pages/homepage/FlatDetails.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/homepage/PrivacyPolicy.jsx"));
const TermsCondition = lazy(() => import("./pages/homepage/TermsCondition.jsx"));
const WishList = lazy(() => import("./pages/homepage/Wishlist.jsx"));
const Failure = lazy(() => import("./pages/payment/Failure.jsx"));
const Success = lazy(() => import("./pages/payment/Success.jsx"));
const AddRooms = lazy(() => import("./pages/private/AddRooms.jsx"));
const AdminDashboard = lazy(() => import("./pages/private/AdminDashboard.jsx"));
const AdminUpdate = lazy(() => import("./pages/private/AdminUpdate.jsx"));
const EditUser = lazy(() => import("./pages/private/EditUser.jsx"));
const Profile = lazy(() => import("./pages/private/Profile.jsx"));
const AuditLogs = lazy(() => import("./pages/private/AuditLogs.jsx"));

const ProtectedRoute = ({ children, requireAuth = true, requireAdmin = false }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAuthenticated = !!user?.token;
  const isAdmin = user?.role === "admin";

  if (requireAuth && !isAuthenticated) {
    toast.error("Please log in to access this page.");
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    toast.error("Admin access required.");
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const publicRoutes = [
    { path: "/", element: <Dashboard /> },
    { path: "/aboutus", element: <AboutUs /> },
    { path: "/contactus", element: <ContactUs /> },
    { path: "/privacypolicy", element: <PrivacyPolicy /> },
    { path: "/termscondition", element: <TermsCondition /> },
    { path: "/address/:location", element: <Address /> },
    { path: "/faq", element: <FAQ /> },
    { path: "/flat-details/:id", element: <FlatDetails /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/verify-otp", element: <VerifyOTP /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/forgot-password-otp", element: <ForgotPasswordOTP /> },
    { path: "/reset-password", element: <ResetPassword /> },
    { path: "/success", element: <Success /> },
    { path: "/failure", element: <Failure /> },
  ];

  const userRoutes = [
    { path: "/wishlist", element: <WishList /> },
    { path: "/profile", element: <Profile /> },
    { path: "/edit-profile/:id", element: <EditProfile /> },
  ];

  const adminRoutes = [
    { path: "/adminDash", element: <AdminDashboard /> },
    { path: "/adminUpdate/:id", element: <AdminUpdate /> },
    { path: "/edit-user/:id", element: <EditUser /> },
    { path: "/addRooms", element: <AddRooms /> },
    { path: "/audit-logs", element: <AuditLogs /> },
  ];

  const routes = [
    ...publicRoutes.map((route) => ({
      ...route,
      element: (
        <>
          <Navbar />
          {route.element}
        </>
      ),
    })),
    ...userRoutes.map((route) => ({
      ...route,
      element: (
        <ProtectedRoute requireAuth={true}>
          <Navbar />
          {route.element}
          <Footer />
        </ProtectedRoute>
      ),
    })),
    ...adminRoutes.map((route) => ({
      ...route,
      element: (
        <ProtectedRoute requireAuth={true} requireAdmin={true}>
          <Navbar />
          {route.element}
          {/* Footer is handled inside component if needed */}
        </ProtectedRoute>
      ),
    })),
    { path: "/navbar", element: <Navbar /> },
    { path: "/footer", element: <Footer /> },
    { path: "/searchbar", element: <SearchBar /> },
    {
      path: "*",
      element: (
        <>
          <Navbar />
          <div className="text-center py-10">Page not found</div>
        </>
      ),
    },
  ];

  const router = createBrowserRouter(routes);

  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
