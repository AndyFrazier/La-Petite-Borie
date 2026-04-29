import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PropertyListing } from './components/PropertyListing';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { Settings } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-600 text-lg">Loading...</div>
      </div>
    );
  }

  if (showAdmin && !user) {
    return (
      <div>
        <button
          onClick={() => setShowAdmin(false)}
          className="absolute top-4 left-4 text-stone-600 hover:text-stone-800 transition-colors z-20"
        >
          ← Back to listing
        </button>
        <AdminLogin />
      </div>
    );
  }

  if (user) {
    return <AdminDashboard />;
  }

  return (
    <div>
      <button
        onClick={() => setShowAdmin(true)}
        className="fixed bottom-6 right-6 bg-white hover:bg-stone-50 text-stone-700 p-4 rounded-full shadow-lg border border-stone-200 transition-all z-10"
        aria-label="Admin access"
      >
        <Settings className="w-6 h-6" />
      </button>
      <PropertyListing />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
