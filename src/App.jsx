import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import {redirect, useNavigate} from 'react-router-dom';
import {
  fetchUser,
  fetchFixtures,
  signUpUser,
  logInUser,
  addMoneyToWallet as addMoneyService,
  viewMyBonuses as viewMyBonusesService,
} from './services/apiService.jsx';

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
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [result, setResult] = useState('home');
  const [quantity, setQuantity] = useState(1);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [authAction, setAuthAction] = useState(() => {
    return localStorage.getItem('authAction') || null;
  });
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  const fixturesPerPage = 12;

  const handleBuyBonusClick = (fixture) => {
    if (walletBalance >= 1000) {
      setSelectedFixture(fixture);
      setShowBuyModal(true);
    } else {
      setShowAddMoneyModal(true);
    }
  };

  const buyBonus = async (fixture, result, quantity) => {
    const encodedUserId = localStorage.getItem('userId');

    if (!encodedUserId) {
      alert('Usuario no encontrado.');
      return;
    }
  
    try {
      const token = await getAccessTokenSilently();
      console.log("mira tu")
      const response = await axios.post(
        `${apiUrl}/fixtures/${fixture.fixture_id}/compra`, 
        { 
          userId: encodedUserId, 
          result: result, 
          quantity: quantity
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      // del post me debería llegar un message: "Compra iniciada con éxito", un url y un token
      console.log("obtuvimos el token")
      console.log("url:", response.data.url)
      console.log('token:', response.data.token)

      if (response.data.url && response.data.token) { 
        navigate('/confirm-purchase', {
          state: {
            url: response.data.url,
            token: response.data.token,
            amount: quantity,
            fixture: fixture,
            result: result,
            locationInfo: response.data.location,
            request_id: response.data.request_id
          }
        });

        if (response.data.error) {
          alert(response.data.error);
        }
      } else {
        alert('Error al iniciar la transacción.');
      }
    } catch (error) {
      console.error('Error al realizar la compra:', error);
      alert('Hubo un error al procesar la compra.');
    }
  };
  
  // eslint-disable-next-line
  useEffect(() => {
    const initializeUser = async () => {
      if (isAuthenticated) {
        try {
          let userId = localStorage.getItem('userId');
          if (!userId) {
            // Si no hay userId en el localStorage, buscarlo del backend
            const token = await getAccessTokenSilently();
            const apiUrl = process.env.REACT_APP_API_URL;
            const response = await axios.get(`${apiUrl}/users`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            const users = response.data.users;
            const existingUser = users.find(u => u.email === user.email);
            console.log("existingUser", existingUser)
            if (existingUser) {
              userId = existingUser.id;
              localStorage.setItem('userId', userId);
            } else {
              // Si el usuario no existe en la base de datos, crearlo
              userId = await signUpUser(user, getAccessTokenSilently);
            }
          }
          const wallet = await fetchUser(userId, getAccessTokenSilently);
          setWalletBalance(wallet);
          const uniqueFixtures = await fetchFixtures(getAccessTokenSilently);
          setFixtures(uniqueFixtures);
          setFilteredFixtures(uniqueFixtures);
        } catch (error) {
          console.error('Error initializing user:', error);
        }
      }
    };

    initializeUser();
    // eslint-disable-next-line
  }, [isAuthenticated, authAction]);

  const handleLogInClick = () => {
    setAuthAction('login');
    loginWithRedirect();
  };

  const handleSignUpClick = () => {
    setAuthAction('signup');
    loginWithRedirect({
      screen_hint: 'signup'
    });
  };
  
  // UseEffect para aplicar los filtros
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

  // Función para añadir dinero a la wallet
  const handleAddMoneyToWallet = async () => {
    const amount = prompt('Enter the amount to add to your wallet:');
    const parsedAmount = parseInt(amount, 10);

    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      try {
        const newBalance = await addMoneyService(parsedAmount, getAccessTokenSilently);
        setWalletBalance(newBalance);
        alert(`Added $${parsedAmount} to your wallet.`);
      } catch (error) {
        alert('Failed to add money to wallet.');
      }
    } else { 
      alert('Invalid amount entered. Please enter a valid integer.');
    }
  };

  // Función para ver mis bonos
  const handleViewBonuses = async () => {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      alert('No se pudo encontrar el ID del usuario.');
      return;
    }

    try {
      const fetchedBonuses = await viewMyBonusesService(userId, getAccessTokenSilently);
      setBonuses(fetchedBonuses);
      setShowModal(true);
    } catch (error) {
      alert('Error al obtener los bonuses.');
    }
  };

  const handleLogout = () => {
    // Eliminar userId del localStorage
    localStorage.removeItem('userId');

    // Llamar a la función logout
    logout({ returnTo: window.location.origin });
    // logout({ returnTo: 'http://localhost:3000/' }); // debugging

  };

  const redirectToMyRequests = () => {
    navigate('/my-requests');
  }

  console.log("isAuthenticated", isAuthenticated)

  return (
    <div className="App">
      <header className="App-header">
        {isAuthenticated ? (
          <>
            <img src={user.picture} alt={user.name} className="App-logo" />
            <p>Welcome, {user.name}</p>
            <button onClick={handleLogout}>
              Log Out
            </button>
            <div className="wallet-balance">
              <p>Wallet Balance: ${walletBalance}</p>
              <button onClick={handleAddMoneyToWallet}>Add Money to Wallet</button>
            </div>
            <div className="bonuses-section">
              <button onClick={redirectToMyRequests}>My Requests</button>
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
                        <div key={index}>
                          <p>{odd.name}: Odd</p>
                          {odd.values.map((valueObj, valueIndex) => (
                            <p key={valueIndex}>{valueObj.value}: {valueObj.odd}</p>
                          ))}
                          <div className='text-colored'>Bonos: {fixture.bonos}</div>
                        </div>
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

            {showProcessingModal && (
              <div className="modal">
                <div className="modal-content">
                  <h2 className='text-colored'>Procesando tu compra...</h2>
                  <p className='text-colored'>Por favor, espera mientras validamos la compra.</p>
                  <p className='text-colored'>Te avisaremos cuando hayamos validado tu compra</p>
                  <button onClick={() => setShowProcessingModal(false)}>Cerrar</button>
                </div>
              </div>
            )}

            {showBuyModal && (
              <div className="modal">
                <div className="modal-content">
                  <h2 className='text-colored'>Confirmar Compra</h2>
                  <label className='text-colored'>
                    Cantidad:
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                    />
                  </label>
                  <label className='text-colored'>
                    Resultado:
                    <select value={result} onChange={(e) => setResult(e.target.value)}>
                      <option value="home">Home</option>
                      <option value="away">Away</option>
                      <option value="draw">Draw</option>
                    </select>
                  </label>
                  <button onClick={() => buyBonus(selectedFixture, result, quantity)}>Confirmar Compra</button>
                  <button onClick={() => setShowBuyModal(false)}>Cancelar</button>
                </div>
              </div>
            )}


            {showAddMoneyModal && (
              <div className="modal">
                <div className="modal-content">
                  <h2 className='text-colored'>Insufficient funds</h2>
                  <p className='text-colored'>Your current balance is not enough to buy the bonus. Please add money to your wallet.</p>
                  <button onClick={handleAddMoneyToWallet}>Add Money</button>
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
                        <p className='text-colored'>League: {bonus.league_name}</p>
                        <p className='text-colored'>Round: {bonus.round}</p>
                        <p className='text-colored'>Date: {new Date(bonus.date).toLocaleDateString()}</p>
                        <p className='text-colored'>Result: {bonus.result}</p>
                        <p className='text-colored'>Quantity: {bonus.quantity}</p>
                        <p className='text-colored'>Processed: {bonus.processed ? 'Yes' : 'No'}</p>
                        <p className='text-colored'>Odd: {bonus.odd}</p>
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
            <button onClick={handleLogInClick}>Log In</button>
            <button onClick={handleSignUpClick}>Sign Up</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;