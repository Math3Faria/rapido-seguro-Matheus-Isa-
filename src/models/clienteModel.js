const { pool } = require("../config/db");

const clienteModel = {
  selectAll: async () => {
    const sql = "SELECT * FROM clientes;";
    const [rows] = await pool.query(sql);
    return rows;
  },

  insertCliente: async (pNome, pCpf, pEmail, pTelefones, pEnderecos) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const sqlCliente = "INSERT INTO clientes (nome, cpf, email) VALUES (?, ?, ?);";
      const valuesCliente = [pNome, pCpf, pEmail];
      const [rowsCliente] = await connection.query(sqlCliente, valuesCliente);
      const idCliente = rowsCliente.insertId;

      if (pTelefones && pTelefones.length > 0) {
        for (const telefone of pTelefones) {
          const sqlTelefone = "INSERT INTO telefones (id_cliente, numero) VALUES (?, ?);";
          const valuesTelefone = [idCliente, telefone];
          await connection.query(sqlTelefone, valuesTelefone);
        }
      }

      if (pEnderecos && pEnderecos.length > 0) {
        for (const endereco of pEnderecos) {
          const sqlEndereco = `INSERT INTO enderecos (logradouro, numero, bairro, complemento, cidade, estado, cep, id_cliente,) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;
          const valuesEndereco = [pLogradouro,pNumero,pBairro,pComplemento,pCidade,pEstado, pCep, pIdCliente];
          await connection.query(sqlEndereco, valuesEndereco);
        }
      }

      await connection.commit();
      return rowsCliente;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

module.exports = { clienteModel };