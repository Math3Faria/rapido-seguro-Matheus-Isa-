const { entregaModel } = require("../models/entregaModel");

const entregaController = {

    selecionaEntrega: async (req, res) => {
        try {
            const resultado = await entregaModel.selecionaEntrega();
            if (resultado.length === 0) {
                return res.status(200).json({ message: "Não teve resultados na consulta de entregas." });
            }
            return res.status(200).json({ message: "Dados das entregas:", data: resultado });
        } catch (error) {
            console.error(error);
            res.status(500).json({message: "Erro interno do servidor!😭", errorMessage: error.message,
            });
        }
    },

    selectById: async (req, res) => {
        try {
            const idEntrega = Number(req.params.idEntrega);

            if (!idEntrega || !Number.isInteger(idEntrega)) {
                return res.status(400).json({message: "O id precisa ser um numero inteiro!",
                });
            }
            const resultado = await entregaModel.selectById(idEntrega);

            if (!resultado) {return res.status(404).json({ message: "Entrega nao encontrada!." });
            }

            return res.status(200).json({ message: `Dados da Entrega ${idEntrega} `, data: resultado });
        } catch (error) {
            console.error(error);
            res.status(500).json({message: "Erro interno do servidor!😭", errorMessage: error.message,
            });
        }
    },

    adicionaEntrega: async (req, res) => {
        try {
            const { idPedido, tipo_entrega } = req.body;

            if (!idPedido || !tipo_entrega) {
                return res.status(400).json({message: "Faltando 'idPedido' ou 'tipo_entrega'.",
                });
            }

            const tiposValidos = ["Normal", "Urgente"];
            if (!tiposValidos.includes(tipo_entrega)) {
                return res.status(400).json({message: "O 'tipo_entrega' deve ser 'Normal' ou 'Urgente'.",
                });
            }

            const resultadoInsert = await entregaModel.insertEntrega(idPedido, tipo_entrega);
            const novaEntregaId = resultadoInsert.insertId;

            await entregaModel.calculosEntrega(novaEntregaId);

            const entregaFinal = await entregaModel.selectById(novaEntregaId);

            res.status(201).json({message: "Entrega cadastrada e valores calculados com sucesso!", idEntrega: novaEntregaId, dadosCalculados: entregaFinal
            });
        } catch (error) {console.error(error);res.status(500).json({ message: "Erro interno ao cadastrar/calcular a entrega. 😭" });
        }
    },


    alteraStatusEntrega: async (req, res) => {
        try {
            const idEntrega = Number(req.params.idEntrega);
            const { status_entrega } = req.body;

            if (!idEntrega || !status_entrega) {
                return res.status(400).json({message: "ID da entrega ou 'status_entrega' é obrigatório.",
                });
            }

            const statusValidos = ["calculando", "em transito", "entregue", "cancelado"];
            if (!statusValidos.includes(status_entrega)) {return res.status(400).json({ message: `Status inválido. Use um dos seguintes: {calculando, em transito, entregue, cancelado} `});
            }

            const resultado = await entregaModel.updateStatus(idEntrega, status_entrega);

            if (resultado.affectedRows === 0) {return res.status(404).json({ message: "Entrega não encontrada ou status já era o mesmo." });
            }

            res.status(200).json({message:  `Status da Entrega ${idEntrega} atualizado para ${status_entrega}`});
        } catch (error) {console.error(error);
            res.status(500).json({message: "Erro interno do servidor ao alterar o status. 😞", errorMessage: error.message,
            });
        }
    },
    adicionaEntrega: async (req, res) => {
    try {
        const { idPedido, tipo_entrega } = req.body;

        if (!idPedido || !tipo_entrega) {
            return res.status(400).json({message: "Faltando 'idPedido' ou 'tipo_entrega'."});
        }

        const tiposValidos = ["Normal", "Urgente"];
        if (!tiposValidos.includes(tipo_entrega)) {
            return res.status(400).json({message: "O 'tipo_entrega' deve ser 'Normal' ou 'Urgente'."});
        }

   
        const resultadoInsert = await entregaModel.insertEntrega(idPedido, tipo_entrega);
        const novaEntregaId = resultadoInsert.insertId;

        await entregaModel.calculosEntrega(novaEntregaId);

        const entregaFinal = await entregaModel.selectById(novaEntregaId);

        res.status(201).json({
            message: "Entrega cadastrada e valores calculados com sucesso!",
            idEntrega: novaEntregaId,
            dadosCalculados: entregaFinal
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno ao cadastrar/calcular a entrega. 😭" });
    }
    },

    recalculaEntrega: async (req, res) => {
        try {
            const idEntrega = Number(req.params.idEntrega);

            if (!idEntrega || !Number.isInteger(idEntrega)) {
                return res.status(400).json({message: "ID de entrega inválido. Informe um número inteiro.",
                });
            }

            const entregaExistente = await entregaModel.selectById(idEntrega);
            if (!entregaExistente) {
                return res.status(404).json({ message: "Entrega não encontrada para recalcular." });
            }

            await entregaModel.calculosEntrega(idEntrega);

            const entregaRecalculada = await entregaModel.selectById(idEntrega);

            res.status(200).json({ message: `Valores da Entrega ${idEntrega} recalculados com sucesso!,dadosRecalculados: entregaRecalculada` });
        } catch (error) {
            console.error(error);
            res.status(500).json({message: "Erro interno do servidor ao recalcular a entrega. 😢", errorMessage: error.message,
            });
        }
    },

    deletaEntrega: async (req, res) => {
        try {
            const idEntrega = Number(req.params.idEntrega);

            if (!idEntrega || !Number.isInteger(idEntrega)) {
                return res.status(400).json({message: "ID de entrega inválido. Informe um número inteiro.",
                });
            }

            const entregaSelecionada = await entregaModel.selectById(idEntrega);
            if (!entregaSelecionada) {
                return res.status(404).json({ message: "Não foi possível localizar esta entrega." });
            }

            const resultado = await entregaModel.deleteEntrega(idEntrega);

            if (resultado.affectedRows === 0) {
                return res.status(500).json({ message: "Falha ao excluir a entrega.", });
            }

            res.status(200).json({ message: "Entrega excluída com sucesso!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({message: "Erro interno do servidor durante a exclusão.", errorMessage: error.message,
            });
        }
    },  

};

module.exports = { entregaController };