import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import DetailsPage from './pages/DetailsPage.jsx';
import PassengersPage from './pages/PassengersPage.jsx';
import ExtrasPage from './pages/ExtrasPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import ConfirmationPage from './pages/ConfirmationPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AccountSettingsPage from './pages/AccountSettingsPage.jsx';
import StaysPage from './pages/StaysPage.jsx';
import StaysResultsPage from './pages/StaysResultsPage.jsx';
import StaysDetailsPage from './pages/StaysDetailsPage.jsx';
import StaysCheckoutPage from './pages/StaysCheckoutPage.jsx';
import StaysConfirmationPage from './pages/StaysConfirmationPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import VisaNewPage from './pages/VisaNewPage.jsx';
import VisaDashboardPage from './pages/VisaDashboardPage.jsx';
import AdminVisaPage from './pages/AdminVisaPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/details" element={<DetailsPage />} />
        <Route path="/passengers" element={<PassengersPage />} />
        <Route path="/extras" element={<ExtrasPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/account-settings" element={<AccountSettingsPage />} />
        <Route path="/stays" element={<StaysPage />} />
        <Route path="/stays/results" element={<StaysResultsPage />} />
        <Route path="/stays/details" element={<StaysDetailsPage />} />
        <Route path="/stays/checkout" element={<StaysCheckoutPage />} />
        <Route path="/stays/confirmation" element={<StaysConfirmationPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/visa" element={<Navigate to="/visa/new" replace />} />
        <Route path="/visa/new" element={<VisaNewPage />} />
        <Route path="/visa/dashboard" element={<VisaDashboardPage />} />
        <Route path="/admin/visa" element={<AdminVisaPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
