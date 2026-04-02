import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Tournament from './pages/Tournament';
import Results from './pages/Results';

export default function App() {
  return (
    <HashRouter>
      <div className="mx-auto min-h-dvh max-w-2xl bg-slate-900 text-white">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/play" element={<Tournament />} />
          <Route path="/results" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
