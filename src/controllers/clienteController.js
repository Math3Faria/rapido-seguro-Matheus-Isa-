const { clienteModel } = require("../models/clienteModel");
const axios = require("axios");

async function buscarCep(cep) {
  cep = cep.replace(/\D/g, "");

  if (!cep || !/^[0-9]{8}$/.test(cep)) {
    return { erro: true, mensagem: `Formato de CEP inválido: ${cep}.` };
  }

  try {
    const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

    if (data.erro) {
      return { erro: true, mensagem: `Este CEP ${cep} não foi encontrado.` };
    }

    return {
      erro: false,
      endereco: {logradouro: data.logradouro,bairro: data.bairro,cidade: data.localidade,uf: data.uf,ibge: data.ibge}
    };
  } catch (error) {
    return { erro: true, mensagem: `Erro ao consultar o CEP ${cep}.` };
  }
}

const clienteController = {
  adicionaCliente: async (req, res) => {
    try {
      const { nome, cpf, email, telefones, enderecos } = req.body;

      if (!nome || !cpf || !email || !telefones || !enderecos) {
        return res.status(400).json({
          message: "Confira se escreveu tudo corretamente, esta faltando algo."
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

        enderecosCompletos.push({cep, numero, complemento: complemento || "",logradouro: dadosCep.logradouro, bairro: dadosCep.bairro, cidade: dadosCep.cidade, estado: dadosCep.uf, ibge: dadosCep.ibge
        });
      }

      const resultado = await clienteModel.insertCliente(
        nome, cpf, email, telefones, enderecosCompletos
      );

      res.status(201).json({
        message: "O cliente foi cadastrado",
        clienteId: resultado.insertId
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Teve um erro dentro do código😭." });
    }
  }
};

module.exports = { clienteController };