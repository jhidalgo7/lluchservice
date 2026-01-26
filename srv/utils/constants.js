

const role = {
    rol146: 'AT146-1',
    rolBur011: 'BUR011-1'
},
    partRole = {
        rol146: 'ZCS',
        rolBur011: 'ZKAM'
    },
    status = {
        open: '01'
    },
    zorganizacionVentas = '9999',
    pathC4C = {
        cases: '/sap/c4c/api/v1/case-service/cases',
        account: '/sap/c4c/api/v1/account-service/accounts/'
    }, DUMMY = 'DUMMY';

const messages = {
    es: {
        salesDataMissing: 'Los datos de venta Oficina de Ventas y Moneda son obligatorios',
        accountTeamMissing:
            'Es obligatorio disponer de un Customer Service asignado en el equipo de cuenta con datos de área de ventas',
    },
    en: {
        salesDataMissing: 'Sales Office and Currency data are mandatory in Sales Data tab',
        accountTeamMissing:
            'It is mandatory to have a Customer Service assigned to the account team with sales area data.',
    },
};

module.exports = {
    role, partRole, zorganizacionVentas, pathC4C, DUMMY, status, messages
}
