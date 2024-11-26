// PurchaseCompleted.jsx
import React, { useEffect, useState, useRef } from 'react';
import './PurchaseCompleted.css'; // Puedes crear un CSS específico para esta página
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generateInvoice } from '../services/invoiceService';

const PurchaseCompleted = () => {
  const [statusMessage, setStatusMessage] = useState('Validando tu compra...');
  const [isSuccess, setIsSuccess] = useState(null);
  const [isAborted, setIsAborted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasConfirmed = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmTransaction = async () => {
      if (hasConfirmed.current) return;
      hasConfirmed.current = true;

      const queryParams = new URLSearchParams(location.search);
      const token_ws = queryParams.get('token_ws');

      if (!token_ws) {
        setStatusMessage('Compra anulada.');
        setIsAborted(true);
        setIsSuccess(false);
        setIsLoading(false);
        return;
      }

      // Elimina el token de la URL después de obtenerlo
      window.history.replaceState({}, document.title, location.pathname);

      try {
        const apiUrl = process.env.REACT_APP_API_URL;

        if (isLoading) {
          console.log('');
        }
        // get request_id from local storage
        const request_id = localStorage.getItem('request_id');
        const isReserving = localStorage.getItem('isReserving');
        localStorage.removeItem('request_id');
        localStorage.removeItem('isReserving');
        console.log('request_id:', request_id);

        const sendEmail = localStorage.getItem('sendEmailOnSuccess');
        localStorage.removeItem('sendEmailOnSuccess');

        // data to send to the server
        const data = {
          token_ws,
          request_id,
          sendEmail,
          isReserving
        };

        const response = await axios.post(`${apiUrl}/transactions/commit`, data);

        if (response.data.status === 'AUTHORIZED') {
          setStatusMessage('¡Compra realizada con éxito!');
          setIsSuccess(true);

          // Datos para la boleta desde la respuesta del backend
          const userData = response.data.user;
          const matchData = response.data.match;

          console.log('userData:', userData);
          console.log('matchData:', matchData);

          try {
            const pdfUrl = await generateInvoice(userData, matchData);
            alert(`Compra exitosa. Descarga tu boleta aquí: ${pdfUrl}.`);
          } catch (error) {
            console.error('Error generando la boleta:', error);
            alert('Error generando la boleta.');
          }
        } else {
          setStatusMessage('La compra no pudo ser completada.');
          setIsSuccess(false);
        }
      } catch (error) {
        console.error('Error al confirmar la transacción:', error);
        if (error.response && error.response.data && error.response.data.error) {
          setStatusMessage(`Error: ${error.response.data.error}`);
        } else {
          setStatusMessage('Pago rechazado, la compra no pudo completarse.');
        }
        setIsSuccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    confirmTransaction();
  }, [location, isLoading]);

  const handleGoBack = () => {
    navigate('/'); // Navega a la página de inicio
  };

  return (
    <div className="PurchaseCompleted">
      <div className="purchase-completed-container">
        <h2>{statusMessage}</h2>
        {isSuccess === null && <p>Por favor, espera...</p>}
        {isSuccess && <p>Gracias por tu compra. ¡Disfruta de tus bonos!</p>}
        {(isSuccess === false)&&(isAborted === false) && (
          <p>
            Hubo un problema con tu compra. Por favor, intenta de nuevo o contacta al soporte.
          </p>
        )}
        {isAborted && <p>Decidiste anular tu compra, ¡Quizás te convezca otro partido!</p>}
        <button onClick={handleGoBack} className="go-back-button"> Volver al inicio</button>
      </div>
    </div>
  );
};

export default PurchaseCompleted;
