const { clienteModel } = require("../models/clienteModel");
const axios = require("axios");

/**
 * @description Função auxiliar que consulta informações de endereço a partir de um CEP usando a API ViaCEP.
 * @async
 * @function buscarCep
 * @param {string} cep - O CEP a ser consultado (com ou sem pontuação).
 * @returns {Promise<{erro: boolean, mensagem?: string, endereco?: Object}>}
 * Retorna { erro: true, mensagem } em caso de falha, ou { erro: false, endereco } com os dados do local.
 * @private
 */
async function buscarCep(cep) {
    cep = cep.replace(/\D/g, "");

    if (!cep || !/^[0-9]{8}$/.test(cep)) {
        return { erro: true, mensagem: `Formato de CEP inválido: ${cep}.` };
    }

    try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

        if (data.erro) {
            return { erro: true, mensagem: `O CEP ${cep} não foi encontrado.` };
        }

        return {
            erro: false,
            endereco: {
                logradouro: data.logradouro,
                bairro: data.bairro,
                cidade: data.localidade,
                uf: data.uf,
                ibge: data.ibge
            }
        };

    } catch (error) {
        return { erro: true, mensagem: `Erro ao consultar o CEP ${cep}.` };
    }
}

const clienteController = {

    /**
     * @description Retorna todos os clientes cadastrados.
     * Rota: **GET /clientes**
     * @async
     * @function selecionaCliente
     * @returns {JSON} Lista de clientes ou mensagem de ausência de dados.
     */
    selecionaCliente: async (req, res) => {
        try {
            const resultado = await clienteModel.selecionaCliente();

            if (resultado.length === 0) {
                return res.status(200).json({ message: "A consulta não retornou resultados" });
            }

            return res.status(200).json({
                message: "Dados da tabela clientes",
                data: resultado
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Erro interno do servidor",
                errorMessage: error.message
            });
        }
    },

    /**
     * @description Adiciona um novo cliente, verificando CEP, inserindo cliente + telefones + endereços.
     * Rota: **POST /clientes**
     * @async
     * @function adicionaCliente
     * @returns {JSON} Mensagem de sucesso ou erro.
     */
    adicionaCliente: async (req, res) => {
        try {
            const { nome, cpf, email, telefones, enderecos } = req.body;

            if (!nome || !cpf || !email || !telefones || !enderecos) {
                return res.status(400).json({
                    message: "Confira se escreveu tudo corretamente, está faltando algo."
                });
            }

            const enderecosCompletos = [];

            for (const endereco of enderecos) {
                const { cep, numero, complemento } = endereco;

                const resultadoCep = await buscarCep(cep);
                if (resultadoCep.erro) {
                    return res.status(400).json({ message: resultadoCep.mensagem });
                }

                const dadosCep = resultadoCep.endereco;

                enderecosCompletos.push({
                    cep,
                    numero,
                    complemento: complemento || "",
                    logradouro: dadosCep.logradouro,
                    bairro: dadosCep.bairro,
                    cidade: dadosCep.cidade,
                    estado: dadosCep.uf,
                    ibge: dadosCep.ibge
                });
            }

            const resultado = await clienteModel.insertCliente(
                nome,
                cpf,
                email,
                telefones,
                enderecosCompletos
            );

            res.status(201).json({
                message: "O cliente foi cadastrado",
                clienteId: resultado.insertId
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Teve um erro dentro do código😭, verifique se teve algum dado pessoal inserido corretamente(algum valor pode ja existir no banco de dados)."
            });
        }
    },

    /**
     * @description Exclui um cliente pelo ID. Remove também telefones e endereços (processo transacional).
     * Rota: **DELETE /clientes/:idCliente**
     * @async
     * @function deletaCliente
     * @returns {JSON} Confirmação da exclusão ou mensagem de erro.
     */
    deletaCliente: async (req, res) => {
        try {
            const idCliente = Number(req.params.idCliente);

            if (!idCliente || !Number.isInteger(idCliente)) {
                return res.status(400).json({
                    message: "O id está errado. Informe um id existente e tente novamente."
                });
            }

            const clienteSelecionado = await clienteModel.selectById(idCliente);
            if (!clienteSelecionado) {
                return res.status(404).json({
                    message: "Não foi possível localizar este cliente no banco de dados."
                });
            }

            const resultado = await clienteModel.deleteCliente(idCliente);

            if (resultado.affectedRows === 0) {
                return res.status(500).json({
                    message: "Não é possível excluir o cliente. Ele tem um pedido criado?"
                });
            }

            res.status(200).json({ message: "Cliente excluído!" });

        } catch (error) {
            console.error(error);

            if (error.code === "ER_ROW_IS_REFERENCED_2") {
                return res.status(409).json({
                    message: "Exclua primeiramente os pedidos deste cliente, depois exclua o cliente!"
                });
            }

            res.status(500).json({
                message: "Erro interno do servidor durante a exclusão. 😢",
                errorMessage: error.message
            });
        }
    },

    /**
     * @description Atualiza dados de um cliente (informações principais, telefones e/ou endereços) de forma transacional.
     * Valida duplicidade de CPF, email e telefones, e consulta CEP para endereços alterados/inseridos.
     * Rota: **PUT /clientes/:idCliente**
     * @async
     * @function alteraCliente
     * @returns {JSON} Mensagem de sucesso ou erro.
     */
    alteraCliente: async (req, res) => {
        try {
            const idCliente = Number(req.params.idCliente);
            const { nome, cpf, email, telefones, enderecos } = req.body;

            if (
                !idCliente ||
                !Number.isInteger(idCliente) ||
                (!nome && !cpf && !email && !telefones && !enderecos)
            ) {
                return res.status(400).json({
                    message: "Informe o id corretamente e pelo menos um campo para alterar!"
                });
            }

            const clienteAtual = await clienteModel.selectById(idCliente);

            if (!clienteAtual) {
                return res.status(404).json({ message: "Este cliente não foi encontrado!." });
            }

            const clienteData = clienteAtual;

            const novoNome = nome ?? clienteData.nome;
            const novoCpf = cpf ?? clienteData.cpf;
            const novoEmail = email ?? clienteData.email;
            const novoTelefone = telefones ?? clienteData.telefones;

            if (
                (cpf && cpf !== clienteData.cpf) ||
                (email && email !== clienteData.email) ||
                telefones
            ) {
                const clientes = await clienteModel.selecionaCliente();

                if (cpf && cpf !== clienteData.cpf) {
                    const cpfDuplicado = clientes.find(
                        c => c.cpf == cpf && c.idCliente !== idCliente
                    );
                    if (cpfDuplicado) {
                        return res.status(409).json({
                            message: "Ei, este CPF já foi cadastrado!"
                        });
                    }
                }

                if (email && email !== clienteData.email) {
                    const emailDuplicado = clientes.find(
                        c => c.email == email && c.idCliente !== idCliente
                    );
                    if (emailDuplicado) {
                        return res.status(409).json({
                            message: "Este email já foi cadastrado!"
                        });
                    }
                }

                if (telefones) {
                    const telefoneDuplicado = clientes.find(
                        c => c.telefones == telefones && c.idCliente !== idCliente
                    );
                    if (telefoneDuplicado) {
                        return res.status(409).json({
                            message: "Este número de telefone já foi cadastrado!"
                        });
                    }
                }
            }

            let enderecosCompletos = [];

            if (enderecos) {
                for (const endereco of enderecos) {
                    const { cep, numero, complemento, idEndereco } = endereco;

                    if (!cep || !numero) {
                        return res.status(400).json({
                            message: "O CEP e o número são obrigatórios para incluir ou alterar endereço!"
                        });
                    }

                    const resultadoCep = await buscarCep(cep);
                    if (resultadoCep.erro) {
                        return res.status(400).json({ message: resultadoCep.mensagem });
                    }

                    const dadosCep = resultadoCep.endereco;

                    enderecosCompletos.push({
                        idEndereco,
                        cep,
                        numero,
                        complemento: complemento || "",
                        logradouro: dadosCep.logradouro,
                        bairro: dadosCep.bairro,
                        cidade: dadosCep.cidade,
                        estado: dadosCep.uf,
                        ibge: dadosCep.ibge
                    });
                }
            }

            await clienteModel.updateCliente(
                idCliente,
                novoNome,
                novoCpf,
                novoEmail,
                novoTelefone,
                enderecosCompletos
            );

            res.status(200).json({
                message: "O cliente e os dados inseridos foram alterados corretamente!"
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Erro interno do servidor durante a alteração. 😞",
                errorMessage: error.message
            });
        }
    }
};

module.exports = { clienteController };
