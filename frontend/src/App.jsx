import { Routes, Route, Navigate } from 'react-router-dom';
// react -router -dom is library for chaging pages soflty

import MainLayout from './layouts/MainLayout';
import Digging from './pages/Digging';
import Archive from './pages/Archive/Archive';
import ArchiveContent from './pages/Archive/Content/ArchiveContent';
import ArchiveReport from './pages/Archive/Report/ArchiveReport';
import ArchiveCustom from './pages/Archive/Custom/ArchiveCustom';
import CustomCreatePage from './pages/Archive/Custom/CustomCreatePage';
import CustomDetailPage from './pages/Archive/Custom/CustomDetailPage';
import CustomEditPage from './pages/Archive/Custom/CustomEditPage';
import Social from './pages/Social';

/*
This for general type of app.jsx for multi pages
<TopHeader />
<Navbar />
<Outlet />
Outlet is make elements of each page in the folder

main layout is for main app shell 
this file is for main pages
This function used in main.jsx


They are like if senectence if address is diging --> digging page
In navbar clikc the link to /digging --> digging page

*/

//Router structure
// path is url /
// element is page

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/digging" replace />} />
        <Route path="/digging" element={<Digging />} />
        <Route path="/archive" element={<Archive />}>
          <Route index element={<Navigate to="content" replace />} />
          <Route path="content" element={<ArchiveContent />} />
          <Route path="report" element={<ArchiveReport />} />
          <Route path="custom" element={<ArchiveCustom />} />
        </Route>
        <Route path="/archive/custom/create" element={<CustomCreatePage />} />
        <Route path="/archive/custom/:albumId" element={<CustomDetailPage />} />
        <Route path="/archive/custom/:albumId/edit" element={<CustomEditPage />} />
        <Route path="/social" element={<Social />} />
      </Route>
    </Routes>
  );
}

export default App;
