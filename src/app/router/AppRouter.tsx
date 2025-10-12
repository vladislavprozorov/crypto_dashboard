import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Dashboard = lazy(() => import('../../pages/DashBoard/DashBoard'));
const CoinDetails = lazy(() => import('../../pages/CoinDetails/CoinDetails'));
const Favorites = lazy(() => import('../../pages/Favorites/Favorites'));

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route
        path="/coin/:coinId"
        element={<CoinDetails />}
        // Префетч данных для страницы детализации монеты
        loader={async () => {}}
      />
      <Route path="/favorites" element={<Favorites />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
