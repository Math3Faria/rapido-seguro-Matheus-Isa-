const express = require('express');
const router = express.Router();
const { clienteRoutes } = require('../routes/clienteRoutes')
const { pedidoRoutes } = require('../routes/pedidoRoutes')
const { entregaRoutes } = require('../routes/entregaRoutes')

router.use('/', clienteRoutes)
router.use('/', entregaRoutes)
router.use('/', pedidoRoutes)

router.use((req, res) => {
    res.status(404).json({ message: 'Pagina não encontrada' })
})

module.exports = { router };