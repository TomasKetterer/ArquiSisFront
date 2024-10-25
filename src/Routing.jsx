import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
// import { QueryClient, QueryClientProvider } from '@tanstank/react-query';

import App from './App.jsx';
import ConfirmPurchase from './components/ConfirmPurchase.jsx';
import PurchaseCompleted from './components/PurchaseCompleted.jsx';
import MyRequests from './components/MyRequests.jsx';

function Routing () {
    return (
        <Auth0Provider
            domain={process.env.REACT_APP_AUTH0_DOMAIN}
            clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
            redirectUri={window.location.origin}
            cacheLocation="localstorage" // Añade esta línea
            useRefreshTokens={true}      // Añade esta línea
        >
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<App />} />
                    <Route path="/confirm-purchase" element={<ConfirmPurchase />} />
                    <Route path="/purchase-completed" element={<PurchaseCompleted />} />
                    <Route path="/my-requests" element={<MyRequests />} />
                </Routes>
            </BrowserRouter>
        </Auth0Provider>
    )
}

export default Routing