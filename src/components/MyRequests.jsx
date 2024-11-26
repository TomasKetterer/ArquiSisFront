// src/components/MyRequests.jsx
import React, { useEffect, useState, useCallback } from 'react';
import './MyRequests.css'; // Archivo CSS para este componente
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { generateInvoice } from '../services/invoiceService';
import useSocket from '../hooks/useSocket'; // Importa el hook personalizado

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filterOption, setFilterOption] = useState('valid'); // Opciones: valid, invalid, pending, all
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  // Obtener el userId del usuario desde Auth0 o desde localStorage
  const userId = localStorage.getItem('userId');

  // Función para obtener las compras del usuario
  const fetchRequests = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();

      const response = await axios.get(`${apiUrl}/requests/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRequests(response.data.requests);
      setFilteredRequests(response.data.requests.filter(req => req.valid === true));
      console.log('Solicitudes obtenidas:', response.data.requests);
    } catch (error) {
      console.error('Error al obtener las solicitudes:', error);
      alert('Hubo un error al obtener tus solicitudes.');
    }
  }, [getAccessTokenSilently, apiUrl, userId]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchRequests();
    }
  }, [isAuthenticated, userId, fetchRequests]);

  // Función para manejar el cambio de filtro
  const handleFilterChange = (event) => {
    const option = event.target.value;
    setFilterOption(option);

    let filtered = [];

    if (option === 'valid') {
      filtered = requests.filter(req => req.valid === true);
    } else if (option === 'invalid') {
      filtered = requests.filter(req => req.valid === false);
    } else if (option === 'pending') {
      filtered = requests.filter(req => req.valid === null);
    } else {
      filtered = requests; // Mostrar todas
    }

    setFilteredRequests(filtered);
    console.log(`Filtrando solicitudes por: ${option}`);
  };

  // Función para manejar la descarga de la boleta
  const handleDownloadInvoice = async (requestId) => {
    try {
      const token = await getAccessTokenSilently();

      // Obtener datos necesarios para generar la boleta
      const response = await axios.get(`${apiUrl}/requestsbyid/${requestId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data.user;
      const matchData = response.data.match;

      // Generar la boleta
      const pdfUrl = await generateInvoice(userData, matchData);
      console.log(`Boleta generada para request_id=${requestId}: ${pdfUrl}`);

      // Descargar la boleta
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error al descargar la boleta:', error);
      alert('Hubo un error al descargar la boleta.');
    }
  };

  // Función para manejar el botón de volver al inicio
  const handleGoBack = () => {
    navigate('/'); // Navega a la página de inicio
  };

  // Función para manejar actualizaciones en tiempo real
  const handleRequestUpdate = useCallback((update) => {
    console.log('Actualización recibida:', update);
    setRequests((prevRequests) =>
      prevRequests.map((req) =>
        req.request_id === update.request_id ? { ...req, ...update } : req
      )
    );
    // Actualizar los filtros si es necesario
    setFilteredRequests((prevFiltered) => {
      let updatedFiltered = [...prevFiltered];
      const index = updatedFiltered.findIndex(req => req.request_id === update.request_id);
      if (index !== -1) {
        updatedFiltered[index] = { ...updatedFiltered[index], ...update };
      } else if (update.valid === true) {
        updatedFiltered.push({ ...update });
      }
      // Filtrar de nuevo basado en el filtro actual
      const finalFiltered = updatedFiltered.filter(req => {
        if (filterOption === 'valid') return req.valid === true;
        if (filterOption === 'invalid') return req.valid === false;
        if (filterOption === 'pending') return req.valid === null;
        return true;
      });
      console.log('Solicitudes filtradas actualizadas:', finalFiltered);
      return finalFiltered;
    });
  }, [filterOption]);

  // Configurar el socket para recibir actualizaciones
  useSocket(userId, handleRequestUpdate);

  return (
    <div className="MyRequests">
      <div className="my-requests">
        <h2>Mis Compras Realizadas</h2>

        <div className="filter-options">
          <label htmlFor="filter">Mostrar:</label>
          <select id="filter" value={filterOption} onChange={handleFilterChange}>
            <option value="valid">Válidas</option>
            <option value="invalid">No Válidas</option>
            <option value="pending">No Completadas</option>
            <option value="all">Todas</option>
          </select>
        </div>

        {filteredRequests.length > 0 ? (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Liga</th>
                <th>Jornada</th>
                <th>Fecha</th>
                <th>Resultado</th>
                <th>Cantidad</th>
                <th>¿Has acertado?</th>
                <th>Odd</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.request_id}>
                  <td>{req.league_name}</td>
                  <td>{req.round}</td>
                  <td>{new Date(req.date).toLocaleDateString()}</td>
                  <td>{req.result}</td>
                  <td>{req.quantity}</td>
                  <td>{req.processed ? 'Sí' : 'No'}</td>
                  <td>{req.odd}</td>
                  <td>
                    {req.valid === true && 'Válida'}
                    {req.valid === false && 'No Válida'}
                    {req.valid === null && 'Pendiente'}
                  </td>
                  <td>
                    {req.valid === true && (
                      <button
                        className="invoice-button"
                        onClick={() => handleDownloadInvoice(req.request_id)}
                      >
                        Descargar Boleta
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No se encontraron solicitudes para mostrar.</p>
        )}

        {/* Botón para regresar a la página principal */}
        <button onClick={handleGoBack} className="back-button">Volver al inicio</button>
      </div>
    </div>
  );
};

export default MyRequests;
