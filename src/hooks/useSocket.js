import {useEffect} from 'react';
import {io} from 'socket.io-client'

const useSocket = (userId, onRequestUpdate) => {
    useEffect(() => {
      if (!userId) return;

        const socket = io('http://localhost:4000', { // Reemplaza con la URL de tu backend debugging
            query: { userId },
        });

        // const socket = io('https://api.nodecraft.me', {
        //     query: { token },
        // });

        socket.on('connect', () => {
            console.log('Conectado al servidor de WebSocket');
        });
      
        socket.on('requestUpdate', (update) => {
            console.log('Actualización de request recibida:', update);
            onRequestUpdate(update);
        });
      
        socket.on('disconnect', () => {
            console.log('Desconectado del servidor de WebSocket');
        });
      
        socket.on('connect_error', (err) => {
            console.error('Error de conexión de WebSocket:', err);
        });
      
        return () => {
            console.log('Desconectando del servidor de WebSocket');
            socket.disconnect();
        };
    }, [userId, onRequestUpdate]);
};
      
export default useSocket;      