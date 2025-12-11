const { pool } = require("../config/db");

const clienteModel = {

    /**
     * @description Seleciona todos os clientes com seus telefones e endereços
     * @returns {Promise<Array<Object>>} Lista de clientes com dados completos
     */
    selecionaCliente: async () => {

        const sql = `
        select
            c.idCliente,
            c.nome,
            c.email,
            c.cpf,

            e.logradouro,
            e.numero as numero_endereco,
            e.bairro,
            e.complemento,
            e.cidade,
            e.estado,
            e.cep,

            t.idTelefone,
            t.numero as telefone

        from Clientes c
        left join Telefones t on c.idCliente = t.idCliente
        left join Enderecos e on c.idCliente = e.idCliente
        order by c.idCliente, t.idTelefone, e.logradouro;
      `;
        const [rows] = await pool.query(sql);
        return rows;
    },

    /**
     * @description Seleciona um cliente pelo id
     * @param {number} pId - o id do cliente
     * @returns {Promise<Object|null>} Cliente encontrado ou null
     */
    selectById: async (pId) => {
        const sql = "select * from Clientes where idCliente = ?;";
        const [rows] = await pool.query(sql, [pId]);
        return rows.length > 0 ? rows[0] : null;
    },

    /**
     * @description Insere um novo cliente com telefones e endereços
     * @param {string} nome - nome do cliente
     * @param {string} cpf - cpf do cliente
     * @param {string} email - email do cliente
     * @param {Array<string>} telefones - lista de números de telefone
     * @param {Array<Object>} enderecos - lista de endereços
     * @returns {Promise<Object>} dados da inserção
     */
    insertCliente: async (nome, cpf, email, telefones, enderecos) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const sqlCliente = "insert into Clientes (nome, cpf, email) values (?, ?, ?);";
            const [resultCliente] = await connection.query(sqlCliente, [nome, cpf, email]);
            const idCliente = resultCliente.insertId;

            if (telefones && telefones.length > 0) {
                const sqlTelefones = "insert into Telefones (numero, idCliente) values ?";
                const valuesTelefones = telefones.map(numero => [numero, idCliente]);
                await connection.query(sqlTelefones, [valuesTelefones]);
            }

            if (enderecos && enderecos.length > 0) {
                const sqlEnderecos = `
                    insert into Enderecos (idCliente, logradouro, numero, bairro, complemento, cidade, estado, cep)
                    values (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                for (const e of enderecos) {
                    await connection.query(sqlEnderecos, [
                        idCliente,
                        e.logradouro,
                        e.numero,
                        e.bairro,
                        e.complemento,
                        e.cidade,
                        e.estado,
                        e.cep
                    ]);
                }
            }

            await connection.commit();
            return { message: "Cliente cadastrado com sucesso", insertId: idCliente };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * @description Atualiza um cliente parcialmente, incluindo telefones e endereços
     * @param {number} idCliente - id do cliente
     * @param {string} [nome] - nome
     * @param {string} [cpf] - cpf
     * @param {string} [email] - email
     * @param {Array<Object>} [telefones] - lista de telefones a alterar, inserir ou remover
     * @param {Array<Object>} [enderecos] - lista de endereços a alterar, inserir ou remover
     * @returns {Promise<Object>} mensagem de sucesso
     */
    updateCliente: async (idCliente, nome, cpf, email, telefones, enderecos) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            if (nome || cpf || email) {
                await connection.query(
                    "update Clientes set nome = ?, cpf = ?, email = ? where idCliente = ?;",
                    [nome, cpf, email, idCliente]
                );
            }

            if (telefones) {
                for (const tel of telefones) {
                    if (tel.remover === true && tel.idTelefone) {
                        await connection.query(
                            "delete from Telefones where idTelefone = ? and idCliente = ?",
                            [tel.idTelefone, idCliente]
                        );
                        continue;
                    }

                    if (tel.idTelefone) {
                        await connection.query(
                            "update Telefones set numero = ? where idTelefone = ? and idCliente = ?",
                            [tel.numero, tel.idTelefone, idCliente]
                        );
                    } else {
                        await connection.query(
                            "insert into Telefones (numero, idCliente) values (?, ?)",
                            [tel.numero, idCliente]
                        );
                    }
                }
            }

            if (enderecos) {
                for (const e of enderecos) {
                    if (e.remover === true && e.idEndereco) {
                        await connection.query(
                            "delete from Enderecos where idEndereco = ? and idCliente = ?",
                            [e.idEndereco, idCliente]
                        );
                        continue;
                    }

                    if (e.idEndereco) {
                        await connection.query(
                            `update Enderecos 
                             set logradouro = ?, numero = ?, bairro = ?, complemento = ?, cidade = ?, estado = ?, cep = ?
                             where idEndereco = ? and idCliente = ?`,
                            [
                                e.logradouro,
                                e.numero,
                                e.bairro,
                                e.complemento,
                                e.cidade,
                                e.estado,
                                e.cep,
                                e.idEndereco,
                                idCliente
                            ]
                        );
                    } else {
                        await connection.query(
                            `insert into Enderecos 
                             (idCliente, logradouro, numero, bairro, complemento, cidade, estado, cep)
                             values (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                idCliente,
                                e.logradouro,
                                e.numero,
                                e.bairro,
                                e.complemento,
                                e.cidade,
                                e.estado,
                                e.cep
                            ]
                        );
                    }
                }
            }

            await connection.commit();
            return { message: "Cliente atualizado" };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * @description Deleta um cliente e seus dados vinculados
     * @param {number} idCliente - id do cliente a excluir
     * @returns {Promise<Object>} resultado da operação
     */
    deleteCliente: async (idCliente) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            await connection.query("delete from Telefones where idCliente = ?;", [idCliente]);
            await connection.query("delete from Enderecos where idCliente = ?;", [idCliente]);

            const sqlCliente = "delete from Clientes where idCliente = ?;";
            const [result] = await connection.query(sqlCliente, [idCliente]);

            await connection.commit();
            return result;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = { clienteModel };
