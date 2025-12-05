const express = require("express");
const entregaRoutes = express.Router();
const { entregaController } = require("../controllers/entregaController");

entregaRoutes.get("/entregas", entregaController.selecionaEntrega);
entregaRoutes.post("/entregas", entregaController.adicionaEntrega);

module.exports = { entregaRoutes };
