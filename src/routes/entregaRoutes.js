const express = require("express");
const entregaRoutes = express.Router();
const { entregaController } = require("../controllers/entregaController");

entregaRoutes.get("/entregas", entregaController.selecionaEntrega);
entregaRoutes.put("/entregas/:idEntrega", entregaController.alteraStatusEntrega);
entregaRoutes.patch("/entregas/:idEntrega", entregaController.patchEntrega);
entregaRoutes.delete("/entregas/:idEntrega", entregaController.deletaEntrega);
module.exports = { entregaRoutes };