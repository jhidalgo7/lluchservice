
const constants = require("./constants");
const c4cPatch = require("./c4cPatch");

/**
 * Busca un miembro del equipo con un rol específico y opcionalmente una organización de ventas.
 * @param {Array} team - Lista de miembros del equipo.
 * @param {string} rol - Rol que se desea encontrar.
 * @param {string} org - ID de la organización de ventas (opcional).
 * @returns {Object|undefined} - Miembro encontrado o undefined si no existe.
 */
function findMember(team, rol, org) {
    return team.find(m => m.role === rol && (!org || m.salesOrganizationDisplayId === org));
}

/**
 * Inserta o actualiza un empleado en la lista de CustomEmployees.
 * @param {Array} list - Lista actual de empleados.
 * @param {Object} miembro - Datos del miembro a insertar/actualizar.
 * @param {string} rol - Rol que se asignará al empleado.
 */
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
        // Si ya existe el rol, actualizamos el registro
        list[index] = newData;
    } else {
        // Si no existe, lo añadimos
        list.push(newData);
    }
}

// ======================================================================
// Actualizamos Processor y CustomEmployees en el caso (Case)
// ======================================================================

/**
 * Actualiza las partes implicadas en un caso (Processor y CustomEmployees).
 * - Busca miembros relevantes en el equipo de la cuenta.
 * - Actualiza el Processor si corresponde.
 * - Actualiza la lista de CustomEmployees.
 * - Envía un PATCH a C4C si hay cambios.
 *
 * @param {string} caseId - ID del caso.
 * @param {Object} oCase - Objeto del caso actual.
 * @param {Object} oAccount - Objeto de la cuenta asociada.
 * @param {Object} dataModify - Objeto para acumular modificaciones.
 */
async function updatePartesImplicadas(caseId, oCase, oAccount, dataModify) {

    // Obtenemos el equipo de la cuenta y la organización de ventas del caso
    const team = oAccount.accountTeamMembers || [];
    const org = oCase.extensions?.ZOrganizacion_de_ventas;

    // Buscamos miembros relevantes por rol
    const miembroAT146 = findMember(team, constants.role.rol146, org);
    const miembroBUR011 = findMember(team, constants.role.rolBur011, org);

    if (!miembroAT146 && !miembroBUR011) {
        console.warn("No se encontraron miembros relevantes");
        return;
    }

    // Processor: actualizamos si existe miembro AT146
    const nuevoProcessor = { ...oCase.processor };
    if (miembroAT146) {
        nuevoProcessor.id = miembroAT146.employeeId;
        dataModify.processor ??= {};
        dataModify.processor.id = miembroAT146.employeeId;
    }

    // Custom Employees: clonamos lista y actualizamos roles
    let nuevosCustomEmployees = Array.isArray(oCase.customEmployees) ? [...oCase.customEmployees] : [];
    if (miembroAT146) upsertEmployee(nuevosCustomEmployees, miembroAT146, constants.partRole.rol146);
    if (miembroBUR011) upsertEmployee(nuevosCustomEmployees, miembroBUR011, constants.partRole.rolBur011);

    // PATCH: enviamos cambios a C4C si hay evento activo
    if (cds.evento) {
        const patchBody = {};
        if (Object.keys(nuevoProcessor).length > 0) patchBody.processor = nuevoProcessor;
        if (nuevosCustomEmployees.length > 0) patchBody.customEmployees = nuevosCustomEmployees;

        console.warn(`Se enviará el siguiente ${JSON.stringify(patchBody)}`);
        await c4cPatch(`${constants.pathC4C.cases}/${oCase.id}`, patchBody);
    }
}

module.exports = { updatePartesImplicadas };
