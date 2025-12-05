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
        const sql = `select e.*, p.distancia, p.peso_carga,p.valorbase_km,p.valorbase_kg
            from Entregas e
            join Pedidos p on e.idPedido = p.idPedido where e.idEntrega = ?;`;
        const values = [pIdEntrega];
        const [rows] = await pool.query(sql, values);
        return rows[0];
    },


};

module.exports = { entregaModel };