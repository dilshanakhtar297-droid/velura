import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import productsRouter from './routes/products'

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.use('/products', productsRouter)

app.get('/', (req, res) => res.send({ok:true, message: 'Velura API'}))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`API listening on ${PORT}`))
