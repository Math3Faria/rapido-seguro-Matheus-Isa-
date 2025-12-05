const express = require("express");
const pedidoRoutes = express.Router();
const { pedidoController } = require("../controllers/pedidoController");

pedidoRoutes.get("/pedidos", pedidoController.selecionaPedido); 
pedidoRoutes.post("/pedidos", pedidoController.criarPedido);
pedidoRoutes.put("/pedidos/:idPedido", pedidoController.updateItemPedidos); 
pedidoRoutes.delete("/pedidos/:idPedido", pedidoController.deletaPedidos);
entregaRoutes.put("/entregas/:idEntrega", entregaController.alteraStatusEntrega);
entregaRoutes.delete("/entregas/:idEntrega", entregaController.deletaEntrega);1
module.exports = { pedidoRoutes };