import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { CreateDrawPage } from './pages/CreateDrawPage';
import { JoinDrawPage } from './pages/JoinDrawPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ResultPage } from './pages/ResultPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        {/* HashRouter garantiza compatibilidad total con GitHub Pages y hosting estático */}
        <HashRouter>
          <div className="min-h-screen flex flex-col bg-christmas-gradient text-cream-100">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/crear-sorteo" element={<CreateDrawPage />} />
                <Route path="/unirse" element={<JoinDrawPage />} />
                <Route path="/unirse/:codigo" element={<JoinDrawPage />} />
                <Route path="/admin/panel" element={<AdminDashboardPage />} />
                <Route path="/resultado" element={<ResultPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <footer className="py-6 px-4 text-center text-xs text-cream-200/60 border-t border-gold-500/15 bg-pine-950/80">
              <p>
                🎁 <strong>Amigo Secreto</strong> — Sistema Web de Sorteos Navideños con React,
                Node.js, Express, Prisma y MySQL.
              </p>
            </footer>
          </div>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;

