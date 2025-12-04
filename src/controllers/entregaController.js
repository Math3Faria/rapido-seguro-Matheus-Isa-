const { entregaModel } = require("../models/entregaModel");

const entregaController = {
    selecionaEntrega: async (req, res) => {
        try {
            const resultado = await entregaModel.selecionaEntrega();
            if (resultado.length === 0) {
                return res.status(200).json({ message: "A consulta não retornou resultados" });
            }
            return res.status(200).json({ message: "Dados da tabela entregas", data: resultado });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Erro interno do servidor", errorMessage: error.message,
            });
        }
    },
};

module.exports = { entregaController };