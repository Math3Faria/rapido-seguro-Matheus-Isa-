const { pool } = require("../config/db");

const pedidoModel = {

  selectPedidoById: async (pIdPedido) => {
    const sql = `select p.idPedido, e.status_entrega from Pedidos p left join Entregas e on p.idPedido = e.idPedido where p.idPedido = ?;`;
    const values = [pIdPedido];
    const [rows] = await pool.query(sql, values);
    return rows;
},

  /**
   * @description Seleciona todos os pedidos do banco de dados.
   * @returns {Promise<Array>} Um array de pedidos.
   */
  selecionaPedido: async () => {
    const sql = "SELECT * FROM pedidos;";
    const [rows] = await pool.query(sql);
    return rows;
  },

  /**
   * @description Insere um novo pedido no banco de dados.
   * @param {number} idCliente - O ID do cliente que fez o pedido.
   * @param {number} distancia - A distância da entrega.
   * @param {number} peso_carga - O peso da carga.
   * @param {number} valorbase_km - O valor base por quilômetro.
   * @param {number} valorbase_kg - O valor base por quilograma.
   * @returns {Promise<Object>} Uma promessa que resolve para o resultado da inserção.
   */
  insertPedido: async (idCliente, distancia, peso_carga, valorbase_km, valorbase_kg) => {
    const sql = `insert into pedidos (idCliente, distancia, peso_carga, valorbase_km, valorbase_kg) values (?, ?, ?, ?, ?);`;
    const values = [idCliente, distancia, peso_carga, valorbase_km, valorbase_kg,];
    const [result] = await pool.query(sql, values);
    return result;
  },
  deleteEntregaByPedidoId: async (pIdPedido) => {

    const sql = 'delete from Entregas where idPedido = ?;';
    const values = [pIdPedido];
    const [rows] = await pool.query(sql, values);

    return rows;
},

deletaPedido: async (pIdPedido) => {
    const sql = 'delete from Pedidos where idPedido = ?;';
    const values = [pIdPedido];
    const [rows] = await pool.query(sql, values);
    return rows;
},

updateItemPedido: async (pIdPedido, pDistancia, pPesoCarga) => {
    const sql = 'update Pedidos set distancia = ?, peso_carga = ? where idPedido = ?;';
    const values = [pDistancia, pPesoCarga, pIdPedido];
    const [rows] = await pool.query(sql, values);
    return rows;
},

};

module.exports = { pedidoModel };
