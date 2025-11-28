
const constants = require("./constants");
const c4cPatch = require("./c4cPatch");

function findMember(team, rol, org) {
    return team.find(m => m.role === rol && (!org || m.salesOrganizationDisplayId === org));
}
function upsertEmployee(list, miembro, rol) {
    const index = list.findIndex(emp => emp.partyRole === rol);
    const newData = {
        partyId: miembro.employeeId,
        partyRole: rol,
        employeeDisplayId: miembro.employeeDisplayId,
        name: miembro.employeeFormattedName,
        partyType: "EMPLOYEE"
    };
    if (index !== -1) {
        list[index] = newData;
    } else {
        list.push(newData);
    }
}
// ======================================================================
// Actualizamos Processor y CustomEmployees
// ======================================================================
async function updatePartesImplicadas(caseId, oCase, oAccount, dataModify) {

    const team = oAccount.accountTeamMembers || [];
    const org = oCase.extensions?.ZOrganizacion_de_ventas;

    const miembroAT146 = findMember(team, constants.role.rol146, org);
    const miembroBUR011 = findMember(team, constants.role.rolBur011, org);

    if (!miembroAT146 && !miembroBUR011) {
        console.warn("No se encontraron miembros relevantes");
        return;
    }

    // Processor
    const nuevoProcessor = { ...oCase.processor };
    if (miembroAT146) {
        nuevoProcessor.id = miembroAT146.employeeId;
        dataModify.processor ??= {};
        dataModify.processor.id = miembroAT146.employeeId;
    }

    // Custom Employees
    let nuevosCustomEmployees = Array.isArray(oCase.customEmployees) ? [...oCase.customEmployees] : [];
    if (miembroAT146) upsertEmployee(nuevosCustomEmployees, miembroAT146, constants.partRole.rol146);
    if (miembroBUR011) upsertEmployee(nuevosCustomEmployees, miembroBUR011, constants.partRole.rolBur011);

    // PATCH
    if (cds.evento) {
        const patchBody = {};
        if (Object.keys(nuevoProcessor).length > 0) patchBody.processor = nuevoProcessor;
        if (nuevosCustomEmployees.length > 0) patchBody.customEmployees = nuevosCustomEmployees;

        console.warn(`Se enviará el siguiente ${JSON.stringify(patchBody)}`);
        await c4cPatch(`${constants.pathC4C.cases}/${oCase.id}`, patchBody);
    }
}
module.exports = { updatePartesImplicadas };
