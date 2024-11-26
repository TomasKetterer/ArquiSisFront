import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './ViewProposals.css'; 
import '../App.css';
import { useNavigate } from 'react-router-dom';

const ViewProposals = () => {
  const { isAuthenticated, user } = useAuth0();
  const [receivedProposals, setReceivedProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = process.env.REACT_APP_API_URL;
  const roles_token = localStorage.getItem("RolesToken");


  // Verificar si el usuario es Admin
  useEffect(() => {
    const roles = localStorage.getItem('role');
    if (roles && roles.includes('Admin')) {
      setIsAdmin(true);
    }
  }, []);

  // Función para obtener las propuestas recibidas
  // eslint-disable-next-line
  const fetchReceivedProposals = async () => {
    try {
      const response = await axios.get(`${apiUrl}/proposals/received/${user.sub}`, {
        headers: {
          Authorization: `Bearer ${roles_token}`
        }
      });

      setReceivedProposals(response.data.proposals);
    } catch (error) {
      console.error('Error al obtener propuestas recibidas:', error);
      alert('Hubo un error al cargar las propuestas recibidas.');
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect para cargar las propuestas al montar el componente
  // eslint-disable-next-line
  useEffect(() => {
    if (isAdmin && isAuthenticated) {
      fetchReceivedProposals();
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line
  }, [isAdmin, isAuthenticated]);

  // Función para manejar la selección de una propuesta
  const handleSelectProposal = (proposal) => {
    setSelectedProposal(proposal);
  };

  // Función para manejar la aceptación o rechazo de una propuesta
  const handleRespondProposal = async (type) => {
    if (!selectedProposal) return;

    const { auction_id, proposal_id, fixture_id, league_name, round, result, group_id, quantity } = selectedProposal;

    const responseMessage = {
      auction_id: auction_id,
      proposal_id: proposal_id,
      fixture_id: fixture_id,
      league_name: league_name,
      round: round,
      result: result,
      quantity: quantity,
      group_id: group_id,
      type: type // "acceptance" o "rejection"
    };

    try {
      // Publicar la respuesta a través del endpoint /mqtt/publish-response
      const response = await axios.post(`${apiUrl}/proposals/${proposal_id}/respond/${user.sub}`, responseMessage, {
        headers: {
          Authorization: `Bearer ${roles_token}`
        }
      });

      if (response.status === 200) {
        alert(`Propuesta ${type === 'acceptance' ? 'aceptada' : 'rechazada'} exitosamente.`);
        // Actualizar la lista de propuestas
        fetchReceivedProposals();
        // Resetear la selección
        setSelectedProposal(null);
      } else {
        alert('Error al responder la propuesta.');
      }
    } catch (error) {
      console.error(`Error al responder la propuesta (${type}):`, error);
      alert(`Error al ${type === 'acceptance' ? 'aceptar' : 'rechazar'} la propuesta.`);
    }
  };

  const navigate = useNavigate();

  const handleBackClick = () => {
      navigate('/'); // Redirige al usuario a la página principal
  };
    
  return (
    <div className="manage-proposals-page">
      {isAuthenticated ? (
        isAdmin ? (
          <div>
            <h1>Propuestas Recibidas</h1>
            {isLoading ? (
              <p>Cargando propuestas...</p>
            ) : receivedProposals.length > 0 ? (
              <div className="proposals-grid">
                {receivedProposals.map((proposal) => (
                  <div key={proposal.proposal_id} className="proposal-item">
                    <p><strong>Grupo que Propone:</strong> {proposal.group_id}</p>
                    <p><strong>Partido:</strong> {proposal.league_name} - {proposal.round}</p>
                    <p><strong>Resultado:</strong> {proposal.result}</p>
                    <p><strong>Cantidad:</strong> {proposal.quantity}</p>
                    <button onClick={() => handleSelectProposal(proposal)}>Responder</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-proposals-message">No tienes propuestas recibidas.</p>
            )}
  
            {selectedProposal && (
              <div className="response-form">
                <h2>Responder Propuesta</h2>
                <p><strong>Grupo que Propone:</strong> {selectedProposal.group_id}</p>
                <p><strong>Partido:</strong> {selectedProposal.league_name} - {selectedProposal.round}</p>
                <p><strong>Resultado:</strong> {selectedProposal.result}</p>
                <p><strong>Cantidad:</strong> {selectedProposal.quantity}</p>
  
                <h3>¿Qué quieres hacer?</h3>
                <button onClick={() => handleRespondProposal('acceptance')}>Aceptar</button>
                <button onClick={() => handleRespondProposal('rejection')}>Rechazar</button>
              </div>
            )}
          </div>
        ) : (
          <p className="access-message">No tienes permisos para ver esta página.</p>
        )
      ) : (
        <p className="access-message">Debes iniciar sesión para ver esta página.</p>
      )}
      <button onClick={handleBackClick} className="back-button">
        Go Back to Home
      </button>
    </div>
  );
};

export default ViewProposals;
