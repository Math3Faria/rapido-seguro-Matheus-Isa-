const { pool } = require("../config/db");

const clienteModel = {
  selecionaCliente: async () => {
    const sql = "select * from clientes;";
    const [rows] = await pool.query(sql);
    return rows;
  },
  selectById: async (pId) => {
    const sql = "select * from clientes;";
    const values = [pId];
    const [rows] = await pool.query(sql);
    return rows;
  },
  insertCliente: async (pNomeCliente, pCpfCliente) => {
    const sql =
      "insert into clientes (nome_cliente, cpf_cliente) values (?,?);";
    const values = [pNomeCliente, pCpfCliente];
    const [rows] = await pool.query(sql, values);
    return rows;
  },

  updateCliente: async (pId, pNomeCliente, pCpf) => {
    const sql =
      "update clientes set nome_cliente=?, cpf_cliente=? where id_cliente=?;";
    const values = [pNomeCliente, pCpf, pId];
    const [rows] = await pool.query(sql, values);
    return rows;
  },
  deleteCliente: async (pId) => {
    const sql = "delete from clientes where id_cliente = ?;";
    const values = [pId];
    const [rows] = await pool.query(sql, values);
    return rows;
  },
  updateCliente: async (idCliente, novoNome, novoCpf, novoEmail, telefones, enderecosCompletos) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const sqlUpdateCliente = "update Clientes set nome = ?, cpf = ?, email = ? where idCliente = ?;";
      const [resultCliente] = await connection.query(sqlUpdateCliente, [novoNome, novoCpf, novoEmail, idCliente]);

      if (telefones) {
        await connection.query("delete from Telefones where idCliente = ?;", [idCliente]);

        if (telefones.length > 0) {
          const sqlTelefones = "insert into Telefones (numero, idCliente) values ?";
          const valuesTelefones = telefones.map(tel => [tel.numero, idCliente]);
          await connection.query(sqlTelefones, [valuesTelefones]);
        }
      }

      if (enderecosCompletos) {
        const idsEnderecosPresentes = enderecosCompletos.filter(e => e.idEndereço).map(e => e.idEndereço);

        if (idsEnderecosPresentes.length > 0) {
             const sqlDelete = `delete from Enderecos where idCliente = ? and idEndereço not in (?)`;
             await connection.query(sqlDelete, [idCliente, idsEnderecosPresentes]);
        } else {
             await connection.query("delete from Enderecos where idCliente = ?;", [idCliente]);
        }

        for (const end of enderecosCompletos) {
          if (end.idEndereço) {

            const sqlUpdate = `update Enderecos set logradouro=?, numero=?, bairro=?, complemento=?, cidade=?, estado=?, cep=? where idEndereço=? and idCliente=?`;
            const updateValues = [end.logradouro, end.numero, end.bairro, end.complemento, end.cidade, end.estado, end.cep, end.idEndereço, idCliente];
            await connection.query(sqlUpdate, updateValues);
          } else {
 
            const sqlInsert = `insert into Enderecos (idCliente, logradouro, numero, bairro, complemento, cidade, estado, cep) values (?, ?, ?, ?, ?, ?, ?, ?);`;
            const insertValues = [idCliente, end.logradouro, end.numero, end.bairro, end.complemento, end.cidade, end.estado, end.cep];
            await connection.query(sqlInsert, insertValues);
          }
        }
      }

      await connection.commit();
      return resultCliente;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },


  deleteCliente: async (idCliente) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.query("delete from Telefones where idCliente = ?;", [idCliente]);
      await connection.query("delete from Enderecos where idCliente = ?;", [idCliente]);
      const sqlCliente = "delete from Clientes where idCliente = ?;";
      const [resultCliente] = await connection.query(sqlCliente, [idCliente]);
      await connection.commit();
      return resultCliente;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

module.exports = { clienteModel };