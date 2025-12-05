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
    calculosEntrega: async (pIdEntrega) => {
        const connection = await pool.getConnection();
    
        try {
            await connection.beginTransaction();

            const sqlSelect = `
                select p.distancia, p.valorbase_km, p.peso_carga, p.valorbase_kg, e.tipo_entrega
                from Entregas e
                join Pedidos p on e.idPedido = p.idPedido
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
                set valor_distancia = ?, valor_peso = ?, acrescimo = ?, desconto = ?, taxa_extra = ?, valor_final = ?, status_entrega = 'em transito' where idEntrega = ?;`;
            const values = [valorDistancia, valorPeso, acrescimo, desconto, taxaExtra, valorFinal, pIdEntrega];
            const [result] = await connection.query(sqlUpdate, values);
            await connection.commit();
            return result;
    
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

};

module.exports = { entregaController };