import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

function App() {
  const { loginWithRedirect, logout, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const [fixtures, setFixtures] = useState([]);
  const [filteredFixtures, setFilteredFixtures] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ home: '', away: '', date: '' });
  const [walletBalance, setWalletBalance] = useState(0);
  const [bonuses, setBonuses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const fixturesPerPage = 24;

  const removeDuplicateFixtures = (fixtures) => {
    const uniqueFixtures = [];
    const fixtureIds = new Set();

    for (const fixture of fixtures) {
      if (!fixtureIds.has(fixture.fixture_id)) {
        fixtureIds.add(fixture.fixture_id);
        uniqueFixtures.push(fixture);
      }
    }

    return uniqueFixtures;
  };

  const fetchUserWallet = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(`https://nodecraft.me/users/${user.sub}/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWalletBalance(response.data.wallet);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchFixtures = async () => {
    try {
      const response = await axios.get('https://nodecraft.me/fixtures');
      const uniqueFixtures = removeDuplicateFixtures(response.data.data);
      setFixtures(uniqueFixtures);
      setFilteredFixtures(uniqueFixtures);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    }
  };

  const addMoneyToWallet = async () => {
    const amount = prompt('Enter the amount to add to your wallet:');
    const parsedAmount = parseFloat(amount);

    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.patch(
          `https://nodecraft.me/users/${user.sub}/wallet`,
          { amount: parsedAmount },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setWalletBalance(response.data.wallet);
        alert(`Added $${parsedAmount} to your wallet.`);
      } catch (error) {
        console.error('Error adding money to wallet:', error);
        alert('Failed to add money to wallet.');
      }
    } else {
      alert('Invalid amount entered.');
    }
  };

  const buyBonus = async (fixtureId) => {
    const cost = 1000;

    if (walletBalance >= cost) {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.patch(
          `https://nodecraft.me/users/${user.sub}/wallet`,
          { amount: -cost },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setWalletBalance(response.data.wallet);
        alert(`Bought a bonus for fixture ${fixtureId}`);
      } catch (error) {
        console.error('Error buying bonus:', error);
        alert('Failed to buy bonus.');
      }
    } else {
      alert('Insufficient funds in wallet.');
    }
  };

  const fetchUserBonuses = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(`https://nodecraft.me/users/${user.sub}/bonuses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBonuses(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching user bonuses:', error);
      alert('Failed to fetch user bonuses.');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFixtures();
      fetchUserWallet();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const applyFilters = () => {
      let filtered = fixtures;

      if (filters.home) {
        filtered = filtered.filter((fixture) =>
          fixture.home_team_name.toLowerCase().includes(filters.home.toLowerCase())
        );
      }

      if (filters.away) {
        filtered = filtered.filter((fixture) =>
          fixture.away_team_name.toLowerCase().includes(filters.away.toLowerCase())
        );
      }

      if (filters.date) {
        filtered = filtered.filter((fixture) => fixture.date.includes(filters.date));
      }

      setFilteredFixtures(filtered);
      setCurrentPage(1);
    };

    applyFilters();
  }, [filters, fixtures]);

  const indexOfLastFixture = currentPage * fixturesPerPage;
  const indexOfFirstFixture = indexOfLastFixture - fixturesPerPage;
  const currentFixtures = filteredFixtures.slice(indexOfFirstFixture, indexOfLastFixture);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="App">
      <header className="App-header">
        {isAuthenticated ? (
          <>
            <img src={user.picture} alt={user.name} className="App-logo" />
            <p>Welcome, {user.name}</p>
            <button onClick={() => logout({ returnTo: window.location.origin })}>
              Log Out
            </button>
            <div className="wallet-balance">
              <p>Wallet Balance: ${walletBalance}</p>
              <button onClick={addMoneyToWallet}>Add Money to Wallet</button>
            </div>
            <div className="bonuses-section">
              <button onClick={fetchUserBonuses}>View My Bonuses</button>
            </div>

            <div className="filters">
              <input
                type="text"
                placeholder="Filter by home team"
                value={filters.home}
                onChange={(e) => setFilters({ ...filters, home: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by away team"
                value={filters.away}
                onChange={(e) => setFilters({ ...filters, away: e.target.value })}
              />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
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
                      <span> vs </span>
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
                    <button onClick={() => buyBonus(fixture.fixture_id)}>Buy Bonus</button>
                  </div>
                ))
              ) : (
                <p>No fixtures available</p>
              )}
            </div>

            <div className="pagination">
              {Array.from({ length: Math.ceil(filteredFixtures.length / fixturesPerPage) }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => paginate(index + 1)}
                  className={currentPage === index + 1 ? 'active' : ''}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {showModal && (
              <div className="modal">
                <div className="modal-content">
                  <h2>My Bonuses</h2>
                  {bonuses.length > 0 ? (
                    bonuses.map((bonus, index) => (
                      <div key={index} className="bonus-item">
                        <p>Fixture ID: {bonus.fixture_id}</p>
                        <p>Team Supported: {bonus.team_name}</p>
                        <p>Bet Amount: ${bonus.amount}</p>
                        <p>Status: {bonus.status}</p>
                      </div>
                    ))
                  ) : (
                    <p>No bonuses found.</p>
                  )}
                  <button onClick={() => setShowModal(false)}>Close</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="welcome-container">
            <h1>Welcome to NodeCraft</h1>
            <p>Your ultimate destination for football fixtures and more!</p>
            <button onClick={() => loginWithRedirect()}>Log In</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
