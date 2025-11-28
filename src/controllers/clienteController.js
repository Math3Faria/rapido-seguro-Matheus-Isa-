const { clienteModel } = require("../models/clienteModel");
const axios = require("axios");

function limparEndereco() {
    return {
        logradouro: "",
        bairro: "",
        cidade: "",
        uf: "",
        ibge: ""
    };
}

async function buscarCep(cep) {
    cep = cep.replace(/\D/g, "");

    if (!cep || !/^[0-9]{8}$/.test(cep)) {
        return { erro: true, mensagem: `Formato de CEP inválido: ${cep}.` };
    }

    try {
        const url = `https://viacep.com.br/ws/${cep}/json/`;
        const { data } = await axios.get(url);

        if (data.erro) {
            return { erro: true, mensagem:` CEP ${cep} não encontrado.` };
        }
        return {
            erro: false,
            endereco: { logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf, ibge: data.ibge}
        };
    } catch (error) {
        console.error(`Erro ao consultar o CEP ${cep}:`, error.message);
        return { erro: true, mensagem: `Erro ao consultar o CEP ${cep} no ViaCEP.` };
    }
}

const clienteController = {


};

module.exports = { clienteController };