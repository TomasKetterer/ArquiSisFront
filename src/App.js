import './App.css';
import { useAuth0 } from '@auth0/auth0-react';
import useApi from './api.js';

function App() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const apiData = useApi('https://tu-api.com/endpoint-protegido');

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
            <div>
              <h2>Datos de la API:</h2>
              <pre>{JSON.stringify(apiData, null, 2)}</pre>
            </div>
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
