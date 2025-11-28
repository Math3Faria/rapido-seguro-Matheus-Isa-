const express = require("express");
const clienteRoutes = express.Router();
const { clienteController } = require("../controllers/clienteController");

clienteRoutes.post("/clientes", clienteController.adicionaCliente);

module.exports = { clienteRoutes };
