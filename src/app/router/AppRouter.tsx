import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

const Dashboard = lazy(() => import('../../pages/DashBoard/DashBoard'));
const CoinDetails = lazy(() => import('../../pages/CoinDetails/CoinDetails'));
const Favorites = lazy(() => import('../../pages/Favorites/Favorites'));

const AppRouter = () => (
  <HashRouter>
    <Suspense fallback={<div className="text-center mt-10 text-gray-400">Loading...</div>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/coin/:coinId" element={<CoinDetails />} />
        <Route path="/favorites" element={<Favorites />} />
      </Routes>
    </Suspense>
  </HashRouter>
);

export default AppRouter;
