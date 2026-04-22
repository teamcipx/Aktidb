/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Search from './pages/Search';
import AddFb from './pages/AddFb';
import AddGmail from './pages/AddGmail';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const isAuthenticated = localStorage.getItem('akti_auth') === 'true';
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Overview />} />
          <Route path="search" element={<Search />} />
          <Route path="add-fb" element={<AddFb />} />
          <Route path="add-gmail" element={<AddGmail />} />
        </Route>
      </Routes>
    </Router>
  );
}
