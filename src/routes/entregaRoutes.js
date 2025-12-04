const express = require("express");
const entregaRoutes = express.Router();
const { entregaController } = require("../controllers/entregaController");

entregaRoutes.get("/entregas", entregaController.selecionaEntrega);
// entregaRoutes.post("/entregas", entregaController.adicionaEntrega);
// entregaRoutes.put("/entregas/:idEntrega", entregaController.alteraEntrega);
// entregaRoutes.delete("/entregas/:idEntrega", entregaController.deletaEntrega);
module.exports = { entregaRoutes };
