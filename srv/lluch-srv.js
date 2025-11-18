const cds = require("@sap/cds");
const { getCase, getClient, determinateSalesArea } = require('./utils/caseService');
const constants = require("./utils/constants");
const { procesarPartesImplicadas } = require("./utils/procesarPartesImplicadas");

module.exports = cds.service.impl(async function (srv) {

  //=====DETERMINACIÓN DE AREA DE VENTAS======
  this.on("SalesAreaDeterAction", async (req) => {
    const { id } = req.data;
    cds.headersReq = req.headers;
    let caseResponse, accountResponse, oDataCase, result;
    const pathCases = `${constants.pathC4C.cases}${id ? `/${id}` : ""}`;

    //=================================================================
    //=========================== CASOS ===============================
    //=================================================================
    try {
      caseResponse = await getCase(id, req);
      cds.headersReq.eTag = caseResponse.headers.etag
      cds.headersReq.csrfToken = caseResponse.headers['x-csrf-token'];
      //comprobamos si existe el caso
      oDataCase = caseResponse?.data?.value;
      if (!oDataCase) {
        console.warn("Caso no encontrado o sin datos");
        return req.error(404, "Caso no encontrado en SAP SERVICES CLOUD V2");
      }
    } catch (oError) {
      console.error("Error al recuperar caso:", oError.message);
      return req.error(500, "Error al recuperar casos desde SAP SERVICES CLOUD V2");
    }

    //=================================================================
    //========================== CLIENTE ==============================
    //=================================================================
    try {
      accountResponse = await getClient(oDataCase, req);
    } catch (oError) {
      console.error("Error al recuperar cliente:", oError.message);
      return req.error(500, "Error al recuperar cliente desde SAP SERVICES CLOUD V2");
    }

    //=================================================================
    //================ Determinación Area Ventas ======================
    //=================================================================
    try {
      result = await determinateSalesArea(accountResponse, oDataCase, pathCases);
    } catch (oError) {
      console.error("Error al determinar area de ventas:", oError.message);
      return req.error(500, "Error al determinar area de ventas desde SAP SERVICES CLOUD V2");
    }

    //TO-DO: Si no tiene partes implicadas, llamamos al segundo Enpoint para determinarlas.
    //=================================================================
    //===================== Partes implicadas =========================
    //=================================================================
    try {
      const oDataAccount = accountResponse?.data?.value;
      if (oDataAccount) {
         result = await this.send({
          event: "PartiesRedetAction",
          data: { id },
          headers: req.headers

        });
      }

      return { message: `Proceso completado: ${result.message || result.statusText}` };
    } catch (oError) {
      console.error("Error al recuperar cliente:", oError.message);
      return req.error(500, "Error al recuperar cliente desde SAP SERVICES CLOUD V2");
    }
  });

  //=====REDETERMINACION DE PARTES IMPLICADAS======
  this.on("PartiesRedetAction", async (req) => {
    const { id } = req.data;
    cds.headersReq = req.headers;
    if (!id) return req.error(400, "Debe especificarse un ID de caso");

    try {
      //=================================================================
      //================ Obtenemos el caso desde SAP SERVICES CLOUD V2 ====================
      //=================================================================
      const caseResponse = await getCase(id, req);
      const oCase = caseResponse.data?.value;
      cds.headersReq.eTag = caseResponse.headers.etag
      cds.headersReq.csrfToken = caseResponse.headers['x-csrf-token'];
      if (!oCase) return req.error(404, "Caso no encontrado en SAP SERVICES CLOUD V2");


      //=================================================================
      //================ Obtenemos el cliente des de SAP SERVICES CLOUD V2 ================
      //=================================================================
      const accountResponse = await getClient(oCase, req);
      const oAccount = accountResponse.data?.value;

      if (!oAccount) return req.error(404, "Cliente no encontrado en SAP SERVICES CLOUD V2");

      //=================================================================
      //================ Procesamos partes implicadas ===================
      //=================================================================
      const result = await procesarPartesImplicadas(oCase, oAccount);

      return { message: `Proceso completado: ${result}` };

    } catch (oError) {
      console.error("Error en PartiesRedetAction:", oError.message);
      return req.error(500, "Error al procesar partes implicadas");
    }
  });

});
