import './utils/Environment'
import 'express-async-errors'
import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import routes from './indexes/Routes'
import server from 'http'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import fs from 'fs-extra'
import { logger, stream } from './utils/Winston'
import { SocketService } from './indexes/Services'
import apinotation from 'apinotation'
import { ExceptionMiddleware } from './indexes/Middlewares'
import session from 'express-session'
import sessionMongo from 'connect-mongo'
import { addColors } from 'winston'

const { api, database, frontEnd, debug, auth } = process.myEnv

const app = express()
const MongoStore = sessionMongo(session)

let devCors = ['http://localhost:8080']
let finalCors = [frontEnd.path]

if (debug === true) {
	finalCors = [...devCors, ...finalCors]
}

mongoose
	.connect(`mongodb+srv://${database.user}:${database.password}@${database.host}/${database.name}`, {
		user: database.user,
		pass: database.password,
		useCreateIndex: true,
		useNewUrlParser: true,
		useFindAndModify: false,
		useUnifiedTopology: true
	})
	.then(() => {
		// console.log('')
	})
	.catch(e => {
		// console.log('ruim', e)
	})

app.use(
	session({
		secret: auth.secret,
		saveUninitialized: true,
		resave: false,
		rolling: false,
		cookie: {
			secure: false,
			httpOnly: true,
			domain: 'localhost',
			maxAge: 10 * 24 * 60 * 60 * 1000
		},
		store: new MongoStore({ mongooseConnection: mongoose.connection })
	})
)

app.use(cors({ origin: finalCors, credentials: true }))

app.use(morgan('dev', { stream }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/public', express.static('public'))

routes(app)

app.use(ExceptionMiddleware)

let serverImpl = server.createServer(app)
SocketService.initWebSockets(serverImpl)

serverImpl.listen(api.port || 3000, '0.0.0.0', () => {
	logger.info(`Server up and running at port ${api.port || 3000}`)
})

fs.emptyDirSync('store/temp')

// app.use('/doc', express.static(apinotation('./src', {}, 'store/temp/apinotation')))
