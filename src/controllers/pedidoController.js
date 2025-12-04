const { pedidoModel } = require("../models/pedidoModel");

const pedidoController = {
    
    criarPedido: async (req, res) => {
        try {
            const { idCliente, distancia, peso_carga, valorbase_km, valorbase_kg } = req.body;

            if (!idCliente || !distancia || !peso_carga || !valorbase_km || !valorbase_kg) {
                return res.status(400).json({ message: "Dados obrigatórios incompletos." });
            }
            if (distancia <= 0 || peso_carga <= 0 || valorbase_km <= 0 || valorbase_kg <= 0) {
                return res.status(400).json({ message: "Os números tem que ser positivos." });
            }
            const resultado = await pedidoModel.insertPedido(
                idCliente,
                distancia,
                peso_carga,
                valorbase_km,
                valorbase_kg
            );
            if (resultado.affectedRows === 0) {
                 return res.status(500).json({ message: "Erro ao inserir o pedido no banco de dados." });
            }

            res.status(201).json({
                message: "Pedido criado com sucesso.",
                idPedido: resultado.insertId
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                message: "Ocorreu um erro interno ao criar o pedido.",
                error: error.message 
            });
        }
    },
    selecionaPedido: async (req, res) => {
        try {
            const pedidos = await pedidoModel.selecionaPedido();
            
            if (pedidos.length === 0) {
                return res.status(200).json({ message: "Nenhum pedido encontrado." });
            }
            
            res.status(200).json(pedidos);

        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Ocorreu um erro interno ao buscar os pedidos.",
                error: error.message
            });
        }
    },
    deletaPedidos: async (req, res) => {
        try {
            const idPedido = Number(req.params.idPedido);

            if (isNaN(idPedido) || idPedido <= 0) {
                return res.status(400).json({message: "Insira um id de pedido valido",});
            }

            const pedidoSelecionado = await pedidoModel.selectPedidoById(idPedido);

            if (pedidoSelecionado.length === 0) {
                return res.status(404).json({ 
                    message: "O pedido nao foi encontrado no banco de dados",});
            }
            const statusEntrega = pedidoSelecionado[0].status_entrega;
            if (statusEntrega === 'em transito' || statusEntrega === 'entregue') {
                 return res.status(403).json({
                    message: `Não da para excluir o pedido. Status atual: ${statusEntrega}.`,});
            }
            const resultadoDeleteEntrega = await pedidoModel.deleteEntregaByPedidoId(idPedido);
            const resultadoDeletaPedido = await pedidoModel.deletaPedido(idPedido);

            if (resultadoDeletaPedido.affectedRows === 0) {
                return res.status(500).json({
                    message: "Falha interna ao excluir o pedido.",
                });
            }

            res.status(200).json({
                message: "Pedido excluído!.",
                idPedido: idPedido
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Ocorreu um erro no servidor ao tentar deletar o pedido.",
                errorMessage: error.message || error,
            });
        }
    },
    updateItemPedidos: async (req, res) => {
        try {
            const idPedido = Number(req.params.idPedido);
            const { distancia, peso_carga } = req.body; 

            if (isNaN(idPedido) || idPedido <= 0) {
                return res.status(400).json({ message: 'ID do Pedido inválido.' });
            }
            if (!distancia && !peso_carga) {
                return res.status(400).json({ message: 'Forneça um campo para alteração (distancia ou peso_carga)' });
            }
            const pedidoAtual = await pedidoModel.selectPedidoById(idPedido); 
            if (pedidoAtual.length === 0) {
                return res.status(404).json({ message: 'Pedido não localizado.' });
            }
            const statusEntrega = pedidoAtual[0].status_entrega;
            if (statusEntrega === 'em transito' || statusEntrega === 'entregue') {
                 return res.status(403).json({
                    message: `Não da para alterar seu pedido. Status atual: ${statusEntrega}.`,
                });
            }
            const resultUptade = await pedidoModel.updateItemPedido(idPedido, distancia, peso_carga);
            if (resultUptade.affectedRows === 1 && resultUptade.changedRows === 0){
                return res.status(200).json({message: 'Não há alterações a serem feitas.'});
            }
            if (resultUptade.affectedRows === 1 && resultUptade.changedRows > 0){
                return res.status(200).json({message: 'Registro alterado!'});
            }
            return res.status(500).json({message: 'Ocorreu um erro ao tentar alterar o pedido.'});

        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                message: "Ocorreu um erro no servidor ao tentar atualizar o pedido.", 
                errorMessage: error.message || error,
            });
        }
    },
};

module.exports = { pedidoController };