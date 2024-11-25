import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import {useNavigate} from 'react-router-dom';
import getRolesToken from './services/authService.js';
import {
  fetchUser,
  fetchFixtures,
  signUpUser,
  addMoneyToWallet as addMoneyService
} from './services/apiService.jsx';
import { v4 as uuidv4 } from 'uuid';

import { 
  madeRecommendations
} from './workers-functions.js';

function App() {
  const { loginWithRedirect, logout, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const [role, setRole] = useState("user");
  const [RolesToken, setRolesToken] = useState(null);
  const [isReserving, setIsReserving] = useState(false);
  const [fixtures, setFixtures] = useState([]);
  const [auctionQuantities, setAuctionQuantities] = useState({});
  const [filteredFixtures, setFilteredFixtures] = useState([]);
  const [showReservedFixtures, setShowReservedFixtures] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ home: '', away: '', date: '' });
  const [walletBalance, setWalletBalance] = useState(0);
  const [bonuses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false); 
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [result, setResult] = useState('home');
  const [quantity, setQuantity] = useState(1);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState(() => {
    return localStorage.getItem('authAction') || null;
  });
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  const [workerAvailable, setWorkerAvailable] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const fixturesPerPage = 12;

  const handleBuyBonusClick = (fixture) => {
    if (walletBalance >= 1000) {
      setSelectedFixture(fixture);
      setShowBuyModal(true);
    } else {
      setShowAddMoneyModal(true);
    }
  };

  const handleConfirmPurchase = (fixture) => {
    // revisar si tengo fondos suficientes
    let amount;
    if (showReservedFixtures) {
      console.log(fixture.result)
      setResult(fixture.result);
      amount = quantity * 1000 * (1 - selectedFixture.discount);
    } else {
      amount = quantity * 1000;
    }

    if (walletBalance < amount) {
      alert('Fondos insuficientes');
      return;
    }
    
    buyBonus(selectedFixture, result, quantity);
    localStorage.setItem('isReserving', isReserving);
    setShowBuyModal(false);
    setIsReserving(false); // Resetear el estado después de confirmar
  };

  const handleAuctionQuantityChange = async (e, fixtureId, result, bonos_disponibles) => {
    console.log(fixtureId);
    console.log(result);

    const quantity = parseInt(e.target.value, 10);
    const key = `${fixtureId}-${result}`;

    if (quantity < 0 || quantity > bonos_disponibles) {
      alert('La cantidad debe estar entre 0 y los bonos reservados disponibles.');
      return;
    }
    setAuctionQuantities({...auctionQuantities, [key]: quantity});
  };

  const handleAuctionBonusClick = async (fixture) => {
    const fixtureId = fixture.fixture_id;
    const result = fixture.result || "---";
    const bonos_reservados = fixture.bonos;
    const key = `${fixtureId}-${result}`;
    const quantity = auctionQuantities[key];
    if (!quantity || quantity <= 0 || quantity > bonos_reservados) {
      alert('Por favor, ingresa una cantidad válida para subastar.');
      return;
    }
    if (quantity > bonos_reservados) {
      alert(`No puedes subastar más de ${bonos_reservados} bonos reservados.`);
      return;
    }
    // Lógica para manejar la subasta
    console.log(`Subastar ${quantity} bonos`);

    try {
      const token = await getAccessTokenSilently();
      const roles_token = localStorage.getItem("RolesToken");
      console.log(roles_token)
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/fixtures/${fixtureId}/auction/${user.sub}`,
        {
          league_name: fixture.league_name,
          round: fixture.league_round,
          result: fixture.result || "---",
          quantity: quantity
        },
        {
          headers: {
            Authorization: `Bearer ${roles_token}`,
          },
        }
      );
      alert("Subasta iniciada con éxito");
    } catch (error) {
      console.error("Error iniciando la subasta:", error);
      alert("Ocurrió un error al iniciar la subasta.");
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
      console.log(result);
      const response = await axios.post(
        `${apiUrl}/fixtures/${fixture.fixture_id}/compra`, 
        { 
          userId: encodedUserId, 
          result: result, 
          quantity: quantity,
          is_admin_bono: showReservedFixtures
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

      let amount;
      if (fixture.discount) {
        amount = quantity * 1000 * (1 - selectedFixture.discount);
      } else {
        amount = quantity * 1000;
      }

      if (response.data.url && response.data.token) { 
        navigate('/confirm-purchase', {
          state: {
            url: response.data.url,
            token: response.data.token,
            amount: amount,
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
          const token = await getAccessTokenSilently();
          if (!userId) {
            // Si no hay userId en el localStorage, buscarlo del backend
            console.log(token)
            const DOMAIN = process.env.REACT_APP_AUTH0_DOMAIN;
            const ROLES_TOKEN = await getRolesToken();
            console.log('roles token:', ROLES_TOKEN);
            localStorage.setItem('RolesToken', ROLES_TOKEN)
            setRolesToken(ROLES_TOKEN);
            console.log(user.sub)
            try{
              const rolesResponse = await axios.get(`https://${DOMAIN}/api/v2/users/${user.sub}/roles`, {
                headers: {
                  'Authorization': `Bearer ${ROLES_TOKEN}`,
                }
              });
              const roles = rolesResponse.data.map((role) => role.name);
              setRole(roles);
              localStorage.setItem('role', roles);
            } catch (error) {
              console.error("Error al obtener roles:", error.response?.data || error.message);
              return;
            }

            const isUserAdmin = localStorage.getItem('role').includes('Admin');
            console.log("isAdmin", isUserAdmin);
            //obtener lista de usuarios
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

            // Actualizar isAdmin en la base de datos
            try {
              await axios.patch(
                `${apiUrl}/users/${userId}/isAdmin`, 
                { isAdmin: isUserAdmin },
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );
              console.log(`isAdmin actualizado a ${isUserAdmin} para el usuario ${userId}`);
            } catch (error) {
              console.error('Error al actualizar isAdmin:', error.response?.data || error.message);
            }
          }
          const wallet = await fetchUser(userId, getAccessTokenSilently);
          setWalletBalance(wallet);
          const uniqueFixtures = await fetchFixtures(getAccessTokenSilently, showReservedFixtures);
          setFixtures(uniqueFixtures);
          setFilteredFixtures(uniqueFixtures);
          checkWorkerStatus();
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

  // UseEffect para cambiar las fixtures

  useEffect(() => {
    const loadFixtures = async () => {
      try {
        console.log("Intentando cargar fixtures...");
        const fetchedFixtures = await fetchFixtures(getAccessTokenSilently, showReservedFixtures);
        console.log("Fixtures cargadas:", fetchedFixtures);
        setFixtures(fetchedFixtures);
        if (showReservedFixtures === "false")
        {
          setFilteredFixtures(fetchedFixtures);
        }
        if (showReservedFixtures && selectedFixture) {
          const updatedFixture = fetchedFixtures.find(f => f.fixture_id === selectedFixture.fixture_id);
          if (updatedFixture) {
            setSelectedFixture(updatedFixture);
          }
        }
        
      } catch (error) {
        console.error("Error en loadFixtures:", error);
      }
    };
    loadFixtures();
  }, [showReservedFixtures]);
  
  
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

  const handleLogout = () => {
    // Eliminar userId del localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('role');

    // Llamar a la función logout
    logout({ returnTo: window.location.origin });
    // logout({ returnTo: 'http://localhost:4000/' }); // debugging

  };

  const redirectToMyRequests = () => {
    navigate('/my-requests');
  }

  console.log("isAuthenticated", isAuthenticated)

  const checkWorkerStatus = async () => {
    try {
      const response = await axios.get('https://nodecraft.me/heartbeat');
      setWorkerAvailable(response.data.status === true);
    } catch (error) {
      console.error('Error checking worker status:', error);
      setWorkerAvailable(false);
    }
  };

  const makeRecommendations = async () => {
    let userId = localStorage.getItem('userId');
    const result = await madeRecommendations(userId);
    console.log(result);
    setRecommendation(result); 
  };

  const handleActivateDiscount = async () => {
    if (discountPercentage < 0 || discountPercentage > 10) {
      alert('Discount percentage must be between 0 and 10.');
      return;
    }

    try {
      const token = await getAccessTokenSilently()
      await axios.post(
        `${apiUrl}/fixtures/${user.sub}/discount`,
        { discount: discountPercentage },
        {
          headers: {
            Authorization: `Bearer ${RolesToken}`
          }
        }
      );// Refrescar fixtures reservadas
      if (showReservedFixtures) {
        const fetchedFixtures = await fetchFixtures(getAccessTokenSilently, true);
        setFixtures(fetchedFixtures);
        setFilteredFixtures(fetchedFixtures);
      }
      alert('Descuento aplicado exitosamente');
    } catch (error) {
      console.error('Error al aplicar descuento:', error);
      alert('Error al aplicar descuento');
    }
  };

  const getBetResult = (fixture) => {
    if (!fixture.result) return 'Resultado desconocido';
    
    const result = fixture.result.toLowerCase();
    
    switch(result) {
      case 'home':
        return fixture.home_team_name;
      case 'away':
        return fixture.away_team_name;
      case 'draw':
      case 'drew':
        return 'Empate';
      default:
        return 'Resultado desconocido';
    }
  };

  return (
    <div className="App">
  <header className="App-header">
    {isAuthenticated ? (
      <>
        <div className={`user-info-container ${isUserModalOpen ? 'open' : 'closed'}`}>
          <div className="user-info">
            {isUserModalOpen && (
              <>
                <div className="user-content">
                  <div className="user-details">
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="user-picture"
                    />
                    <h3>User Information</h3>
                    <p>
                      Welcome, {user.name}
                      <br />
                      isAdmin?{' '}
                      {localStorage.getItem('role') === 'Admin' ? 'true' : 'false'}
                    </p>
                    <button onClick={handleLogout} className="logout-button">
                      Log Out
                    </button>
                    <div className="wallet-balance">
                      <p>Wallet Balance: ${walletBalance}</p>
                      <button
                        onClick={handleAddMoneyToWallet}
                        className="add-money-button">
                        Add Money to Wallet
                      </button>
                    </div>
                    <div className="bonuses-section">
                      <button
                        onClick={redirectToMyRequests}
                        className="my-requests-button">
                        My Requests
                      </button>
                      {localStorage.getItem('role') === 'Admin' && (
                      <button
                        onClick={() => navigate('/view-offers')}
                        className="my-requests-button">
                        View Offers
                      </button>
                      )}
                      {localStorage.getItem('role') === 'Admin' && (
                      <button
                        onClick={() => navigate('/view-proposals')}
                        className="my-requests-button">
                        View Proposals
                      </button>
                      )}
                    </div>
                    <div className="worker-status">
                      <p>
                        Worker Status: {workerAvailable ? 'Available' : 'Unavailable'}
                      </p>
                    </div>
                  </div>
                  {localStorage.getItem('role') === "Admin" && (
                    <div className="admin-discount-section">
                      <h3>Activar Descuento para Bonos Reservados</h3>
                      <label className="discount-label">
                        Porcentaje (0% - 10%):
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={discountPercentage}
                          onChange={(e) => setDiscountPercentage(e.target.value)}
                          className="discount-input"
                        />
                      </label>
                      <button
                        onClick={handleActivateDiscount}
                        className="activate-discount-button">
                        Aplicar Descuento
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <button
          className={`external-toggle-button ${isUserModalOpen ? 'open' : 'closed'}`}
          onClick={() => setIsUserModalOpen(!isUserModalOpen)}
        >
          {isUserModalOpen ? '<' : '>'}
        </button>

            
        <div className="filters-container">
          <h3 className="filters-title">Filters</h3>
          <div className="filters">
            <div className="filter-group">
              <label htmlFor="filter-home" className="filter-label">Home Team</label>
              <input
                id="filter-home"
                type="text"
                placeholder="Filter by home team"
                value={filters.home}
                onChange={(e) => setFilters({ ...filters, home: e.target.value })}
                className="filter-input"/>
            </div>
            <div className="filter-group">
              <label htmlFor="filter-away" className="filter-label">Away Team</label>
              <input
                id="filter-away"
                type="text"
                placeholder="Filter by away team"
                value={filters.away}
                onChange={(e) => setFilters({ ...filters, away: e.target.value })}
                className="filter-input"/>
            </div>
            <div className="filter-group">
              <label htmlFor="filter-date" className="filter-label">Date</label>
              <input
                id="filter-date"
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="filter-input"/>
            </div>
          </div>
        </div>

            <div className="recommendation-section">
              <button onClick={() => makeRecommendations()} className="recommendation-button">
                Ask for Recommendation
              </button>
              {recommendation && (
                <div className="recommendation-result">
                  <h3>Recommendation:</h3>
                  <pre>{JSON.stringify(recommendation, null, 2)}</pre>
                </div>
              )}
            </div>

            <button onClick={() => setShowReservedFixtures(!showReservedFixtures)} className='recommendation-button'>
              {showReservedFixtures ? 'Ver Fixtures Generales' : 'Ver Fixtures Reservados'}
            </button>

            <div className="fixtures-grid">
              {currentFixtures.length > 0 ? (
                currentFixtures.map((fixture) => (
                  <div key={`${fixture.fixture_id}-${fixture.result}`} className="fixture-item">
                    <div className="league-info">
                      <p>{fixture.league_name}</p>
                    </div>
                    <div className="teams-container">
                      <div className="team-info">
                        <img
                          src={fixture.home_team_logo}
                          alt={fixture.home_team_name}
                          className="team-logo"
                        />
                        <span className="text-colored">{fixture.home_team_name}</span>
                      </div>
                      <span className="vs-text">vs</span>
                      <div className="team-info">
                        <img
                          src={fixture.away_team_logo}
                          alt={fixture.away_team_name}
                          className="team-logo"
                        />
                        <span className="text-colored">{fixture.away_team_name}</span>
                      </div>
                    </div>
                    <div className="fixture-date">
                      <p>
                        {new Date(fixture.date).toLocaleDateString()} -{" "}
                        {new Date(fixture.date).toLocaleTimeString()}
                      </p>
                    </div>
              
                    <div className="fixture-odds">
                      {Array.isArray(fixture.odds) && fixture.odds.length > 0 && fixture.odds[0].name !== "No odd" ? (
                        fixture.odds.map((odd, index) => (
                          <div key={index} className="odds-info">
                            <div className="odds-values">
                              {odd.values && odd.values.length > 0 ? (
                                odd.values.map((valueObj, valueIndex) => (
                                  <div key={valueIndex} className="odds-value">
                                    <p>{valueObj.value}</p>
                                    <p>{valueObj.odd}</p>
                                  </div>
                                ))
                              ) : (
                                <p>No odds available</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-odds">No odds available</p>
                      )}
                    </div>
                    
                    <div className="bonos-info">
                      Bonos: {fixture.bonos}
                    </div>
                    
                    {/* Nueva sección para mostrar el resultado de la apuesta */}
                    {showReservedFixtures && (
                      <div className="fixture-bet-result">
                        <p>Apuesta a: {getBetResult(fixture)}</p>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleBuyBonusClick(fixture)}
                      className="buy-button">
                      Purchase
                    </button>
                    
                    {localStorage.getItem("role") === "Admin" && showReservedFixtures === true && (
                      <div className="auction-container">
                        <input
                          type="number"
                          min="1"
                          max={fixture.bonos}
                          placeholder="Cantidad de bonos"
                          value={auctionQuantities[`${fixture.fixture_id}-${fixture.result}`] || 0}
                          onChange={(e) => handleAuctionQuantityChange(e, fixture.fixture_id, fixture.result, fixture.bonos)}
                          className="auction-input"
                        />
                        <button
                          onClick={() => handleAuctionBonusClick(fixture)}
                          className="buy-button">
                          Subastar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-fixtures text-colored">No fixtures available</p>
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
              <div className="modal-2">
                <div className="modal-content-2">
                  <h2 className="modal-title">Confirmar Compra</h2>
                  <div className="modal-body">
                    <label className="modal-label">
                      <p>Cantidad:</p>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        className="modal-input"/>
                    </label>
                    {localStorage.getItem('role') === "Admin" && (showReservedFixtures === false) && (
                      <label className="modal-label">
                        <p>Reservar Bonos</p>
                        <input
                          type="checkbox"
                          checked={isReserving}
                          onChange={(e) => setIsReserving(e.target.checked)}
                          className="modal-checkbox"/>
                      </label>
                    )}
                    {showReservedFixtures ? (
                      <div className="result-info">
                        <p><strong>Resultado: </strong>{selectedFixture.result === "home" ? selectedFixture.home_team_name : selectedFixture.result === "away" ? selectedFixture.away_team_name : "Empate"}</p>
                      </div>
                    ) : (
                      <label className="modal-label">
                        <p>Resultado:</p>
                        <select
                          value={result}
                          onChange={(e) => setResult(e.target.value)}
                          className="modal-select">
                          <option value="home">Home</option>
                          <option value="away">Away</option>
                          <option value="draw">Draw</option>
                        </select>
                      </label>
                    )}
                    <div className="price-info">
                      <p>Precio: ${showReservedFixtures ? quantity * 1000 * (1 - selectedFixture.discount) : quantity*1000}</p>
                      {(showReservedFixtures === true) && (selectedFixture.discount > 0) && (
                        <h4>{100 * selectedFixture.discount}% de descuento!</h4>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      onClick={() => handleConfirmPurchase(selectedFixture)}
                      className="modal-button confirm-button">
                      Confirmar Compra
                    </button>
                    <button
                      onClick={() => {setShowBuyModal(false); setIsReserving(false);}}
                      className="modal-button cancel-button">
                      Cancelar
                    </button>
                  </div>
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