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
import AddBrevo from './pages/AddBrevo';
import AddVercel from './pages/AddVercel';
import AddContact from './pages/AddContact';
import ImgbbManager from './pages/ImgbbManager';
import FreeimgManager from './pages/FreeimgManager';
import PublicWorkspace from './pages/PublicWorkspace';
import Todo from './pages/Todo';
import AddProject from './pages/AddProject';
import ActivityLogs from './pages/ActivityLogs';

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
          <Route path="add-brevo" element={<AddBrevo />} />
          <Route path="add-vercel" element={<AddVercel />} />
          <Route path="imgbb" element={<ImgbbManager />} />
          <Route path="freeimg" element={<FreeimgManager />} />
          <Route path="add-contact" element={<AddContact />} />
          <Route path="add-project" element={<AddProject />} />
          <Route path="logs" element={<ActivityLogs />} />
        </Route>
      </Routes>
    </Router>
  );
}
