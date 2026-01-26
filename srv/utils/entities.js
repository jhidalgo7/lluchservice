const caseOperationsLib = require('../lib/caseOperationsLib');
const clientOperationsLib = require('../lib/clientOperationsLib');

module.exports = {
  // Definir un mapa con las entidades y sus funciones
  entityHandlers : {
    'sap.ssc.caseservice.entity.case': caseOperationsLib.SalesArea_PartiesDeterAction,  
    'sap.crm.custom.event.partiesdeteraction': caseOperationsLib.PartiesDeterAction,
    'sap.ssc.md.accountservice.entity.account': clientOperationsLib.validation_NewClient
  }
}