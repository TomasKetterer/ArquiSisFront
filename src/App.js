import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

function App() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const [fixtures, setFixtures] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const fixturesPerPage = 24; 

  // Fetch the fixtures data
  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const response = await axios.get('https://nodecraft.me/fixtures');
        setFixtures(response.data.data);
      } catch (error) {
        console.error('Error fetching fixtures:', error);
      }
    };
    fetchFixtures();
  }, []);

  // Calculate current fixtures to display based on pagination
  const indexOfLastFixture = currentPage * fixturesPerPage;
  const indexOfFirstFixture = indexOfLastFixture - fixturesPerPage;
  const currentFixtures = fixtures.slice(indexOfFirstFixture, indexOfLastFixture);

  // Function to change pages
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
            
            <div className="fixtures-grid">
              {currentFixtures.length > 0 ? (
                currentFixtures.map(fixture => (
                  <div key={fixture.fixture.id} className="fixture-item">
                    <div className="team-info">
                      <img src={fixture.teams.home.logo} alt={fixture.teams.home.name} />
                      <span>{fixture.teams.home.name}</span>
                    </div>
                    <div className="team-info">
                      <img src={fixture.teams.away.logo} alt={fixture.teams.away.name} />
                      <span>{fixture.teams.away.name}</span>
                    </div>
                    <div className="fixture-date">
                      <p>{new Date(fixture.fixture.date).toLocaleDateString()}</p>
                    </div>
                    <div className="fixture-odds">
                      {fixture.odds.map((odd, index) => (
                        <p key={index}>{odd.name}: {odd.values.join(', ')}</p>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p>No fixtures available</p>
              )}
            </div>

            {/* Pagination controls */}
            <div className="pagination">
              {Array.from({ length: Math.ceil(fixtures.length / fixturesPerPage) }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => paginate(index + 1)}
                  className={currentPage === index + 1 ? 'active' : ''}
                >
                  {index + 1}
                </button>
              ))}
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

export default App;