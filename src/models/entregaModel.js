const { pool } = require("../config/db");

const entregaModel = {
    selecionaEntrega: async () => {
    
        const sql = `select e.*, p.distancia, p.peso_carga, p.valorbase_km, p.valorbase_kg 
            from Entregas e 
            join Pedidos p on e.idPedido = p.idPedido;`;
        const [rows] = await pool.query(sql);
        return rows;
    },

    selectById: async (pIdEntrega) => {
        const sql = `
            select e.*, p.distancia, p.peso_carga,p.valorbase_km,p.valorbase_kg
            from Entregas e
            join Pedidos p on e.idPedido = p.idPedido where e.idEntrega = ?;`;
        const values = [pIdEntrega];
        const [rows] = await pool.query(sql, values);
        return rows[0];
    },

    insertEntrega: async (pIdPedido, pTipoEntrega) => {

        const sql = `
            insert into Entregas 
                (valor_distancia, valor_peso, acrescimo, desconto, taxa_extra, valor_final, status_entrega, tipo_entrega, idPedido) values (0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'calculando', ?, ?);`;
        const values = [pTipoEntrega, pIdPedido];
        const [result] = await pool.query(sql, values);
        return result;
    },

    updateStatus: async (pIdEntrega, pStatusEntrega) => {
        const sql = "update Entregas set status_entrega = ? where idEntrega = ?;";
        const values = [pStatusEntrega, pIdEntrega];
        const [rows] = await pool.query(sql, values);
        return rows;
    },


};

module.exports = { entregaModel };