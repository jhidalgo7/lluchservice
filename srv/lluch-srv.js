const cds = require("@sap/cds");
const c4cGet = require("./utils/c4cGet");
const c4cPatch = require("./utils/c4cPatch");
const { procesarPartesImplicadas } = require("./utils/procesarPartesImplicadas");

module.exports = cds.service.impl(async function () {

  //=====DETERMINACIÓN DE AREA DE VENTAS======
  this.on("SalesAreaDeterAction", async (req) => {
    const { id } = req.data;
    let caseResponse, accountResponse;
    const pathCases = `/sap/c4c/api/v1/case-service/cases${id ? `/${id}` : ""}`;

    //=================================================================
    //=========================== CASOS ===============================
    //=================================================================
    try {
      caseResponse = await getCase(id, req);
    } catch (oError) {
      console.error("Error al recuperar caso:", oError.message);
      return req.error(500, "Error al recuperar casos desde C4C");
    }

    //comprobamos si existe el caso
    const oDataCase = caseResponse?.data?.value;
    if (!oDataCase) {
      console.warn("Caso no encontrado o sin datos");
      return req.error(404, "Caso no encontrado en C4C");
    }

    //=================================================================
    //========================== CLIENTE ==============================
    //=================================================================
    try {
      accountResponse = await getClient(oDataCase, req);
    } catch (oError) {
      console.error("Error al recuperar cliente:", oError.message);
      return req.error(500, "Error al recuperar cliente desde C4C");
    }

    //=================================================================
    //================ Determinación Area Ventas ======================
    //=================================================================
    try {
      await determinateSalesArea(caseResponse, accountResponse, oDataCase, pathCases);
    } catch (oError) {
      console.error("Error al determinar area de ventas:", oError.message);
      return req.error(500, "Error al determinar area de ventas desde C4C");
    }

    //TO-DO: Si no tiene partes implicadas, llamamos al segundo Enpoint para determinarlas.
    //=================================================================
    //===================== Partes implicadas =========================
    //=================================================================
    try {
      const result = await this.emit({
        event: "PartiesRedetAction",
        data: { id }
      });
      // const result = await procesarPartesImplicadas(oDataCase, accountResponse.data?.value, c4cPatch, caseResponse.headers.etag);

      return { message: `Proceso completado: ${result}` };
    } catch (oError) {
      console.error("Error al recuperar cliente:", oError.message);
      return req.error(500, "Error al recuperar cliente desde C4C");
    }
  });

  //=====REDETERMINACION DE PARTES IMPLICADAS======
  this.on("PartiesRedetAction", async (req) => {
    const { id } = req.data ;
    if (!id) return req.error(400, "Debe especificarse un ID de caso");

    try {
      //=================================================================
      //================ Obtenemos el caso desde C4C ====================
      //=================================================================
      const caseResponse = await getCase(id, req);
      const oCase = caseResponse.data?.value;

      if (!oCase) return req.error(404, "Caso no encontrado en C4C");


      //=================================================================
      //================ Obtenemos el cliente des de C4C ================
      //=================================================================
      const accountResponse = await getClient(oCase, req);
      const oAccount = accountResponse.data?.value;

      if (!oAccount) return req.error(404, "Cliente no encontrado en C4C");

      //=================================================================
      //================ Procesamos partes implicadas ===================
      //=================================================================
      const result = await procesarPartesImplicadas(oCase, oAccount, c4cPatch, caseResponse.headers.etag);

      return { message: `Proceso completado: ${result}` };

    } catch (oError) {
      console.error("Error en PartiesRedetAction:", oError.message);
      return req.error(500, "Error al procesar partes implicadas");
    }
  });

  async function getCase(id, req) {
    const pathCases = `/sap/c4c/api/v1/case-service/cases${id ? `/${id}` : ""}`;

    try {
      const caseResponse = await c4cGet(pathCases);
      return caseResponse;
    } catch (oError) {
      console.error("Error al recuperar caso:", oError.message);
      return req.error(500, "Error al recuperar casos desde C4C");
    }
  }

  async function getClient(oDataCase, req) {

    const clientID = oDataCase.account?.id;
    if (!clientID) {
      console.warn("Caso sin cliente asociado");
      return req.error(404, "El caso no tiene cliente asociado en C4C");
    }

    const pathAccounts = `/sap/c4c/api/v1/account-service/accounts/${clientID}`;
    try {
      const accountResponse = await c4cGet(pathAccounts);
      return accountResponse;
    } catch (oError) {
      console.error("Error al recuperar cliente:", oError.message);
      return req.error(500, "Error al recuperar cliente desde C4C");
    }
  }

  async function determinateSalesArea(caseResponse, accountResponse, oDataCase, pathCases) {
    //Si no encontramos cliente en el caso
    const oDataAccount = accountResponse?.data?.value;
    if (!oDataAccount) {
      console.warn("Cliente no encontrado, asignando '9999'");
      await c4cPatch(pathCases, {
        extensions: { ZOrganizacion_de_ventas: '9999' }
      }, caseResponse.headers.etag);
      return;
    }

    //Si encontramos cliente
    //Validamos la cantidad de salesArrangement
    const salesArrangements = oDataAccount.salesArrangements || [];
    const currentOrg = oDataCase.extensions?.ZOrganizacion_de_ventas;

    if (!currentOrg) {
      //Si solo tiene un acuerdo de ventas, lo actualizamos con el del acuerdo de ventas
      if (salesArrangements.length === 1) {
        await c4cPatch(pathCases, {
          extensions: {
            ZOrganizacion_de_ventas: salesArrangements[0].salesOrganizationDisplayId
          }
        }, caseResponse.headers.etag);
      } else if (salesArrangements.length > 1) {
        //Si tiene mas de uno, añadimos el 9999
        await c4cPatch(pathCases, {
          extensions: { ZOrganizacion_de_ventas: '9999' }
        }, caseResponse.headers.etag);
      }
    }
  }
});
