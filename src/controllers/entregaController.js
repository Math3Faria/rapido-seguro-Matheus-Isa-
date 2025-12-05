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

    

};

module.exports = { entregaController };