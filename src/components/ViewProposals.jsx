import React from "react";
import { useNavigate } from 'react-router-dom';

const ViewProposals = () => {
    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate('/'); // Redirige al usuario a la página principal
    };
    
    return (
    <div className="App">
      <header className="App-header">
        <h1>Proposals Sent</h1>
        <p>Here you can manage all the proposals you have sent for fixtures.</p>
        <div className="fixtures-grid">
          {/* Ejemplo de contenido dinámico para propuestas */}
          <div className="fixture-item">
            <div className="league-info">
              <p>La Liga</p>
            </div>
            <div className="teams-container">
              <div className="team-info">
                <span className="text-colored">Team C</span>
              </div>
              <span className="vs-text">vs</span>
              <div className="team-info">
                <span className="text-colored">Team D</span>
              </div>
            </div>
            <div className="fixture-date">
              <p>01/12/2024 - 16:00</p>
            </div>
            <button className="buy-button">Withdraw Proposal</button>
          </div>
        </div>
        <button onClick={handleBackClick} className="back-button">
          Go Back to Home
        </button>
      </header>
    </div>
  );
};

export default ViewProposals;
