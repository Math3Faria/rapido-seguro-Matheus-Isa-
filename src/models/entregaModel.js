const { pool } = require("../config/db"); 

const entregaModel = {

    /**
     * @description Seleciona todas as entregas
     * @returns {Promise<Array>}
     */
    selecionaEntrega: async () => {
        const sql = `
            select e.*, 
                   p.distancia, p.peso_carga, p.valorbase_km, p.valorbase_kg
            from Entregas e
            join Pedidos p on e.idPedido = p.idPedido;
        `;
        const [rows] = await pool.query(sql);
        return rows;
    },

    /**
     * @description Seleciona uma entrega pelo ID
     * @param {number} pIdEntrega
     * @returns {Promise<Object|null>}
     */
    selectById: async (pIdEntrega) => {
        const sql = "select * from Entregas where idEntrega = ?;";
        const [rows] = await pool.query(sql, [pIdEntrega]);
        return rows.length > 0 ? rows[0] : null;
    },
    
    /**
     * @description Insere uma nova entrega com status inicial 'calculando'.
     */
    insertEntrega: async (pIdPedido, pTipoEntrega) => {
        const sql = `
            insert into Entregas 
            (valor_distancia, valor_peso, acrescimo, desconto, taxa_extra, valor_final,
             status_entrega, tipo_entrega, idPedido)
            values (0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'calculando', ?, ?);
        `;
        const values = [pTipoEntrega, pIdPedido];
        const [result] = await pool.query(sql, values);
        return result;
    },

    /**
     * @description Atualiza o status da entrega.
     */
    updateStatus: async (pIdEntrega, pStatusEntrega) => {
        const sql = "update Entregas set status_entrega = ? where idEntrega = ?;";
        const values = [pStatusEntrega, pIdEntrega];
        const [result] = await pool.query(sql, values);
        return result;
    },

    /**
     * @description Exclui uma entrega pelo ID.
     */
    deleteEntrega: async (pIdEntrega) => {
        const sql = "delete from Entregas where idEntrega = ?;";
        const [rows] = await pool.query(sql, [pIdEntrega]);
        return rows;
    }

};

module.exports = { entregaModel };
