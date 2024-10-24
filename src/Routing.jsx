import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import { QueryClient, QueryClientProvider } from '@tanstank/react-query';

import App from './App.jsx';
import ConfirmPurchase from './components/ConfirmPurchase.jsx';
import PurchaseCompleted from './components/PurchaseCompleted.jsx';

function Routing () {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/confirm-purchase" element={<ConfirmPurchase />} />
                <Route path="/purchase-completed" element={<PurchaseCompleted />} />
            </Routes>
        </BrowserRouter>
    )
}

export default Routing