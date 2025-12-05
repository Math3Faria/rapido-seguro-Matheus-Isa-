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
      endereco: {
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        uf: data.uf,
        ibge: data.ibge,
      },
    };
  } catch (error) {
    return { erro: true, mensagem: `Erro ao consultar o CEP ${cep}.` };
  }
}

const clienteController = {
  selecionaCliente: async (req, res) => {
    try {
      const resultado = await clienteModel.selecionaCliente();
      if (resultado.length === 0) {
        return res.status(200).json({ message: "A consulta não retornou resultados" });
      }
      return res.status(200).json({ message: "Dados da tabela clientes", data: resultado });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Erro interno do servidor", errorMessage: error.message,
      });
    }
  },

  adicionaCliente: async (req, res) => {
    try {
      const { nome, cpf, email, telefones, enderecos } = req.body;

      if (!nome || !cpf || !email || !telefones || !enderecos) {
        return res.status(400).json({
          message: "Confira se escreveu tudo corretamente, esta faltando algo.",
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

        enderecosCompletos.push({ cep, numero, complemento: complemento || "", logradouro: dadosCep.logradouro, bairro: dadosCep.bairro, cidade: dadosCep.cidade, estado: dadosCep.uf, ibge: dadosCep.ibge, });
      }

      const resultado = await clienteModel.insertCliente(nome, cpf, email, telefones, enderecosCompletos);

      res.status(201).json({
        message: "O cliente foi cadastrado", clienteId: resultado.insertId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Teve um erro dentro do código😭." });
    }
  },
  deletaCliente: async (req, res) => {
    try {
      const idCliente = Number(req.params.idCliente);

      if (!idCliente || !Number.isInteger(idCliente)) {
        return res.status(400).json({
          message: "O id esta errado. Diga um id existente e tente novamente",
        });
      }

      const clienteSelecionado = await clienteModel.selectById(idCliente);
      if (clienteSelecionado.length === 0) {
        return res.status(404).json({ message: "Não foi possivel localizar este cliente no banco de dados" });
      }
      const resultado = await clienteModel.deleteCliente(idCliente);

      if (resultado.affectedRows === 0) {
        return res.status(500).json({
          message: "Não é possivel excluir o cliente. Ele tem um pedido criado?",
        });
      }

      res.status(200).json({ message: "Cliente excluído!" });
    } catch (error) {
      console.error(error);
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          message: "Exclua primeiramente os pedidos deste cliente, depois exclua o cliente!",
        });
      }
      res.status(500).json({
        message: "Erro interno do servidor durante a exclusão. 😢", errorMessage: error.message,
      });
    }
  },

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
          message: "Diga o id do cliente corretamente e pelo menos um campo para alterar!",
        });
      }

      const clienteAtual = await clienteModel.selectById(idCliente);
      if (clienteAtual.length === 0) {
        return res.status(404).json({ message: "Este cliente não foi encontrado!." });
      }

      const clienteData = clienteAtual[0];

      const novoNome = nome ?? clienteData.nome;
      const novoCpf = cpf ?? clienteData.cpf;
      const novoEmail = email ?? clienteData.email;
      const novoTelefone = telefones ?? clienteData.telefones;

      if ((cpf && cpf !== clienteData.cpf) || (email && email !== clienteData.email)) {
        const clientes = await clienteModel.selecionaCliente();

        if (cpf && cpf !== clienteData.cpf) {
          const cpfDuplicado = clientes.find(
            (c) => c.cpf == cpf && c.idCliente !== idCliente
          );
          if (cpfDuplicado) {
            return res.status(409).json({ message: "Ei, este cpf ja foi cadastrado!", });
          }
        }

        if (email && email !== clienteData.email) {
          const emailDuplicado = clientes.find(
            (c) => c.email == email && c.idCliente !== idCliente
          );
          if (emailDuplicado) {
            return res.status(409).json({ message: "Este email ja foi cadastrado!", });
          }
        }
        
        if (telefones && telefones !== clienteData.telefones) {
          const telefonesDuplicado = clientes.find(
            (c) => c.telefones == telefones && c.idCliente !== idCliente
          );
          if (telefonesDuplicado) {
            return res.status(409).json({ message: "Este numero de telefone ja foi cadastrado!", });
          }
        }
      }

      let enderecosCompletos = [];
      if (enderecos) {
        for (const endereco of enderecos) {
          const { cep, numero, complemento } = endereco;
          const idEndereço = endereco.idEndereço;

          if (!cep) {
            return res.status(400).json({ message: "O cep é obrigatório tanto para incluir ou alterar endereço!", });
          }

          const resultadoCep = await buscarCep(cep);
          if (resultadoCep.erro) {
            return res.status(400).json({ message: resultadoCep.mensagem });
          }

          const dadosCep = resultadoCep.endereco;
          enderecosCompletos.push({ idEndereço, cep, numero, complemento: complemento || "", logradouro: dadosCep.logradouro, bairro: dadosCep.bairro, cidade: dadosCep.cidade, estado: dadosCep.uf, ibge: dadosCep.ibge, });
        }
      }

      const resultado = await clienteModel.updateCliente(idCliente, novoNome, novoCpf, novoEmail, novoTelefone, telefones, enderecosCompletos);
      if (resultado.affectedRows === 0) {
        return res.status(200).json({
          message: "Nada foi alterado nos dados principais do cliente",
        });
      }

      res.status(200).json({ message: "O cliente e os dados inseridos foram alterados corretamente!.", });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro interno do servidor durante a alteração. 😞", errorMessage: error.message, });
    }
  },
};

module.exports = { clienteController };
