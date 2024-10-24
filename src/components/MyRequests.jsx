// MyRequests.jsx
import React, { useEffect, useState } from 'react';
import './MyRequests.css'; // Archivo CSS para este componente
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { generateInvoice } from '../services/invoiceService';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filterOption, setFilterOption] = useState('valid'); // Opciones: valid, invalid, pending, all
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const userId = localStorage.getItem('userId');

        if (!userId) {
          alert('Usuario no autenticado.');
          return;
        }

        const token = await getAccessTokenSilently();

        const response = await axios.get(`${apiUrl}/requests/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRequests(response.data.requests);
        setFilteredRequests(response.data.requests.filter(req => req.valid === true));
      } catch (error) {
        console.error('Error al obtener las solicitudes:', error);
        alert('Hubo un error al obtener tus solicitudes.');
      }
    };

    fetchRequests();
  }, [getAccessTokenSilently]);

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
  };

  // Función para manejar la descarga de la boleta
  const handleDownloadInvoice = async (requestId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = await getAccessTokenSilently();

      // Obtener datos necesarios para generar la boleta
      const response = await axios.get(`${apiUrl}/requests/${requestId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data.user;
      const matchData = response.data.match;

      // Generar la boleta
      const pdfUrl = await generateInvoice(userData, matchData);

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
                <th>Procesado</th>
                <th>Odd</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req, index) => (
                <tr key={index}>
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
                      onClick={() => handleDownloadInvoice(req.id)}
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
