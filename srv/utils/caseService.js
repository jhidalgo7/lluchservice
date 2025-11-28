
const c4cGet = require("./c4cGet");
const cds = require('@sap/cds');
const c4cPatch = require("./c4cPatch");
const constants = require("./constants");

module.exports = {

  async getCase(id) {
    const pathCases = `${constants.pathC4C.cases}${id ? `/${id}` : ""}`;

    try {
      const caseResponse = await c4cGet(pathCases);
      return caseResponse;
    } catch (oError) {
      console.error("Error al recuperar caso:", oError.message); 
    }
  }, 

  async getClient(oDataCase) {

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
  }
}