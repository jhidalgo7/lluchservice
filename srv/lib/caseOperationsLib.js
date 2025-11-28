
const cds = require('@sap/cds');
const constants = require("../utils/constants");
const { getClient, getCase } = require("../utils/caseService");
const { updatePartesImplicadas } = require("../utils/procesarPartesImplicadas");

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
async function SalesArea_PartiesDeterAction(currentImage, beforeImage) {
  let dataModify = {};
  cds.prehook = true;
  try {
    // CREACIÓN DE CASO
    const isBeforeEmpty = beforeImage == null || Object.keys(beforeImage).length === 0;
    const accountNameCurrent = currentImage?.account?.name || "";



    if (isBeforeEmpty && (accountNameCurrent === "" || !accountNameCurrent.includes(constants.DUMMY))) {
      console.log("Ejecutando SalesAreaDetermination (Creación de caso)");
      // Recuperar cliente
      const accountResponse = await getClient(currentImage);
      const oDataAccount = accountResponse?.data?.value;
      await determinateSalesArea(currentImage, oDataAccount, dataModify);
    } else if (!isBeforeEmpty) {
      // Recuperar cliente
      const accountResponse = await getClient(currentImage);
      const oDataAccount = accountResponse?.data?.value;
      //const accountResponseBefore = await getClient(beforeImage);

      // EDITAR
      //28.11.2025 SI ES DISTINTA CUENTA Y NO INCLUYE DUMMY CALCULAMOS DETERMINACIÓN DE VENTAS
      if ((currentImage.account.displayId !== beforeImage.account.displayId) && !accountNameCurrent.includes(constants.DUMMY)) {
        console.log("Ejecutando SalesAreaDetermination (Editar caso)");
        await determinateSalesArea(currentImage, oDataAccount, dataModify);
      }
      // STATUS 01 y cambio de área siempre que sea un sales area distinta a la anterior,
      //actulizar partes implicadas 
      const salesAreaBefore = beforeImage?.extensions?.ZOrganizacion_de_ventas || "";
      const salesAreaCurrent = currentImage?.extensions?.ZOrganizacion_de_ventas || "";
      if (//statusCurrent === constants.status.open
        // && salesAreaBefore === constants.zorganizacionVentas
        // && salesAreaCurrent !== constants.zorganizacionVentas
        salesAreaBefore !== salesAreaCurrent) {
        console.log("Ejecutando PartiesRedetAction");
        await updatePartesImplicadas(null, currentImage, oDataAccount, dataModify);
      }
    }
    return dataModify;

  } catch (error) {
    console.error("Error en SalesArea_PartiesDeterAction:", error);
  }

}

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
  PETICIÓN DE POST HOOK
 */
async function PartiesDeterAction(currentImage, beforeImage) {
  let dataModify = {}
  try {
    // CREACIÓN DE CASO
    const isBeforeEmpty = beforeImage == null || Object.keys(beforeImage).length === 0;

    if (!isBeforeEmpty) {
      //  const statusCurrent = currentImage?.status || "";
      const salesAreaBefore = beforeImage?.extensions?.ZOrganizacion_de_ventas || "";
      const salesAreaCurrent = currentImage?.extensions?.ZOrganizacion_de_ventas || "";

      if (salesAreaBefore !== salesAreaCurrent) {
        try {
          const caseResponse = await getCase(currentImage.id);
          cds.headersReq = {};
          cds.headersReq.eTag = caseResponse.headers.etag

        } catch (error) {

        }
        // Recuperar cliente
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
 *  Determinación de area de vetas
 */
async function determinateSalesArea(caseRequest, oDataAccount, dataModify) {
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
    const currentOrg = caseRequest?.extensions?.ZOrganizacion_de_ventas || "";

    // Si ya existe organización, no hacemos nada
    //28.11.2025 09:23 Si se cambia de una org a otra nueva, se tiene que validar si existe más de una org
    //EN la nueva organización para cambiarla a la 9999
    //if (currentOrg) return;

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


module.exports = { SalesArea_PartiesDeterAction, PartiesDeterAction }