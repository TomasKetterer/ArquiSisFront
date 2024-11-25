import React, { useEffect, useState } from 'react';
import './ViewOffers.css';
import '../App.css'
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  removeDuplicateFixtures,
} from '../services/apiService.jsx';

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
      const token = await getAccessTokenSilently();
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
      setAdminFixtures(uniqueFixtures);
    } catch (error) {
      console.error('Error al obtener fixtures reservadas del administrador:', error);
    }
  };

  // Función para manejar el clic en "Hacer Propuesta"
  const handleMakeProposalClick = (auction) => {
    setSelectedAuction(auction);
    fetchAdminFixtures(); // Obtener fixtures con bonos reservados
  };

  // Función para obtener una fixture por su ID
  const getFixtureById = (fixtureId) => {
    return adminFixtures.find((fixture) => fixture.fixture_id === parseInt(fixtureId));
  };

  // Función para enviar la propuesta
  const submitProposal = async () => {
    if (!proposalFixtureId || proposalQuantity <= 0) {
      alert('Por favor, selecciona un partido y una cantidad válida.');
      return;
    }

    const fixture = getFixtureById(proposalFixtureId);

    // console.log(proposalFixtureId)
    // console.log(proposalQuantity)
    // console.log(fixture.bonos_reservados)

    if (!fixture) {
      alert('Fixture seleccionada no encontrada.');
      return;
    }

    if (proposalQuantity > fixture.bonos_reservados) {
      alert(`No tienes suficientes bonos reservados para este partido. Disponibles: ${fixture.bonos_reservados}`);
      return;
    }

    try {
      const token = await getAccessTokenSilently();

      console.log(selectedAuction);
      console.log(fixture);

      console.log("auction_id:", selectedAuction.auction_id)
      console.log("fixture_id:", fixture.fixture_id)
      console.log("league_name:", fixture.league_name)
      console.log("round:", fixture.league_round)
      console.log("result:", fixture.result)
      console.log("quantity:", proposalQuantity)

      const response = await axios.post(`${apiUrl}/proposals/${user.sub}`, {
        auction_id: selectedAuction.auction_id,
        fixture_id: fixture.fixture_id,
        league_name: fixture.league_name,
        round: fixture.league_round,
        result: fixture.result,
        quantity: proposalQuantity
      }, {
        headers: {
          Authorization: `Bearer ${roles_token}`
        }
      });

      if (response.data.success) {
        alert('Propuesta enviada exitosamente.');
        // Resetear el formulario
        setSelectedAuction(null);
        setProposalFixtureId('');
        setProposalQuantity(1);
        // Opcional: Actualizar fixtures para reflejar bonos pendientes
        // fetchAdminFixtures();
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

  return (
    <div className="view-offers-page">
        {isAuthenticated ? (
            isAdmin ? (
            <div>
                <h1>Ofertas de Otros Grupos</h1>
                {otherAuctions.length > 0 ? (
                <div className="offers-grid">
                    {otherAuctions.map((auction) => (
                    <div key={auction.auction_id} className="auction-item">
                        <p><strong>Grupo:</strong> {auction.group_id}</p>
                        <p><strong>Partido:</strong> {auction.league_name} - {auction.round}</p>
                        <p><strong>Resultado:</strong> {auction.result}</p>
                        <p><strong>Cantidad:</strong> {auction.quantity}</p>
                        <button onClick={() => handleMakeProposalClick(auction)}>Hacer Propuesta</button>
                    </div>
                    ))}
                </div>
                ) : (
                <p>No hay ofertas disponibles de otros grupos.</p>
                )}

                {selectedAuction && (
                <div className="modal">
                    <div className="modal-content">
                    <h2>Hacer Propuesta de Intercambio</h2>
                    <p><strong>Oferta del Grupo {selectedAuction.group_id}:</strong></p>
                    <p>Partido: {selectedAuction.league_name} - {selectedAuction.round}</p>
                    <p>Resultado: {selectedAuction.result}</p>
                    <p>Cantidad: {selectedAuction.quantity}</p>

                    <h3>Tus Bonos para Ofrecer:</h3>
                    <label>
                        Seleccionar Partido:
                        <select value={proposalFixtureId} onChange={(e) => setProposalFixtureId(e.target.value)}>
                        <option value="">Selecciona un partido</option>
                        {adminFixtures.map((fixture) => (
                            <option key={fixture.fixture_id} value={fixture.fixture_id}>
                            {fixture.league_name} - {fixture.league_round} ({fixture.bonos_reservados} bonos reservados)
                            </option>
                        ))}
                        </select>
                    </label>
                    <br />
                    <label>
                        Cantidad a Ofrecer:
                        <input
                        type="number"
                        min="1"
                        max={getFixtureById(proposalFixtureId)?.bonos_reservados || 0}
                        value={proposalQuantity}
                        onChange={(e) => setProposalQuantity(parseInt(e.target.value))}
                        />
                    </label>
                    <br />
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
