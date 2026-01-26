
const cds = require('@sap/cds');
const constants = require("../utils/constants");
const { validateAccountOnRoleChange } = require("../utils/validationsClients");
/**
 * Validaciones al crear clientes
 *
 * @param {Object} currentImage - Imagen actual del caso.
 * @param {Object|null} beforeImage - Imagen anterior del caso (puede ser null).
 * @returns {Object} dataModify - Objeto con modificaciones acumuladas.
 */
async function validation_NewClient(currentImage, beforeImage, language) {
  let dataModify = {};

  try {
    let nextRole = currentImage.customerRole,
      previousRole = beforeImage.customerRole;
    dataModify = validateAccountOnRoleChange(currentImage, previousRole, nextRole, cds.language, { requireAllSalesArrangements: true });

    return dataModify;

  } catch (error) {
    console.error("Error en Validations New Client:", error);
  }
}


module.exports = { validation_NewClient };
