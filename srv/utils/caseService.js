
const c4cGet = require("./c4cGet");
const cds = require('@sap/cds');
const c4cPatch = require("./c4cPatch");
const constants = require("./constants");

module.exports = {

  async getCase(id, req) {
    const pathCases = `${constants.pathC4C.cases}${id ? `/${id}` : ""}`;

    try {
      const caseResponse = await c4cGet(pathCases);
      return caseResponse;
    } catch (oError) {
      console.error("Error al recuperar caso:", oError.message);
      return req.error(500, "Error al recuperar casos desde  SAP SERVICES CLOUD V2");
    }
  },

  async getClient(oDataCase, req) {

    const clientID = oDataCase.account?.id;
    if (!clientID) {
      console.warn("Caso sin cliente asociado en  SAP SERVICES CLOUD V2");
      //return req.error(404, "El caso no tiene cliente asociado en C4C");
    }

    const pathAccounts = `${constants.pathC4C.account}${clientID}`;
    try {
      const accountResponse = await c4cGet(pathAccounts);
      return accountResponse;
    } catch (oError) {
      console.error("Error al recuperar cliente:", oError.message);
      //return req.error(500, "Error al recuperar cliente desde C4C");
    }
  },

  async determinateSalesArea(accountResponse, oDataCase, pathCases) {
    //Si no encontramos cliente en el caso
    const oDataAccount = accountResponse?.data?.value;
    if (!oDataAccount) {
      console.warn("Cliente no encontrado, asignando '9999'");

      return await c4cPatch(pathCases, {
        extensions: { ZOrganizacion_de_ventas: constants.zorganizacionVentas }
      });
    }

    //Si encontramos cliente
    //Validamos la cantiddad de salesArrangement
    let salesArrangements
    try {
      salesArrangements = oDataCase.data.value.salesArrangements || [];

    } catch (error) {

      salesArrangements = oDataAccount.salesArrangements || [];
    }

    const currentOrg = oDataCase.extensions?.ZOrganizacion_de_ventas;

    if (!currentOrg) {
      //Si solo tiene un acuerdo de ventas, lo actualizamos con el del acuerdo de ventas
      if (salesArrangements.length === 1) {
        return await c4cPatch(pathCases, {
          extensions: {
            ZOrganizacion_de_ventas: salesArrangements[0].salesOrganizationDisplayId
          }
        });
      } else if (salesArrangements.length > 1) {
        //Si tiene mas de uno, añadimos el 9999
        return await c4cPatch(pathCases, {
          extensions: { ZOrganizacion_de_ventas: constants.zorganizacionVentas }
        });
      }
    }
  }
}