
const cds = require('@sap/cds');
const constants = require("../utils/constants");
const { getClient, getCase } = require("../utils/caseService");
const { updatePartesImplicadas } = require("../utils/procesarPartesImplicadas");

/**
 * SalesArea_PartiesDeterAction
 * ---------------------------------------------------------
 * Acción de PREHOOK para determinar el área de ventas y actualizar partes implicadas.
 * Lógica:
 *  - CREACIÓN DE CASO:
 *      Si no hay imagen anterior (beforeImage) y el nombre de la cuenta no es DUMMY,
 *      se ejecuta la determinación de área de ventas.
 *  - EDICIÓN:
 *      Si cambia la cuenta y no incluye DUMMY, recalculamos área de ventas.
 *      Si cambia la organización de ventas, actualizamos partes implicadas.
 *
 * @param {Object} currentImage - Imagen actual del caso.
 * @param {Object|null} beforeImage - Imagen anterior del caso (puede ser null).
 * @returns {Object} dataModify - Objeto con modificaciones acumuladas.
 */
async function SalesArea_PartiesDeterAction(currentImage, beforeImage) {
  let dataModify = {};
  cds.prehook = true;
  try {
    // Verificamos si es creación (beforeImage vacío)
    const isBeforeEmpty = beforeImage == null || Object.keys(beforeImage).length === 0;
    const accountNameCurrent = currentImage?.account?.name || "";

    // CREACIÓN DE CASO
    if (isBeforeEmpty && (accountNameCurrent === "" || !accountNameCurrent.includes(constants.DUMMY))) {
      console.log("Ejecutando SalesAreaDetermination (Creación de caso)");
      const accountResponse = await getClient(currentImage);
      const oDataAccount = accountResponse?.data?.value;
      await determinateSalesArea(currentImage, oDataAccount, dataModify);

    } else if (!isBeforeEmpty) {
      // EDICIÓN DE CASO
      const accountResponse = await getClient(currentImage);
      const oDataAccount = accountResponse?.data?.value;

      // Si cambia la cuenta y no incluye DUMMY, recalculamos área de ventas
      if ((currentImage.account.displayId !== beforeImage.account.displayId) && !accountNameCurrent.includes(constants.DUMMY)) {
        console.log("Ejecutando SalesAreaDetermination (Editar caso)");
        await determinateSalesArea(currentImage, oDataAccount, dataModify);
      }

      // Si cambia la organización de ventas, actualizamos partes implicadas
      const salesAreaBefore = beforeImage?.extensions?.ZOrganizacion_de_ventas || "";
      const salesAreaCurrent = currentImage?.extensions?.ZOrganizacion_de_ventas || "";
      if (salesAreaBefore !== salesAreaCurrent) {
        console.log("Ejecutando PartiesRedetAction");
        await updatePartesImplicadas(null, currentImage, oDataAccount, dataModify);
      }
    }
    return dataModify;

  } catch (error) {
    console.error("Error en SalesArea_PartiesDeterAction:", error);
  }
}

/**
 * PartiesDeterAction
 * ---------------------------------------------------------
 * Acción de Flujo para actualizar partes implicadas cuando cambia la organización de ventas.
 * Lógica:
 *  - Si existe imagen anterior y la organización de ventas cambió,
 *    recuperamos el caso y el cliente, y actualizamos partes implicadas.
 *
 * @param {Object} currentImage - Imagen actual del caso.
 * @param {Object|null} beforeImage - Imagen anterior del caso.
 * @returns {Object} dataModify - Objeto con modificaciones acumuladas.
 */
async function PartiesDeterAction(currentImage, beforeImage) {
  let dataModify = {};
  try {
    const isBeforeEmpty = beforeImage == null || Object.keys(beforeImage).length === 0;

    if (!isBeforeEmpty) {
      const salesAreaBefore = beforeImage?.extensions?.ZOrganizacion_de_ventas || "";
      const salesAreaCurrent = currentImage?.extensions?.ZOrganizacion_de_ventas || "";

      if (salesAreaBefore !== salesAreaCurrent) {
        try {
          const caseResponse = await getCase(currentImage.id);
          cds.headersReq = {};
          cds.headersReq.eTag = caseResponse.headers.etag;
        } catch (error) {
          console.warn("Error recuperando eTag:", error.message);
        }

        // Recuperar cliente y actualizar partes implicadas
        const accountResponse = await getClient(currentImage);
        const oDataAccount = accountResponse?.data?.value;
        await updatePartesImplicadas(null, currentImage, oDataAccount, dataModify);
      }
    }
    return dataModify;

  } catch (error) {
    console.error("Error en PartiesDeterAction:", error);
  }
}

/**
 * determinateSalesArea
 * ---------------------------------------------------------
 * Determina la organización de ventas para el caso.
 * Lógica:
 *  - Si no hay cliente, asigna valor por defecto.
 *  - Si hay un único acuerdo de ventas, asigna esa organización.
 *  - Si hay más de uno, asigna la organización por defecto (9999).
 *
 * @param {Object} caseRequest - Caso actual.
 * @param {Object|null} oDataAccount - Datos del cliente.
 * @param {Object} dataModify - Objeto para acumular modificaciones.
 */
async function determinateSalesArea(caseRequest, oDataAccount, dataModify) {
  try {
    caseRequest.extensions ??= {};

    if (!oDataAccount) {
      console.warn("Cliente no encontrado, asignando valor por defecto");
      caseRequest.extensions.ZOrganizacion_de_ventas = constants.zorganizacionVentas;
      return;
    }

    const salesArrangements = caseRequest.salesArrangements || oDataAccount.salesArrangements || [];
    const currentOrg = caseRequest?.extensions?.ZOrganizacion_de_ventas || "";

    // Lógica para asignar organización
    if (salesArrangements.length === 1) {
      caseRequest.extensions.ZOrganizacion_de_ventas = salesArrangements[0].salesOrganizationDisplayId;
    } else {
      caseRequest.extensions.ZOrganizacion_de_ventas = constants.zorganizacionVentas;
    }

  } catch (error) {
    console.error("Error en determinateSalesArea:", error.message);
    throw new Error("Error al determinar área de ventas");
  }
}

module.exports = { SalesArea_PartiesDeterAction, PartiesDeterAction };
