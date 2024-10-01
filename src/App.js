// src/App.js
import './App.css';
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import useApi from './api';

function App() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();

  // Usa el hook useApi para llamar a tu API protegida
  const { data: fixturesData, loading, error } = useApi('https://nodecraft.me/fixtures');

  return (
    <div className="App">
      <header className="App-header">
        {isAuthenticated ? (
          <>
            <img src={user.picture} alt={user.name} className="App-logo" />
            <p>Bienvenido, {user.name}</p>
            <button onClick={() => logout({ returnTo: window.location.origin })}>
              Cerrar Sesión
            </button>

            {loading && <p>Cargando datos...</p>}
            {error && <p>Error al cargar datos.</p>}
            {fixturesData && (
              <>
                {/* Aquí puedes usar fixturesData para mostrar tus datos */}
                <div className="fixtures-grid">
                  {fixturesData.data.length > 0 ? (
                    fixturesData.data.map((fixture) => (
                      <div key={fixture.fixture.id} className="fixture-item">
                        {/* ... tu código para mostrar cada fixture ... */}
                      </div>
                    ))
                  ) : (
                    <p>No hay fixtures disponibles</p>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <p>Node Craft</p>
            <button onClick={() => loginWithRedirect()}>Iniciar Sesión</button>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
