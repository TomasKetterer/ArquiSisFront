// ConfirmPurchase.jsx
import React from 'react';
import './ConfirmPurchase.css'; // Importamos el CSS específico para esta página
import { useLocation } from 'react-router-dom';

const ConfirmPurchase = () => {
  const location = useLocation();
  const data = location.state;

  if (!data) {
    return <p className="text-colored">No hay datos de compra disponibles.</p>;
  }

  const { fixture, amount, result, url, token, locationInfo, request_id} = data;

  //Set fixture id in local storage
  localStorage.setItem('request_id', request_id);

  return (
    <div className="ConfirmPurchase">
      <div className="confirm-purchase-container">
        <h2>Confirmar Compra</h2>
        <div className="fixture-details">
          <div className="teams">
            <div className="team">
              <img src={fixture.home_team_logo} alt={fixture.home_team_name} />
              <span>{fixture.home_team_name}</span>
            </div>
            <span className="vs">VS</span>
            <div className="team">
              <img src={fixture.away_team_logo} alt={fixture.away_team_name} />
              <span>{fixture.away_team_name}</span>
            </div>
          </div>
          <div className="fixture-info">
            <p>Liga: {fixture.league_name}</p>
            <p>Fecha: {new Date(fixture.date).toLocaleDateString()}</p>
            <p>Hora: {new Date(fixture.date).toLocaleTimeString()}</p>
          </div>
          <div className="purchase-info">
            <p>Cantidad de Bonos: {amount}</p>
            <p>Resultado Apostado: {result}</p>
          </div>
        </div>
        <form action={url} method="POST" className="payment-form">
          <input type="hidden" name="token_ws" value={token} />
          <button type="submit" className="pay-button">Pagar ${1000 * amount}</button>
        </form>
      </div>
    </div>
  );
};

export default ConfirmPurchase;
