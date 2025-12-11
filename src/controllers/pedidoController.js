const { pedidoModel } = require("../models/pedidoModel");
const { pool } = require("../config/db");

async function atualizarValoresPedido(req, res) {
    try {
        const idPedido = Number(req.params.idPedido || req.body.idPedido);
        const { distancia, peso_carga, valorbase_km, valorbase_kg } = req.body;

        if (!idPedido || !distancia || !peso_carga || !valorbase_km || !valorbase_kg) {
            return res.status(400).json({ error: "dados incompletos" });
        }

        const valorDistancia = distancia * valorbase_km;
        const valorPeso = peso_carga * valorbase_kg;
        const valor_final = valorDistancia + valorPeso;

        const resultado = await pedidoModel.updateValoresPedido(
            idPedido,
            distancia,
            peso_carga,
            valorbase_km,
            valorbase_kg,
            valorDistancia,
            valorPeso,
            valor_final
        );

        return res.status(200).json({
            message: resultado.message,
            entrega: { valorDistancia, valorPeso, valor_final, idPedido }
        });

    } catch (error) {
        console.error("erro no controller ao atualizar valores:", error);
        return res.status(500).json({ 
            error: "erro ao calcular/atualizar valores da entrega"
        });
    }
}

const pedidoController = {
    /**
     * @description Cria um novo pedido no banco de dados.
     * Rota POST /pedidos
     * @async
     * @function criarPedido
     * @param {Request} req - Objeto da requisição HTTP, esperando no body: { idCliente, distancia, peso_carga, valorbase_km, valorbase_kg }.
     * @param {Response} res - Objeto da resposta HTTP.
     * @returns {Promise<void>} Responde com status 201 e o ID do pedido criado, ou 400/500 em caso de erro/falha na validação ou inserção.
     */
    criarPedido: async (req, res) => {
        try {
            const { idCliente, distancia, peso_carga, valorbase_km, valorbase_kg } = req.body;

            if (!idCliente || !distancia || !peso_carga || !valorbase_km || !valorbase_kg) {
                return res.status(400).json({ message: "dados obrigatórios incompletos" });
            }

            if (distancia <= 0 || peso_carga <= 0 || valorbase_km <= 0 || valorbase_kg <= 0) {
                return res.status(400).json({ message: "os números devem ser positivos" });
            }

            const resultado = await pedidoModel.insertPedido(
                idCliente,
                distancia,
                peso_carga,
                valorbase_km,
                valorbase_kg
            );

            if (resultado.affectedRows === 0) {
                return res.status(500).json({ message: "erro ao inserir pedido" });
            }

            const idPedido = resultado.insertId;

            req.body.idPedido = idPedido;

            return atualizarValoresPedido(req, res);

        } catch (error) {
            res.status(500).json({
                message: "erro interno ao criar pedido",
                error: error.message
            });
        }
    },
    /**
     * @description Retorna todos os pedidos cadastrados.
     * Rota GET /pedidos
     * @async
     * @function selecionaPedido
     * @param {Request} req - Objeto da requisição HTTP (não utilizado).
     * @param {Response} res - Objeto da resposta HTTP.
     * @returns {Promise<void>} Responde com status 200 e um array de pedidos, ou 200/500 em caso de nenhum resultado/erro interno.
     */
    selecionaPedido: async (req, res) => {
        try {
            const pedidos = await pedidoModel.selecionaPedido();

            if (pedidos.length === 0) {
                return res.status(200).json({ message: "nenhum pedido encontrado" });
            }

            res.status(200).json(pedidos);
        } catch (error) {
            res.status(500).json({
                message: "erro ao buscar pedidos",
                error: error.message
            });
        }
    },
     /**
     * @description Atualiza os campos de distância e/ou peso da carga de um pedido, se o status permitir.
     * Rota PUT /pedidos/:idPedido
     * @async
     * @function updateItemPedidos
     * @param {Request} req - Objeto da requisição HTTP, esperando idPedido nos parâmetros e { distancia, peso_carga } no body.
     * @param {Response} res - Objeto da resposta HTTP.
     * @returns {Promise<void>} Responde com status 200 em caso de sucesso ou nenhuma alteração, ou 400/403/404/500 em caso de falha/restrição.
     */
    updateItemPedidos: async (req, res) => {
        try {
            const idPedido = Number(req.params.idPedido);
            const { distancia, peso_carga, valorbase_km, valorbase_kg } = req.body;
    
            if (isNaN(idPedido) || idPedido <= 0) {
                return res.status(400).json({ message: "id inválido" });
            }
    
            const pedido = await pedidoModel.selectPedidoById(idPedido);
    
            if (pedido.length === 0) {
                return res.status(404).json({ message: "pedido não encontrado" });
            }
    
            await pedidoModel.updateItemPedido(idPedido, distancia, peso_carga);
    
            if (!valorbase_km || !valorbase_kg) {
                return res.status(400).json({ message: "valorbase_km e valorbase_kg são necessários para atualizar entrega" });
            }
    
            const valorDistancia = distancia * valorbase_km;
            const valorPeso = peso_carga * valorbase_kg;
            const valor_final = valorDistancia + valorPeso;
    
            const [rows] = await pool.query(
                "select idEntrega from entregas where idPedido = ?",
                [idPedido]
            );
    
            if (rows.length === 0) {
                await pool.query(
                    `insert into entregas
                    (valor_distancia, valor_peso, acrescimo, desconto, taxa_extra, valor_final, status_entrega, tipo_entrega, idPedido)
                    values (?, ?, 0, 0, 0, ?, 'calculando', 'normal', ?)`,
                    [valorDistancia, valorPeso, valor_final, idPedido]
                );
            } else {
                await pool.query(
                    `update entregas
                     set valor_distancia = ?, valor_peso = ?, valor_final = ?
                     where idPedido = ?`,
                    [valorDistancia, valorPeso, valor_final, idPedido]
                );
            }
    
            return res.status(200).json({
                message: "pedido e entrega atualizados",
                entrega: { valorDistancia, valorPeso, valor_final, idPedido }
            });
    
        } catch (error) {
            res.status(500).json({ message: "erro ao atualizar pedido e entrega" });
        }
    },
    /**
     * @description Exclui um pedido e sua entrega associada pelo ID, se o status permitir (em transito ou entregue são proibidos).
     * Rota DELETE /pedidos/:idPedido
     * @async
     * @function deletaPedidos
     * @param {Request} req - Objeto da requisição HTTP, esperando idPedido nos parâmetros.
     * @param {Response} res - Objeto da resposta HTTP.
     * @returns {Promise<void>} Responde com status 200 em caso de sucesso, ou 400/403/404/500 em caso de falha/restrição.
     */
    deletaPedidos: async (req, res) => {
        try {
            const idPedido = Number(req.params.idPedido);

            if (isNaN(idPedido) || idPedido <= 0) {
                return res.status(400).json({ message: "id inválido" });
            }

            await pool.query("delete from entregas where idPedido = ?", [idPedido]);

            const [result] = await pool.query(
                "delete from pedidos where idPedido = ?",
                [idPedido]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "pedido não encontrado" });
            }

            return res.status(200).json({ message: "pedido e entrega removidos" });

        } catch (error) {
            res.status(500).json({ message: "erro ao deletar pedido" });
        }
    },

    atualizarValoresPedido
};

module.exports = { pedidoController };
