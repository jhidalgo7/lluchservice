const constants = require("./constants");

module.exports = {
    /**
     * Valida los datos de cuenta al cambiar el rol de BUP002 a ZBUP02.
     *
     * @param {Object} payload - Objeto de la cuenta (incluye salesArrangements y accountTeamMembers).
     * @param {string} previousRole - Rol previo del cliente (p.ej., 'BUP002').
     * @param {string} nextRole - Nuevo rol del cliente (p.ej., 'ZBUP02').
     * @param {string} [locale='es'] - Código de idioma (p.ej., 'es', 'en').
     * @param {Object} [options] - Opciones de validación.
     * @param {boolean} [options.requireAllSalesArrangements=false] - Si true, exige currency+salesOffice en todas las salesArrangements.
     * @returns {{ valid: boolean, errors: Array<{code:string, message:string, details?:Object}> }}
     */
    validateAccountOnRoleChange(
        payload,
        previousRole,
        nextRole,
        locale = 'es',
        options = { requireAllSalesArrangements: false }
    ) {
        // Solo valida si el rol pasa de BUP002 a ZBUP02
        if (!(previousRole === 'BUP002' && nextRole === 'ZBUP02')) {
            return { valid: true, errors: [] };
        }

        const lang = String(locale).toLowerCase().startsWith('es') ? 'es' : 'en';
        const errors = [];

        // --------- Helper ----------
        const isEmpty = (v) => v == null || (typeof v === 'string' && v.trim() === '');

        // --------- Validación: Sales Data (salesArrangements) ----------
        const salesArrangements = Array.isArray(payload?.salesArrangements)
            ? payload.salesArrangements
            : [];

        let salesCheckOk = true;
        if (salesArrangements.length === 0) {
            // Si no hay nodo, consideramos que falta
            salesCheckOk = false;
        } else {
            if (options.requireAllSalesArrangements) {
                // Exigir currency + salesOffice en TODAS las entries
                salesCheckOk = salesArrangements.every((sa) => {
                    const currencyOk = !isEmpty(sa?.currency);
                 /*    const salesOfficeOk =
                        !isEmpty(sa?.salesOfficeId) || !isEmpty(sa?.salesOfficeDisplayId); */
                    return currencyOk ;//&& salesOfficeOk;
                });
            } else {
                // Basta con que haya AL MENOS UNA entry con ambos informados
                salesCheckOk = salesArrangements.some((sa) => {
                    const currencyOk = !isEmpty(sa?.currency);
                    /* const salesOfficeOk =
                        !isEmpty(sa?.salesOfficeId) || !isEmpty(sa?.salesOfficeDisplayId); */
                    return currencyOk;// && salesOfficeOk;
                });
            }
        }

        if (!salesCheckOk) {
            errors.push({
                code: 'SALES_DATA_MISSING',
                message: constants.messages[lang].salesDataMissing/* ,
                target: {
                    path: 'salesArrangements',
                    required: ['currency', 'salesOfficeId|salesOfficeDisplayId'],
                    mode: options.requireAllSalesArrangements ? 'all' : 'atLeastOne',
                }, */
            });
        }

        // --------- Validación: Equipo de cuenta (accountTeamMembers) ----------
        const teamMembers = Array.isArray(payload?.accountTeamMembers)
            ? payload.accountTeamMembers
            : [];

        const hasCustomerServiceWithSalesArea = teamMembers.some((m) => {
            if (m?.role !== constants.role.rol146) return false;

            // Requerimos datos de área de ventas (org de ventas + canal + sector/división)
            const salesOrgOk =
                !isEmpty(m?.salesOrganizationId) || !isEmpty(m?.salesOrganizationDisplayId);
            const distChanOk = !isEmpty(m?.distributionChannel);
            const divisionOk = !isEmpty(m?.division);

            return salesOrgOk && distChanOk && divisionOk;
        });

        if (!hasCustomerServiceWithSalesArea) {
            errors.push({
                code: 'ACCOUNT_TEAM_MISSING',
                message: constants.messages[lang].accountTeamMissing/* ,
                target: {
                    path: 'accountTeamMembers',
                    roleRequired: constants.role.rol146,
                    required: [
                        'salesOrganizationId|salesOrganizationDisplayId',
                        'distributionChannel',
                        'division',
                    ],
                }, */
            });
        }

        return { valid: errors.length === 0, errors };
    }
}