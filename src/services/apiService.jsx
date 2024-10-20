// src/services/apiService.jsx
import axios from 'axios';

/**
 * Elimina fixtures duplicados basados en fixture_id.
 * @param {Array} fixtures - Lista de fixtures.
 * @returns {Array} Lista de fixtures únicos.
 */

export const removeDuplicateFixtures = (fixtures) => {
    const uniqueFixtures = [];
    const fixtureIds = new Set();

    for (const fixture of fixtures) {
        if (!fixtureIds.has(fixture.fixture_id)) {
            fixtureIds.add(fixture.fixture_id);
            uniqueFixtures.push(fixture);
        }
    }

    return uniqueFixtures;
};

/**
 * Obtiene el balance de la wallet del usuario.
 * @param {string} userId - ID del usuario.
 * @param {Function} getAccessTokenSilently - Función para obtener el token de acceso.
 * @returns {Promise<number>} Balance de la wallet.
 */

export const fetchUser = async (userId, getAccessTokenSilently) => {
    try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(`https://api.nodecraft.me/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.wallet;
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        throw error;
    }
};

/**
 * Obtiene la lista de fixtures.
 * @param {Function} getAccessTokenSilently - Función para obtener el token de acceso.
 * @returns {Promise<Array>} Lista de fixtures únicos.
 */
export const fetchFixtures = async (getAccessTokenSilently) => {
    try {
        const token = await getAccessTokenSilently();
        const response = await axios.get('https://api.nodecraft.me/fixtures', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const uniqueFixtures = removeDuplicateFixtures(response.data.data);
        return uniqueFixtures;
    } catch (error) {
        console.error('Error fetching fixtures:', error);
        throw error;
    }
};

/**
 * Genera un ID de usuario único.
 * @returns {string} ID único.
 */
const generateLongUserId = () => {
    const timestamp = Date.now();
    const highPrecision = Math.floor(performance.now() * 1000000);
    const randomPart = Math.floor(Math.random() * 1000000000);
    return `${timestamp}-${highPrecision}-${randomPart}`;
};

/**
 * Registra un nuevo usuario.
 * @param {Object} user - Objeto de usuario de Auth0.
 * @param {Function} getAccessTokenSilently - Función para obtener el token de acceso.
 * @returns {Promise<void>}
 */
export const signUpUser = async (user, getAccessTokenSilently) => {
    try {
        const token = await getAccessTokenSilently();
        const newUserId = generateLongUserId();

        const response = await axios.post('https://api.nodecraft.me/users', {
            id: newUserId,
            username: user.nickname,
            email: user.email,
            password: 'Nohaypassword',
            wallet: 0.0,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
        );
        if (response.status === 201) {
            localStorage.setItem('userId', newUserId);
            if (localStorage.getItem('authAction') === 'signup') {
                localStorage.removeItem('authAction');
                return newUserId;
            }
        } else {
            console.log('User must be already registered');
            // get the user id from the email
            const response = await axios.get(`https://api.nodecraft.me/users`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const users = response.data.users;
            const existingUser = users.find(u => u.email === user.email);
            if (existingUser) {
                localStorage.setItem('userId', existingUser.id);
                if (localStorage.getItem('authAction') === 'signup') {
                    localStorage.removeItem('authAction');
                    return existingUser.id;
                }
            } else {
                throw new Error('No user found with this email.');
            }
        }
        // await fetchUser(newUserId, getAccessTokenSilently);
        // await fetchFixtures(getAccessTokenSilently);
        // esto se hace al llamar a signUpUser en el componente
    } catch (error) {
        console.error('Error signing up user:', error);
        throw error;
    }
};

/**
 * Inicia sesión al usuario existente.
 * @param {Object} user - Objeto de usuario de Auth0.
 * @param {Function} getAccessTokenSilently - Función para obtener el token de acceso.
 * @param {Function} fetchUser - Función para obtener el balance de la wallet.
 * @returns {Promise<void>}
 */

export const logInUser = async (email, getAccessTokenSilently, fetchUser) => {
    try {
        // debo obtener el id del usuario a partir del email
        let userId = localStorage.getItem('userId');
        if (!userId) {
            const token = await getAccessTokenSilently();
            const response = await axios.get(`https://api.nodecraft.me/users`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const users = response.data.users;
            const existingUser = users.find(user => user.email === email);
            if (existingUser) {
                userId = existingUser.id;
                localStorage.setItem('userId', userId);
                if (localStorage.getItem('authAction') === 'login') {
                    localStorage.removeItem('authAction');
                    const wallet = await fetchUser(userId, getAccessTokenSilently);
                    return wallet;
                }
            } else {
                throw new Error('No user found with this email.');
            }
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        throw error;
    }
};

/**
 * Añade dinero a la wallet del usuario.
 * @param {number} amount - Cantidad a añadir.
 * @param {Function} getAccessTokenSilently - Función para obtener el token de acceso.
 * @returns {Promise<number>} Nuevo balance de la wallet.
 */

export const addMoneyToWallet = async (amount, getAccessTokenSilently) => {
    try { 
        const userId = localStorage.getItem('userId');
        const token = await getAccessTokenSilently();
        const response = await axios.patch(
            `https://api.nodecraft.me/users/${userId}/wallet`,
            { amount: amount },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data.wallet;
    } catch (error) {
        console.error('Error adding money to wallet:', error);
        throw error;
    }
};

/**
 * Obtiene los bonuses del usuario.
 * @param {string} userId - ID del usuario.
 * @param {Function} getAccessTokenSilently - Función para obtener el token de acceso.
 * @returns {Promise<Array>} Lista de bonuses.
 */

export const viewMyBonuses = async (userId, getAccessTokenSilently) => {
    try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(`https://api.nodecraft.me/requests/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.data && response.data.bonuses) {
            return response.data.bonuses;
        } else {
            throw new Error('No bonuses found for this user.');
        }
    } catch (error) {
        console.error('Error viewing bonuses:', error);
        throw error;
    }
};