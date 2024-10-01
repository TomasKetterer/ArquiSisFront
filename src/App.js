import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

function App() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const [fixtures, setFixtures] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const fixturesPerPage = 24; 

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

  const indexOfLastFixture = currentPage * fixturesPerPage;
  const indexOfFirstFixture = indexOfLastFixture - fixturesPerPage;
  const currentFixtures = fixtures.slice(indexOfFirstFixture, indexOfLastFixture);

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
            
            <div className="fixtures-grid">
              {currentFixtures.length > 0 ? (
                currentFixtures.map(fixture => (
                  <div key={fixture.fixture_id} className="fixture-item">
                    <div className="league-info">
                      <p>{fixture.league_name}</p>
                    </div>
                    <div className="team-info">
                      <img src={fixture.home_team_logo} alt={fixture.home_team_name} />
                      <span>{fixture.home_team_name}</span>
                      <span> vs</span>
                      <img src={fixture.away_team_logo} alt={fixture.away_team_name} />
                      <span>{fixture.away_team_name}</span>
                    </div>
                    <div className="fixture-date">
                      <p>{new Date(fixture.date).toLocaleDateString()} - {new Date(fixture.date).toLocaleTimeString()}</p>
                    </div>
                    <div className="fixture-goals">
                      <p>Score: {fixture.goals_home} - {fixture.goals_away}</p>
                    </div>
                    <div className="fixture-odds">
                      {fixture.odds && fixture.odds.map((odd, index) => (
                        <p key={index}>{odd.name}: {odd.values.join(', ')}</p>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p>No fixtures available</p>
              )}
            </div>

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

export default App;
