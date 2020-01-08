import { logger } from '../utils/Winston'

export default function(exception, req, res, next) {
	let defaultObject = { payload: { message: 'An error has ocurred' } }
	logger.error({ exception })
	if (process.myEnv.debug && JSON.parse(process.myEnv.debug) === true) {
		// Apend to default error payload
		if (exception.errmsg) {
			defaultObject.payload.details = exception.errmsg
		}
		if (exception.message) {
			defaultObject.payload.details = exception.message
		}
		defaultObject.payload.exception = {
			stack: exception.stack ? exception.stack.split('\n').map(s => s.trim()) : undefined
		}
	}

	if (exception.name === 'ValidationError' && exception.errors) {
		return res.status(400).json({
			error: 'ValidationError',
			errors: Object.keys(exception.errors).map(key => ({ message: exception.errors[key].message, field: key }))
		})
	}
	if ((exception.name === 'Exception' || exception.name === 'Error') && exception.message) {
		return res.status(exception.status || 500).json({ message: exception.message, details: exception.details })
	}
	if (exception.response && exception.response.data) {
		let response = exception.response
		return res.status(response.status).send(response.data)
	}
	if (defaultObject) {
		return res.status(defaultObject.status || 500).json(defaultObject.payload)
	}
	return res.status(500).json({ error: 'Unhandled exception', exception })
}
