import { createLogger, format, transports } from 'winston'
import chalk from 'chalk'
import 'winston-daily-rotate-file'
import 'colors'
import fs from 'fs-extra'
import os from 'os'

const { combine, timestamp, printf } = format

const username = os.userInfo().username
const logFolder = `/home/${username}/logs/num`

if (!fs.existsSync(logFolder)) {
	fs.mkdirSync(logFolder, { recursive: true })
}

function getColorized(level) {
	level = level.toUpperCase()
	switch (level) {
		case 'ERROR':
			return chalk.rgb(206, 12, 12).bold(level)
		case 'INFO':
			return chalk.rgb(0, 140, 0).bold(level)
		case 'WARN':
			return chalk.rgb(255, 140, 0).bold(level)
		default:
			return level.america.bold
	}
}

function handlePrintf({ level, message, timestamp, transport, colorize }) {
	if (process.myEnv && process.myEnv.debug && JSON.parse(process.myEnv.debug) === true) {
		if (message.exception) {
			let exception = message.exception

			if (transport === 'console') {
				console.error(exception)
				message = exception.toString()
			} else {
				try {
					message = exception.stack + '\n' + JSON.stringify({ [exception.name]: exception }, null, 2)
				} catch (error) {
					message = exception.stack + '\n' + 'could not stringify exception'
				}
			}
		}
	} else {
		if (message.exception) {
			message = message.exception.stack
		}
	}

	if (colorize) {
		return `${timestamp.blue.bold} ${getColorized(level)}: ${message}`
	} else {
		let result = `${timestamp} ${level.toUpperCase()}: ${message}`

		return result.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
	}
}

const fileConfig = {
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '5m',
	maxFiles: '14d'
}

let x = transports

export const logger = createLogger({
	level: 'info',
	exitOnError: false,
	format: combine(timestamp()),
	transports: [
		new x.DailyRotateFile({
			...fileConfig,
			filename: logFolder + '/app-%DATE%.log',
			format: printf(all => handlePrintf({ ...all, ...{ colorize: false, transport: 'file' } }))
		}),
		new x.DailyRotateFile({
			...fileConfig,
			filename: logFolder + '/app-colorized-%DATE%.log',
			format: printf(all => handlePrintf({ ...all, ...{ colorize: true, transport: 'file' } }))
		}),
		new transports.Console({
			format: printf(all => handlePrintf({ ...all, ...{ colorize: true, transport: 'console' } }))
		})
	]
})

export const stream = {
	write(message) {
		message = message.trim()
		logger.info(message)
	}
}
