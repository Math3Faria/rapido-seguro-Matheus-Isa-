const { pool } = require("../config/db"); 
const entregaModel = {
    /**
     * @description Seleciona todas as entregas
     * @returns {Promise<Array>} Um array de entregas
     */
    selecionaEntrega: async () => {

        const sql = `select e.*, p.distancia, p.peso_carga, p.valorbase_km, p.valorbase_kg 
            from Entregas e 
            join Pedidos p on e.idPedido = p.idPedido;`;
        const [rows] = await pool.query(sql);
        return rows;
    },

    /**
     * @description seleciona um entrega pelo id
     * @param {number} pIdEntrega - o id da entrega
     * @returns {Promise<Object|null>} o resultado ou null se não for encontrado
     */
    selectById: async (pIdEntrega) => {
        const sql = "select * from Entregas where idEntrega = ?;";
        const [rows] = await pool.query(sql, [pIdEntrega]);
        return rows.length > 0 ? rows[0] : null; 
    },
    
    /**
     * @description Insere uma nova entrega com status inicial 'calculando'.
     * @async
     * @function insertEntrega
     * @param {number} pIdPedido - O ID do pedido associado.
     * @param {string} pTipoEntrega - O tipo de entrega ('Normal' ou 'Urgente').
     * @returns {Promise<Object>} Resultado da inserção.
     */
    insertEntrega: async (pIdPedido, pTipoEntrega) => {

        const sql = `insert into Entregas (valor_distancia, valor_peso, acrescimo, desconto, taxa_extra, valor_final, status_entrega, tipo_entrega, idPedido) values (0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'calculando', ?, ?);`;
        const values = [pTipoEntrega, pIdPedido];
        const [result] = await pool.query(sql, values);
        return result;
    },

    /**
     * @description Atualiza o status da entrega.
     * @async
     * @function updateStatus
     * @param {number} pIdEntrega - o id da entrega que o status vai ser atualizado
     * @param {string} pStatusEntrega - o novo status
     * @returns {Promise<Object>} o resultado do update
     */
    updateStatus: async (pIdEntrega, pStatusEntrega) => {
        const sql = "update Entregas set status_entrega = ? where idEntrega = ?;";
        const values = [pStatusEntrega, pIdEntrega];
        const [result] = await pool.query(sql, values);
        return result;
    },

    /**
     * @description Faz os calculos dos valores entrega e atualiza a tabela.
     * Quando acontece uma transação muda o status para "em transito".
     * @param {number} pIdEntrega - o id da entrega que os calculos seram feitos
     * @returns {Promise<Object>} o resultado de update e o valor final
     * @throws {Error} se a entrega não for encontrada ocorre um erro 
     */
    calculosEntrega: async (pIdEntrega) => {
        const connection = await pool.getConnection(); 
    
        try {
            await connection.beginTransaction(); 

            const sqlSelect = `
                select p.distancia, p.valorbase_km, p.peso_carga, p.valorbase_kg, e.tipo_entrega
                from Entregas e join Pedidos p ON e.idPedido = p.idPedido
                where e.idEntrega = ?;
            `;
            
            const [rows] = await connection.query(sqlSelect, [pIdEntrega]);
            
            if (rows.length === 0) {
                throw new Error('Entrega não encontrada.');
            }
    
            const data = rows[0];

            const valorDistancia = data.distancia * data.valorbase_km;
            const valorPeso = data.peso_carga * data.valorbase_kg;
            const valorBase = valorDistancia + valorPeso;
    
            const acrescimo = data.tipo_entrega === 'Urgente' ? valorBase * 0.20 : 0.00;
            const valorComAcrescimo = valorBase + acrescimo;
            
            const desconto = valorComAcrescimo > 500.00 ? valorComAcrescimo * 0.10 : 0.00;
            
            const taxaExtra = data.peso_carga > 50.00 ? 15.00 : 0.00;
            
            const valorFinal = valorComAcrescimo - desconto + taxaExtra;
    
            const sqlUpdate = `
                update Entregas
                set valor_distancia = ?, valor_peso = ?, acrescimo = ?, desconto = ?, taxa_extra = ?, valor_final = ?, status_entrega = 'em transito' 
                where idEntrega = ?;
            `;
            const values = [valorDistancia, valorPeso, acrescimo, desconto, taxaExtra, valorFinal, pIdEntrega];
            const [result] = await connection.query(sqlUpdate, values);
            
            await connection.commit(); 
            
            return { result, valorFinal };
    
        } catch (error) {
            await connection.rollback(); 
            throw error; 
        } finally {
            connection.release(); 
        }
    },

    /**
     * @description Exclui uma entrega pelo ID.
     * @async
     * @function deleteEntrega
     * @param {number} pIdEntrega - ID da entrega a ser excluída.
     * @returns {Promise<Object>} Resultado da exclusão.
     */
    deleteEntrega: async (pIdEntrega) => {
        const sql = "delete from Entregas where idEntrega = ?;";
        const values = [pIdEntrega];
        const [rows] = await pool.query(sql, values);
        return rows;
    }

};

module.exports = { entregaModel };