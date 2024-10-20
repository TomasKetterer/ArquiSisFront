import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import { QueryClient, QueryClientProvider } from '@tanstank/react-query';

import App from './App.jsx';
// import Header from './components/Header.jsx';
// import BuyBonusModal from './components/BuyBonusModal.jsx';
// import AddMoneyModal from './components/AddMoneyModal.jsx';
// import ProcessingModal from './components/ProcessingModal.jsx';
// import BonusesModal from './components/BonusesModal.jsx';

// import HomePage from './pages/HomePage.jsx';
// import BonusesPage from './pages/BonusesPage.jsx';

function Routing () {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
            </Routes>
        </BrowserRouter>
    )
}

export default Routing