import fs from 'fs-extra'
import path from 'path'
import { logger } from './Winston'
import toml from 'toml'

let filePath = path.resolve(process.cwd(), '.env.toml')
let defaultPath = path.resolve(process.cwd(), '.env.default.toml')

let jsonConfig
if (fs.existsSync(filePath)) {
	jsonConfig = filePath
} else if (fs.existsSync(defaultPath)) {
	jsonConfig = defaultPath
	logger.warn('Using default enviroment config')
} else {
	throw new Error('Environment file not found')
}

const jsonString = fs.readFileSync(jsonConfig, {
	encoding: 'utf8'
})

const envConfig = toml.parse(jsonString)
process.myEnv = {}

for (let key of Object.keys(process.env)) {
	recursiveMake(key)
}
process.myEnv = { ...envConfig, ...process.myEnv }

function recursiveMake(key) {
	let array = key.split('_')
	for (let [i, part] of array.entries()) {
		if (i == array.length - 1) {
			index(process.myEnv, array, process.env[key])
		}
	}
}

function index(obj, is, value) {
	if (typeof is === 'string') {
		return index(obj, is.split(''), value)
	} else if (is.length == 1 && value !== undefined && typeof obj[is[0]] === undefined) {
		return (obj[is[0]] = value)
	} else if (is.length == 0) {
		return obj
	} else {
		if (obj[is[0]] == undefined) {
			obj[is[0]] = {}
		}
		return index(obj[is[0]], is.slice(1), value)
	}
}
