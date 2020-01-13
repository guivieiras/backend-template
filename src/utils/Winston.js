import { createLogger, format, transports } from 'winston'
import { Loggly } from 'winston-loggly-bulk'
import 'winston-daily-rotate-file'
import 'colors'
import chalk from 'chalk'
import fs from 'fs-extra'
import os from 'os'
import * as Sentry from '@sentry/node'

const { debug, loggly, sentry } = process.myEnv

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

const handlePrintf = format((info, opts) => {
	let { level, message, timestamp, stack } = info
	let { transport, colorize } = opts

	if (stack) {
		message = stack

		if (debug) {
			try {
				delete info.stack
				delete info.timestamp
				delete info.level
				message += '\n' + JSON.stringify(info, null, 2)
			} catch (error) {
				//Ignore
			}
		}
	}
	if (colorize) {
		info.message = `${timestamp.blue.bold} ${getColorized(level)}: ${message}`
	} else {
		info.message = `${timestamp} ${level.toUpperCase()}: ${message}`
	}
	return info
})
Sentry.init({ dsn: sentry.dsn })

const serializeError = format((info, opts) => {
	if (info instanceof Error) {
		Sentry.captureException(info)
		info = { ...info, stack: info.stack }
	}
	return info
})

function getFormat(options) {
	return combine(
		handlePrintf(options),
		printf(i => i.message)
	)
}

const fileConfig = {
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '5m',
	maxFiles: '14d'
}

export const logger = createLogger({
	level: 'info',
	exitOnError: false,
	format: combine(timestamp(), serializeError()),
	transports: [
		new transports.DailyRotateFile({
			...fileConfig,
			filename: logFolder + '/app-%DATE%.log',
			format: getFormat({ colorize: false, transport: 'file' })
		}),
		new transports.DailyRotateFile({
			...fileConfig,
			filename: logFolder + '/app-colorized-%DATE%.log',
			format: getFormat({ colorize: true, transport: 'file' })
		}),
		new transports.Console({
			format: getFormat({ colorize: true, transport: 'console' })
		}),
		new transports.Loggly({
			subdomain: loggly.subdomain,
			token: loggly.token,
			tags: ['Backend-Template'],
			json: true
		})
	]
})

export const stream = {
	write(message) {
		message = message.trim()
		logger.info(message)
	}
}
