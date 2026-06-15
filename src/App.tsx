/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Search from './pages/Search';
import AddFb from './pages/AddFb';
import AddSpecialFb from './pages/AddSpecialFb';
import AddSpecialGmail from './pages/AddSpecialGmail';
import AddGmail from './pages/AddGmail';
import AddSupabase from './pages/AddSupabase';
import AddGithub from './pages/AddGithub';
import AddContact from './pages/AddContact';
import PublicWorkspace from './pages/PublicWorkspace';
import Todo from './pages/Todo';

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
        
        {/* Public Workspace without Password */}
        <Route path="/workspace" element={<PublicWorkspace />} />
        
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Overview />} />
          <Route path="tasks" element={<Todo />} />
          <Route path="search" element={<Search />} />
          <Route path="add-fb" element={<AddFb />} />
          <Route path="add-special-fb" element={<AddSpecialFb />} />
          <Route path="add-special-gmail" element={<AddSpecialGmail />} />
          <Route path="add-gmail" element={<AddGmail />} />
          <Route path="add-supabase" element={<AddSupabase />} />
          <Route path="add-github" element={<AddGithub />} />
          <Route path="add-contact" element={<AddContact />} />
        </Route>
      </Routes>
    </Router>
  );
}
