const { pool } = require("../config/db");

const entregaModel = {
    selecionaEntrega: async () => {
        const sql = "select * from entregas;";
        const [rows] = await pool.query(sql);
        return rows;
    },
    selectById: async (pId) => {
        const sql = "select * from entregas;";
        const values = [pId];
        const [rows] = await pool.query(sql);
        return rows;
    },
};

module.exports = { entregaModel };