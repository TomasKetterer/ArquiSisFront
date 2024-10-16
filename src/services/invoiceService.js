import axios from 'axios';

export const generateInvoice = async (userId) => {
  try {
    const response = await axios.post('https://axp8mrrbk1.execute-api.us-east-1.amazonaws.com/generate', {
      userId: userId,
      teams: ['Team A', 'Team B']  // Aquí puedes pasar los equipos del partido
    });

    // Si la boleta se genera correctamente, devuelve la URL del PDF
    if (response.data && response.data.pdfUrl) {
      return response.data.pdfUrl;
    } else {
      throw new Error('Error generando la boleta');
    }
  } catch (error) {
    console.error('Error generando la boleta:', error);
    throw error;
  }
};
