const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

async function c4cPatch(path, data, etag) {
  try {
    const response = await executeHttpRequest(
      { destinationName: 'destino_c4c' },
      {
        method: "PATCH",
        url: path,
        headers: {
          "If-Match": etag,
          "Content-Type": "application/json"
        },
        data
      }
    );
    return response;
  } catch (error) {
    console.error(`Error en PATCH ${path}:`, error.message);
    throw new Error(`Error al actualizar datos en C4C: ${error.message}`);
  }
}

module.exports = c4cPatch;
