import React, { useEffect, useState } from 'react';
import './ViewOffers.css';
import '../App.css';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { removeDuplicateFixtures } from '../services/apiService.jsx';

const ViewOffers = () => {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const [otherAuctions, setOtherAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [adminFixtures, setAdminFixtures] = useState([]);
  const [proposalFixtureId, setProposalFixtureId] = useState('');
  const [proposalQuantity, setProposalQuantity] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;
  const roles_token = localStorage.getItem("RolesToken");

  // Obtener el rol del usuario desde el localStorage o desde Auth0
  useEffect(() => {
    const roles = localStorage.getItem('role');
    if (roles && roles.includes('Admin')) {
      setIsAdmin(true);
    }
  }, []);

  // Función para obtener las subastas de otros grupos
  const fetchOtherAuctions = async () => {
    try {
      const token = await getAccessTokenSilently({
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: "openid profile email offline_access"
      });
      const response = await axios.get(`${apiUrl}/auctions/others/${user.sub}`, {
        headers: {
          Authorization: `Bearer ${roles_token}`
        }
      });

      setOtherAuctions(response.data.auctions);
    } catch (error) {
      console.error('Error al obtener subastas de otros grupos:', error);
    }
  };

  // useEffect para cargar las subastas al montar el componente
  useEffect(() => {
    if (isAdmin && isAuthenticated) {
      fetchOtherAuctions();
    }
  }, [isAdmin, isAuthenticated]);

  // Función para obtener las fixtures con bonos reservados del administrador
  const fetchAdminFixtures = async () => {
    try {
      const token = await getAccessTokenSilently({
        audience: "https://api.nodecraft.me",
        scope: "openid profile email offline_access"
      });

      const response = await axios.get(`${apiUrl}/fixtures/reserved`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const uniqueFixtures = removeDuplicateFixtures(response.data.data);
      const aviableFixtures = uniqueFixtures.filter(fixture => fixture.bonos > 0);
      setAdminFixtures(aviableFixtures);
    } catch (error) {
      console.error('Error al obtener fixtures reservadas del administrador:', error);
    }
  };

  // Función para manejar el clic en "Hacer Propuesta"
  const handleMakeProposalClick = (auction) => {
    setSelectedAuction(auction);
    fetchAdminFixtures(); // Obtener fixtures con bonos reservados
  };

  // Función para obtener una fixture por su ID (usando el id único de bonos_reservados)
  const getFixtureById = (fixtureKey) => {
    const [fixture_id, result] = fixtureKey.split('-');
    return adminFixtures.find(
      (fixture) => 
        fixture.fixture_id === parseInt(fixture_id) && 
        fixture.result === result
    );
  };  

  // Función para enviar la propuesta
  const submitProposal = async () => {
    if (!proposalFixtureId || proposalQuantity <= 0) {
      alert('Por favor, selecciona un partido y una cantidad válida.');
      return;
    }

    const fixture = getFixtureById(proposalFixtureId);

    if (!fixture) {
      alert('Fixture seleccionada no encontrada.');
      return;
    }

    if (proposalQuantity > fixture.bonos) {  // Cambiado a fixture.bonos
      alert(`No tienes suficientes bonos reservados para este partido. Disponibles: ${fixture.bonos}`);
      return;
    }

    try {
      const token = await getAccessTokenSilently({
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: "openid profile email offline_access"
      });

      // Enviar la propuesta al backend
      const response = await axios.post(`${apiUrl}/proposals/${user.sub}`, {
        auction_id: selectedAuction.auction_id,
        fixture_id: fixture.fixture_id,
        league_name: fixture.league_name,
        round: fixture.league_round,  // Asegúrate de que 'league_round' es el nombre correcto
        result: fixture.result,
        quantity: proposalQuantity
      }, {
        headers: {
          Authorization: `Bearer ${roles_token}`
        }
      });

      if (response.data.message === "Subasta creada con éxito") {
        alert('Propuesta enviada exitosamente.');
        // Resetear el formulario
        setSelectedAuction(null);
        setProposalFixtureId('');
        setProposalQuantity(1);
        // Opcional: Actualizar fixtures para reflejar bonos pendientes
        fetchAdminFixtures();
      } else {
        alert('Error al enviar la propuesta.');
      }
    } catch (error) {
      console.error('Error al enviar la propuesta:', error);
      alert('Error al enviar la propuesta.');
    }
  };

  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/'); // Redirige al usuario a la página principal
  };

  const fetchFixtureByAuctionId = async (auctionId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auctions/${auctionId}`);
      return response.data; // Retorna los detalles del fixture
    } catch (error) {
      console.error(`Error fetching fixture for auction ${auctionId}:`, error);
      return null; // Retorna null si hay un error
    }
  };
  
  useEffect(() => {
    const fetchAuctionsAndFixtures = async () => {
      try {
        const roles_token = localStorage.getItem("RolesToken");
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/auctions/others/${user.sub}`,
          {
            headers: {
              Authorization: `Bearer ${roles_token}`,
            },
          }
        );
  
        const auctions = response.data.auctions;
  
        // Obtener los detalles de cada fixture asociado a las subastas
        const auctionsWithFixtures = await Promise.all(
          auctions.map(async (auction) => {
            const fixture = await fetchFixtureByAuctionId(auction.auction_id);
            return { ...auction, fixture }; // Agregar el fixture a cada auction
          })
        );
  
        setOtherAuctions(auctionsWithFixtures);
      } catch (error) {
        console.error('Error al obtener subastas y fixtures:', error);
      }
    };
  
    if (isAuthenticated) {
      fetchAuctionsAndFixtures();
    }
  }, [isAuthenticated]);
  

  return (
    <div className="view-offers-page">
      {isAuthenticated ? (
        isAdmin ? (
          <div>
            <h1>Ofertas de Otros Grupos</h1>
            {otherAuctions.length > 0 ? (
              <div className="offers-grid">
              {otherAuctions.map((auction) => {
                const { fixture } = auction; // Se extrae el fixture anidado en la subasta

                // Verificar si el fixture está disponible
                if (!fixture) {
                  return (
                    <div key={auction.auction_id} className="auction-item">
                      <p>Error: No se pudo cargar el fixture para esta subasta</p>
                    </div>
                  );
                }

                return (
                  <div key={auction.auction_id} className="auction-item">
                    {/* Información de los equipos */}
                    <div className="teams-container">
                      <div className="team-info">
                        <img
                          src={fixture.home_team_logo} // Usar fixture.home_team_logo
                          alt={fixture.home_team_name} // Usar fixture.home_team_name
                          className="team-logo"
                        />
                        <span className="text-colored">{fixture.home_team_name}</span>
                      </div>
                      <span className="vs-text">vs</span>
                      <div className="team-info">
                        <img
                          src={fixture.away_team_logo} // Usar fixture.away_team_logo
                          alt={fixture.away_team_name} // Usar fixture.away_team_name
                          className="team-logo"
                        />
                        <span className="text-colored">{fixture.away_team_name}</span>
                      </div>
                    </div>

                    {/* Información de la subasta */}
                    <p><strong>Grupo:</strong> {auction.group_id}</p>
                    <p><strong>Partido:</strong> {fixture.league_name} - {fixture.league_round}</p>
                    <p><strong>Resultado:</strong> {auction.result}</p>
                    <p><strong>Cantidad:</strong> {auction.quantity}</p>
                    <button onClick={() => handleMakeProposalClick(auction)}>Hacer Propuesta</button>
                  </div>
                );
              })}
            </div>
            ) : (
              <p>No hay ofertas disponibles de otros grupos.</p>
            )}

            {selectedAuction && (
              <div className="modal">
              <div className="modal-content">
                <h2>Hacer Propuesta de Intercambio</h2>
                <p>
                  <strong>Oferta del Grupo {selectedAuction.group_id}:</strong>
                </p>
                <p>Partido: {selectedAuction.league_name} - {selectedAuction.round}</p>
                <p>Resultado: {selectedAuction.result}</p>
                <p>Cantidad: {selectedAuction.quantity}</p>
            
                <h3>Tus Bonos para Ofrecer:</h3>
                <div className="form-group">
                  <label htmlFor="select-fixture">Seleccionar Partido:</label>
                  <select
                    id="select-fixture"
                    value={proposalFixtureId}
                    onChange={(e) => setProposalFixtureId(e.target.value)}
                  >
                    <option value="">Selecciona un partido</option>
                    {adminFixtures.map((fixture) => (
                      <option
                        key={`${fixture.fixture_id}-${fixture.result}`}
                        value={`${fixture.fixture_id}-${fixture.result}`}
                      >
                        {fixture.league_name} - {fixture.league_round} ({fixture.bonos} bonos reservados) - {fixture.result}
                      </option>
                    ))}
                  </select>
                </div>
            
                <div className="form-group">
                  <label htmlFor="offer-quantity">Cantidad a Ofrecer:</label>
                  <input
                    id="offer-quantity"
                    type="number"
                    min="1"
                    max={getFixtureById(proposalFixtureId)?.bonos || 0}
                    value={proposalQuantity}
                    onChange={(e) => setProposalQuantity(parseInt(e.target.value))}
                  />
                </div>
            
                <div className="modal-footer">
                  <button onClick={submitProposal} className="modal-button confirm-button">
                    Enviar Propuesta
                  </button>
                  <button onClick={() => setSelectedAuction(null)} className="modal-button cancel-button">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
            )}

          </div>
        ) : (
          <p>No tienes permisos para ver esta página.</p>
        )
      ) : (
        <p>Debes iniciar sesión para ver esta página.</p>
      )}
      <button onClick={handleBackClick} className="back-button">
        Go Back to Home
      </button>
    </div>
  );
};

export default ViewOffers;
