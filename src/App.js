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
  const [showBuyModal, setShowBuyModal] = useState(false); 
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [result, setResult] = useState('home');
  const [quantity, setQuantity] = useState(1);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const fixturesPerPage = 24;

  const getFixturesHistory = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get('https://api.nodecraft.me/fixtures/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.fixtures;
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      return [];
    }
  };

  const analyzeBonuses = async () => {
    const fixturesHistory = await getFixturesHistory();

    try {
      const token = await getAccessTokenSilently();
      const usersResponse = await axios.get('https://api.nodecraft.me/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const users = usersResponse.data;

      for (const user of users) {
        const { bonos } = user;

        for (const [fixtureId, bonus] of Object.entries(bonos)) {
          const matchingFixture = fixturesHistory.find(fixture => fixture.fixture.id === parseInt(fixtureId));

          if (matchingFixture) {
            const homeGoals = matchingFixture.goals.home;
            const awayGoals = matchingFixture.goals.away;

            const correctResult = (bonus.result === 'home' && homeGoals > awayGoals) ||
                                  (bonus.result === 'away' && awayGoals > homeGoals) ||
                                  (bonus.result === 'draw' && homeGoals === awayGoals);

            if (correctResult) {
              await rewardUser(user, bonus);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users or analyzing bonuses:', error);
    }
  };

  const rewardUser = async (user, bonus) => {
    try {
      const { odds, quantity } = bonus;
      const oddMultiplier = odds[bonus.result];
      const rewardAmount = quantity * 1000 * oddMultiplier;

      const token = await getAccessTokenSilently();

      await axios.patch(`https://api.nodecraft.me/users/${user.id}/wallet`, {
        amount: rewardAmount,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`Recompensa de ${rewardAmount} entregada al usuario ${user.id}`);
    } catch (error) {
      console.error(`Error rewarding user ${user.id}:`, error);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(analyzeBonuses, 300000);
    return () => clearInterval(intervalId);
  }, []);

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

  const fetchUser = async () => {
    try {
      const encodedUserId = localStorage.getItem('userId');

      const token = await getAccessTokenSilently();
      const response = await axios.get(`https://api.nodecraft.me/users/${encodedUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWalletBalance(response.data.wallet);
      setBonuses(response.data.bonos);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchFixtures = async () => {
    try {
      const response = await axios.get('https://api.nodecraft.me/fixtures');
      const uniqueFixtures = removeDuplicateFixtures(response.data.data);
      setFixtures(uniqueFixtures);
      setFilteredFixtures(uniqueFixtures);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    }
  };

  const createUser = async () => {
    try {
      const token = await getAccessTokenSilently();
      const encodedUserId = encodeURIComponent(user.sub).substring(16);
      await axios.post('https://api.nodecraft.me/users', 
        { 
          id: encodedUserId,
          username: user.nickname, 
          email: user.email, 
          password: "NoHayPassword", 
          wallet: 0.0, 
          bonos: {} 
        }, 
        {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      localStorage.setItem('userId', encodedUserId);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const addMoneyToWallet = async () => {
    const amount = prompt('Enter the amount to add to your wallet:');
    const parsedAmount = parseInt(amount, 10);

    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      try {
        const userId = localStorage.getItem('userId');

        const token = await getAccessTokenSilently();
        const response = await axios.patch(
          `https://api.nodecraft.me/users/${userId}/wallet`,
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
      alert('Invalid amount entered. Please enter a valid integer.');
    }
};

  const handleBuyBonusClick = (fixture) => {
    if (walletBalance >= 1000) {
      setSelectedFixture(fixture);
      setShowBuyModal(true);
    } else {
      setShowAddMoneyModal(true);
    }
  };

  const buyBonus = async () => {
    const cost = 1000;
    const encodedUserId = localStorage.getItem('userId');
    const token = await getAccessTokenSilently();
    if (result === 'draw') {
      result = '---';
    }

    if (walletBalance >= cost && selectedFixture.nuevosBonos > 0) {
      try {
        const request = await axios.post('https://api.nodecraft.me/mqtt/publish-request',
          { 
            fixture_id: selectedFixture.fixture_id,
            league_name: selectedFixture.league_name,
            round: selectedFixture.round,
            date: selectedFixture.date,
            result: result,
            quantity: quantity
          }
        );

        if (!request.data.valid) {
          alert('Invalid request');
          return;
        }

        const response = await axios.patch(
          `https://api.nodecraft.me/users/${encodedUserId}/wallet`,
          { amount: -cost },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        fetchUser();

        alert(`Bought a bonus for fixture ${selectedFixture.fixture_id}`);
        const valueBonus = selectedFixture.bonos - 1;
        const fixtureResponse = await axios.patch(
          `https://api.nodecraft.me/fixtures/${selectedFixture.fixture_id}/bonos`,
          { nuevosBonos: valueBonus },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const addBonusToUser = await axios.patch(
          `https://api.nodecraft.me/users/${encodedUserId}/bonos`,
          {
            bonos: {
              fixture_id: selectedFixture.fixture_id,
              league_name: selectedFixture.league_name,
              round: selectedFixture.round,
              date: selectedFixture.date,
              result: result,
              quantity: quantity,
              odd: selectedFixture.odds
            }
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        alert('Failed to buy bonus.');
      }
    } else {
      alert('Insufficient funds in wallet.');
    }
  };

  const viewMyBonuses = () => {
    setShowModal(true);
  };

  useEffect(() => {
    if (isAuthenticated) {
      createUser();
      fetchFixtures();
      fetchUser();
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
            <p>Welcome,</p>
            <button onClick={() => logout({ returnTo: window.location.origin })}>
              Log Out
            </button>
            <div className="wallet-balance">
              <p>Wallet Balance: ${walletBalance}</p>
              <button onClick={addMoneyToWallet}>Add Money to Wallet</button>
            </div>
            <div className="bonuses-section">
              <button onClick={viewMyBonuses}>View My Bonuses</button>
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
                    <div className="teams-container">
                      <div className="team-info">
                        <img src={fixture.home_team_logo} alt={fixture.home_team_name} />
                        <span>{fixture.home_team_name}</span>
                      </div>
                      <span className='text-colored'> vs </span>
                      <div className="team-info">
                        <img src={fixture.away_team_logo} alt={fixture.away_team_name} />
                        <span>{fixture.away_team_name}</span>
                      </div>
                    </div>
                    <div className="fixture-date">
                      <p>{new Date(fixture.date).toLocaleDateString()} - {new Date(fixture.date).toLocaleTimeString()}</p>
                    </div>
                    <div className="fixture-goals">
                      <p>Score: {fixture.goals_home} - {fixture.goals_away}</p>
                    </div>
                    <div className="fixture-odds">
                      {fixture.odds && fixture.odds.map((odd, index) => (
                        <>
                          <p>{odd.name}: Odd</p>
                          <div key={index}>
                          {odd.values.map((valueObj, valueIndex) => (
                            <p key={valueIndex}>{valueObj.value}: {valueObj.odd}</p>
                          ))}
                          <div className='text-colored'>Bonos: {fixture.bonos}</div>
                        </div>
                          </>
                      ))}
                    </div>
                    <button onClick={() => handleBuyBonusClick(fixture)}>Buy Bonus</button>
                  </div>
                ))
              ) : (
                <p className='text-colored'>No fixtures available</p>
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

            {showBuyModal && (
              <div className="modal">
                <div className="modal-content">
                  <h2 className='text-colored'>Buy Bonus</h2>
                  <label>
                    Quantity:
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                    />
                  </label>
                  <label className='text-colored'>
                    Result:
                    <select value={result} onChange={(e) => setResult(e.target.value)}>
                      <option className='text-colored' value="home">Home</option>
                      <option className='text-colored' value="away">Away</option>
                      <option className='text-colored' value="draw">Draw</option>
                    </select>
                  </label>
                  <button onClick={buyBonus(selectedFixture, result, quantity)}>Confirm Purchase</button>
                  <button onClick={() => setShowBuyModal(false)}>Cancel</button>
                </div>
              </div>
            )}

            {showAddMoneyModal && (
              <div className="modal">
                <div className="modal-content">
                  <h2 className='text-colored'>Insufficient funds</h2>
                  <p className='text-colored'>Your current balance is not enough to buy the bonus. Please add money to your wallet.</p>
                  <button onClick={addMoneyToWallet}>Add Money</button>
                  <button onClick={() => setShowAddMoneyModal(false)}>Close</button>
                </div>
              </div>
            )}

            {showModal && (
              <div className="modal">
                <div className="modal-content">
                  <h2 className='text-colored'>My Bonuses</h2>
                  {bonuses.length > 0 ? (
                    bonuses.map((bonus, index) => (
                      <div key={index} className="bonus-item">
                        <p className='text-colored'>Fixture ID: {bonus.fixture_id}</p>
                        <p className='text-colored'>Team Supported: {bonus.team_name}</p>
                        <p className='text-colored'>Bet Amount: ${bonus.amount}</p>
                        <p className='text-colored'>Status: {bonus.status}</p>
                      </div>
                    ))
                  ) : (
                    <p className='text-colored'>No bonuses found.</p>
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
