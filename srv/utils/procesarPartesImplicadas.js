async function procesarPartesImplicadas(oCase, oAccount, patchC4CData, etag) {
    const caseId = oCase.id;
    const orgVentas = oCase.extensions?.ZOrganizacion_de_ventas;

    //CASO 1: Cuando viene del otro Endpoint --> sin ZOrganizacion_de_ventas (Dummy)
    if (!orgVentas) {
        await updatePartesImplicadas(caseId, oCase, oAccount, patchC4CData, etag);
        return "Cliente dummy --> Partes implicadas actualizadas";
    } else {
        //CASO 2: Cuando viene de ATHENIA
        await updatePartesImplicadas(caseId, oCase, oAccount, patchC4CData, etag);
        return "Cambio de Sales Org --> Partes implicadas actualizadas";
    }
}

// ======================================================================
// Actualizamos Processor y CustomEmployees
// ======================================================================
async function updatePartesImplicadas(caseId, oCase, oAccount, patchC4CData, etag) {
    const team = oAccount.accountTeamMembers || [];

    //Buscamos las partes implicadas del cliente
    const miembroAT146 = team.find(m => m.role === "AT146-1");
    const miembroBUR011 = team.find(m => m.role === "BUR011-1");

    if (!miembroAT146 && !miembroBUR011) {
        console.warn("No se encontraron miembros relevantes (AT146-1 o BUR011-1) en el cliente");
        return;
    }

    //Processor
    const nuevoProcessor = { ...oCase.processor };
    if (miembroAT146) {
        nuevoProcessor.id = miembroAT146.employeeId;
    }

    //Custom Employees
    let nuevosCustomEmployees = [];

    if (Array.isArray(oCase.customEmployees) && oCase.customEmployees.length > 0) {
        //Actualizamos los existentes
        nuevosCustomEmployees = oCase.customEmployees.map(emp => {
            const updated = { ...emp };

            if (emp.partyRole === "ZCS" && miembroAT146) {
                updated.partyId = miembroAT146.employeeId;
            } else if (emp.partyRole === "ZKAM" && miembroBUR011) {
                updated.partyId = miembroBUR011.employeeId;
            }

            return updated;
        });
    } else {
        //Si no existen, los creamos
        if (miembroAT146) {
            nuevosCustomEmployees.push({
                partyId: miembroAT146.employeeId,
                partyRole: "ZCS"
            });
        }
        if (miembroBUR011) {
            nuevosCustomEmployees.push({
                id: miembroBUR011.employeeId,
                partyRole: "ZKAM"
            });
        }
    }

    //PATCH body
    const patchBody = {};
    if (Object.keys(nuevoProcessor).length > 0) patchBody.processor = nuevoProcessor;
    if (nuevosCustomEmployees.length > 0) patchBody.customEmployees = nuevosCustomEmployees;

    //Llamada PATCH
    const path = `/sap/c4c/api/v1/case-service/cases/${caseId}`;
    await patchC4CData(path, patchBody, etag);
}

module.exports = { procesarPartesImplicadas };
