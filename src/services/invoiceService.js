import axios from 'axios';

export const generateInvoice = async (userData, matchData) => {
  try {
    console.log(userData)
    console.log(matchData)

    // const response = await axios.post('https://axp8mrrbk1.execute-api.us-east-1.amazonaws.com/generate', {
    const response = await axios.post('https://cy9d01jjhi.execute-api.us-east-1.amazonaws.com/generate', {
      userData: {
        name: userData.name,
        email: userData.email
      },
      matchData: {
        teams: {
          home: {
            id: matchData.teams.home.id,
            name: matchData.teams.home.name,
            logo: matchData.teams.home.logo,
            winner: matchData.teams.home.winner
          },
          away: {
            id: matchData.teams.away.id,
            name: matchData.teams.away.name,
            logo: matchData.teams.away.logo,
            winner: matchData.teams.away.winner
          }
        },
        date: matchData.date,
        amount: matchData.amount
      }
    });

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
