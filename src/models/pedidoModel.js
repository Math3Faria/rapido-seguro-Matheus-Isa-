const { pool } = require("../config/db");

const pedidoModel = {

  /**
   * @description Seleciona um pedido pelo ID, incluindo o status da entrega.
   * @param {number} pIdPedido - O ID do pedido a ser buscado.
   * @returns {Promise<Array>} Retorna um array com os dados do pedido e entrega.
   */
  selectPedidoById: async (pIdPedido) => {
    const sql = `
      select p.idPedido, e.status_entrega 
      from Pedidos p 
      left join Entregas e on p.idPedido = e.idPedido 
      where p.idPedido = ?;
    `;
    const values = [pIdPedido];
    const [rows] = await pool.query(sql, values);
    return rows;
  },

  /**
   * @description Seleciona todos os pedidos do banco de dados.
   * @returns {Promise<Array>} Um array contendo todos os pedidos cadastrados.
   */
  selecionaPedido: async () => {
    const sql = "select * from pedidos;";
    const [rows] = await pool.query(sql);
    return rows;
  },

  /**
   * @description Insere um novo pedido no banco de dados.
   * @param {number} idCliente - O ID do cliente que fez o pedido.
   * @param {number} distancia - A distância total da entrega.
   * @param {number} peso_carga - O peso da carga a ser transportada.
   * @param {number} valorbase_km - O valor base por quilômetro.
   * @param {number} valorbase_kg - O valor base por quilograma.
   * @returns {Promise<Object>} Objeto contendo informações do resultado da inserção.
   */
  insertPedido: async (idCliente, distancia, peso_carga, valorbase_km, valorbase_kg) => {
    const sql = `
      insert into pedidos 
      (idCliente, distancia, peso_carga, valorbase_km, valorbase_kg) 
      values (?, ?, ?, ?, ?);
    `;
    const values = [idCliente, distancia, peso_carga, valorbase_km, valorbase_kg];
    const [result] = await pool.query(sql, values);
    return result;
  },

  /**
   * @description Deleta a entrega vinculada a um pedido.
   * @param {number} pIdPedido - O ID do pedido que deseja remover a entrega.
   * @returns {Promise<Object>} Resultado da operação de exclusão.
   */
  deleteEntregaByPedidoId: async (pIdPedido) => {
    const sql = 'delete from Entregas where idPedido = ?;';
    const values = [pIdPedido];
    const [rows] = await pool.query(sql, values);
    return rows;
  },

  /**
   * @description Deleta um pedido pelo ID.
   * @param {number} pIdPedido - O ID do pedido a ser deletado.
   * @returns {Promise<Object>} Resultado da operação de exclusão.
   */
  deletaPedido: async (pIdPedido) => {
    const sql = 'delete from Pedidos where idPedido = ?;';
    const values = [pIdPedido];
    const [rows] = await pool.query(sql, values);
    return rows;
  },

  /**
   * @description Atualiza os dados de um pedido (distância e peso da carga).
   * @param {number} pIdPedido - O ID do pedido a ser alterado.
   * @param {number} pDistancia - A nova distância do pedido.
   * @param {number} pPesoCarga - O novo peso da carga.
   * @returns {Promise<Object>} Resultado da operação de atualização.
   */
  updateItemPedido: async (pIdPedido, pDistancia, pPesoCarga) => {
    const sql = `
      update Pedidos 
      set distancia = ?, peso_carga = ? 
      where idPedido = ?;
    `;
    const values = [pDistancia, pPesoCarga, pIdPedido];
    const [rows] = await pool.query(sql, values);
    return rows;
  },

};

module.exports = { pedidoModel };
