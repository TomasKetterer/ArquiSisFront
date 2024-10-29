import axios from 'axios';

async function postRecomendations(id) {
    const body = {
        id: id
    };
    const response = await axios.post(`https://nodecraft.me/recommendations/`, body);
    return response.data;
}

async function getRecomendations(id) {
    const response = await axios.get(`https://nodecraft.me/recommendations/${id}`);
    return response.data;
}

async function Recommendations(data) {
    const fixtures = data.result;
    const requests = fixtures.map(async (fixture) => {
        const response = await axios.get(`https://nodecraft.me/fixtures/${fixture}`);
        // Do something with the response
        return response.data; // Return the response data if needed
    });

    const responses = await Promise.all(requests);
    return responses;
}

//async function getHistory(id) {
//    const response = await axios.get(`https://nodecraft.me/recommendations/${id}/history`);
//    const filteredData = response.data.filter(item => item.response != {});
//    return filteredData;
//}

async function madeRecommendations(id) {
    const job = await postRecomendations(id);
    const data = await getRecomendations(id);
    const result = await Recommendations(data);
    return result;
}

export {
    madeRecommendations
};