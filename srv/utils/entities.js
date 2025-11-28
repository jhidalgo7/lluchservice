const caseOperationsLib = require('../lib/caseOperationsLib');

module.exports = {
  // Definir un mapa con las entidades y sus funciones
  entityHandlers : {
    'sap.ssc.caseservice.entity.case': caseOperationsLib.SalesArea_PartiesDeterAction,  
    'sap.crm.custom.event.partiesdeteraction': caseOperationsLib.PartiesDeterAction
  }
}