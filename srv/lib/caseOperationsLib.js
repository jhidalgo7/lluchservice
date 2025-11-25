
const c4cGet = require("../utils/c4cGet");
const cds = require('@sap/cds');
const constants = require("../utils/constants");
const { getClient } = require("../utils/caseService");
const { updatePartesImplicadas } = require("../utils/procesarPartesImplicadas");

module.exports = {
  /***
   * 
   *  //CREACIÓN DE CASO
          //Before image vacío y name account vacío o distinto de DUMMY
            //salesareadeteraction

      //EDITAR
        //BeforeImage tenemos dummy y en el nuevo es distinto dummy
            //salesareadeteraction
         
        //STATUS 01 Y area determinacion anterior 9999 y ahora sea distinta a la9999
          //PartiesRedetAction

   */
  async SalesArea_PartiesDeterAction(currentImage, beforeImage) {

    try {
      // CREACIÓN DE CASO
      const isBeforeEmpty = !beforeImage || Object.keys(beforeImage).length === 0;
      const accountNameCurrent = currentImage?.account?.name || "";
      const accountNameBefore = beforeImage?.account?.name || "";

      // Recuperar cliente
      const accountResponse = await getClient(currentImage);
      const oDataAccount = accountResponse?.data?.value;

      if (isBeforeEmpty && (accountNameCurrent === "" || accountNameCurrent !== constants.DUMMY)) {
        console.log("Ejecutando SalesAreaDetermination (Creación de caso)");
        await this.determinateSalesArea(currentImage,oDataAccount);
      } else {
        // EDITAR
        if (accountNameBefore === constants.DUMMY && accountNameCurrent !== constants.DUMMY) {
          console.log("Ejecutando SalesAreaDetermination (Editar caso)");
          await this.determinateSalesArea(currentImage, oDataAccount);
        }

        // STATUS 01 y cambio de área
        const statusCurrent = currentImage?.status || "";
        const salesAreaBefore = beforeImage?.extensions?.ZOrganizacion_de_ventas || "";
        const salesAreaCurrent = currentImage?.extensions?.ZOrganizacion_de_ventas || "";

        if (statusCurrent === constants.status.open
          && salesAreaBefore === constants.zorganizacionVentas
          && salesAreaCurrent !== constants.zorganizacionVentas) {
          console.log("Ejecutando PartiesRedetAction");
          await updatePartesImplicadas(null,currentImage, oDataAccount );
        }
      }



    } catch (error) {
      console.error("Error en SalesArea_PartiesDeterAction:", error);
    }

  },
  /**
   *  Determinación de area de vetas
   */
  async determinateSalesArea(caseRequest,oDataAccount) {
    try {
      // Inicializar extensiones si no existen
      caseRequest.extensions ??= {};

      // Si no encontramos cliente
      if (!oDataAccount) {
        console.warn("Cliente no encontrado, asignando valor por defecto");
        caseRequest.extensions.ZOrganizacion_de_ventas = constants.zorganizacionVentas;
        return; // Early return, no hay más que hacer
      }

      // Determinar acuerdos de ventas
      const salesArrangements = caseRequest.salesArrangements || oDataAccount.salesArrangements || [];
      const currentOrg = caseRequest.extensions.ZOrganizacion_de_ventas;

      // Si ya existe organización, no hacemos nada
      if (currentOrg) return;

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
 
}