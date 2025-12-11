const express = require("express");
const pedidoRoutes = express.Router();
const { pedidoController } = require("../controllers/pedidoController");

pedidoRoutes.get("/pedidos", pedidoController.selecionaPedido);
pedidoRoutes.post("/pedidos", pedidoController.criarPedido);
pedidoRoutes.put("/pedidos/:idPedido", pedidoController.updateItemPedidos);
pedidoRoutes.delete("/pedidos/:idPedido", pedidoController.deletaPedidos);
pedidoRoutes.put("/pedidos/calcular", pedidoController.atualizarValoresPedido);

module.exports = { pedidoRoutes };
