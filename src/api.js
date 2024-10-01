// src/api.js
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';

const useApi = (endpoint) => {
  const { getAccessTokenSilently } = useAuth0();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const callApi = async () => {
      try {
        // Especifica el audience al obtener el token
        const token = await getAccessTokenSilently({
          audience: 'https://api.nodecraft.me',
        });

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error en la respuesta de la API');
        }

        const responseData = await response.json();
        setData(responseData);
      } catch (error) {
        console.error('Error al llamar a la API:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    callApi();
  }, [getAccessTokenSilently, endpoint]);

  return { data, loading, error };
};

export default useApi;
