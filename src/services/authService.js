import axios from 'axios';

const getRolesToken = async () => {
    try {
        const response = await axios.post(
            `https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`,
            {
                client_id: "5f6GTjnQ92ioZewKZkjCCkw0Lexp5q9N",
                client_secret: "F0sxKHhuCx0bbI4VsanVu93CJBFq3cnXrishUTlKuRyr9iCE82fdZ02-HfWc1Pm3",
                audience: "https://dev-lrsnvgepbp6l4a8d.us.auth0.com/api/v2/",
                grant_type: "client_credentials"
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )
        return response.data.access_token;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export default getRolesToken;