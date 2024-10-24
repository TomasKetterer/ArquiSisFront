import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import { QueryClient, QueryClientProvider } from '@tanstank/react-query';

import App from './App.jsx';
import ConfirmPurchase from './components/ConfirmPurchase.jsx';
import PurchaseCompleted from './components/PurchaseCompleted.jsx';
import MyRequests from './components/MyRequests.jsx';

function Routing () {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/confirm-purchase" element={<ConfirmPurchase />} />
                <Route path="/purchase-completed" element={<PurchaseCompleted />} />
                <Route path="/my-requests" element={<MyRequests />} />
            </Routes>
        </BrowserRouter>
    )
}

export default Routing