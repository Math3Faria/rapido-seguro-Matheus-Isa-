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
    const [rows] = await pool.query(sql, [pIdPedido]);
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
    const [rows] = await pool.query(sql, [pIdPedido]);
    return rows;
  },
  /**
   * @description Deleta um pedido pelo ID.
   * @param {number} pIdPedido - O ID do pedido a ser deletado.
   * @returns {Promise<Object>} Resultado da operação de exclusão.
   */
  deletaPedido: async (pIdPedido) => {
    const sql = 'delete from Pedidos where idPedido = ?;';
    const [rows] = await pool.query(sql, [pIdPedido]);
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
    const [rows] = await pool.query(sql, [pDistancia, pPesoCarga, pIdPedido]);
    return rows;
  },

  /**
   * @description Atualiza todos os valores base de um pedido (distância, peso da carga, valor base por km e valor base por kg).
   * @param {number} idPedido - O ID do pedido a ser alterado.
   * @param {number} distancia - A nova distância do pedido.
   * @param {number} peso_carga - O novo peso da carga.
   * @param {number} valorbase_km - O novo valor base por quilômetro.
   * @param {number} valorbase_kg - O novo valor base por quilograma.
   * @returns {Promise<Object>} Resultado da operação de atualização.
   */
  updateValoresPedido: async (
    idPedido, 
    distancia, 
    peso_carga, 
    valorbase_km, 
    valorbase_kg,
    valorDistancia, 
    valorPeso,      
    valor_final     
) => {
    const connection = await pool.getConnection(); 
    
    try {
        await connection.beginTransaction(); 

        const updatepedidosql = `
            update pedidos
            set distancia = ?, 
                peso_carga = ?, 
                valorbase_km = ?, 
                valorbase_kg = ?
            where idPedido = ?;
        `;

        const updatepedidoparams = [
            distancia, peso_carga, valorbase_km, valorbase_kg, idPedido
        ];

        await connection.query(updatepedidosql, updatepedidoparams);
        
        const [rows] = await connection.query(`select idPedido from entregas where idPedido = ?`, [idPedido]);

        if (rows.length === 0) {
            const insertentregasql = `
                insert into entregas
                (valor_distancia, valor_peso, acrescimo, desconto, taxa_extra, valor_final, status_entrega, tipo_entrega, idPedido)
                values (?, ?, 0, 0, 0, ?, 'calculando', 'normal', ?);
            `;
            const insertentregaparams = [valorDistancia, valorPeso, valor_final, idPedido];

            await connection.query(insertentregasql, insertentregaparams);
            
        } else {
            const updateentregasql = `
                update entregas
                set valor_distancia = ?, valor_peso = ?, valor_final = ?
                where idPedido = ?;
            `;
            const updateentregaparams = [valorDistancia, valorPeso, valor_final, idPedido];

            await connection.query(updateentregasql, updateentregaparams);
        }

        await connection.commit(); 
        
        return { success: true, message: "Pedido e Entrega atualizados em transação." };

    } catch (error) {
        await connection.rollback(); 
        console.error("Erro na transação updateValoresPedido:", error);
        throw error; 
    } finally {
        connection.release(); 
    }
},
};

module.exports = { pedidoModel };
