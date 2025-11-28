const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

async function c4cGet(path) {
  try {
    const response = await executeHttpRequest(
      { destinationName: 'destino_c4c' },
      {
        method: "GET",
        headers: {
          'x-csrf-token': 'Fetch',
          'x-sap-crm-token': 'fetch'
        },
        url: path
      }
    );
    return response;
  } catch (error) {
    console.error(`Error en GET ${path}:`, error.message);
    throw new Error(`Error al recuperar datos desde C4C: ${error.message}`);
  }
}

module.exports = c4cGet;
