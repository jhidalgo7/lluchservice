const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const cds = require("@sap/cds");

async function c4cPatch(path, data) {
  try {
    console.warn(`Se realiza petición a SALES CLOUD ${cds.headersReq.eTag}`);
    const response = await executeHttpRequest(
      { destinationName: 'destino_c4c' },
      {
        method: "PATCH",
        url: path,
        headers: {
          "If-Match": cds.headersReq.eTag,
          "Content-Type": "application/json"
        },
        data
      }
    );
    return response;
  } catch (error) {
    console.error(JSON.stringify(error))
    console.error(`Error en PATCH ${path}:`, error.message);
    throw new Error(`Error al actualizar datos en C4C: ${error.message}`);
  }
}

module.exports = c4cPatch;
