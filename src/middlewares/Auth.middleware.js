import jwt from 'jsonwebtoken'

const { auth, corsDomain } = process.myEnv

export function wrap(req, res, next) {
	const logged = req.cookies['new-used-media-logged']
	const token = req.cookies['new-used-media-token']

	if (!logged) {
		return next()
	}

	if (!token) {
		return next()
	}

	jwt.verify(token, auth.secret, (error, payload) => {
		if (error) {
			clearAuthCookies(res)
			return res.status(401).send({ error: 'Invalid token' })
		}

		req.numUser = payload
		return next()
	})
}

export function admin(req, res, next) {
	const header = req.headers.authorization

	if (!header) {
		return res.status(401).send({ error: 'No token provided' })
	}
	const token = header.split(' ')[1]

	jwt.verify(token, auth.secret, (error, payload) => {
		if (error) {
			return res.status(401).send({ error: 'Invalid token' })
		}
		req.adminUser = payload
		return next()
	})
}

export default function(req, res, next) {
	const logged = req.cookies['new-used-media-logged']
	const token = req.cookies['new-used-media-token']

	if (!logged) {
		clearAuthCookies(res)
		return res.status(401).send({ error: 'Logged out' })
	}

	if (!token) {
		clearAuthCookies(res)
		return res.status(401).send({ error: 'No token provided' })
	}

	jwt.verify(token, auth.secret, (error, payload) => {
		if (error) {
			clearAuthCookies(res)
			return res.status(401).send({ error: 'Invalid token' })
		}

		req.numUser = payload
		return next()
	})
}

function clearAuthCookies(res) {
	let options = {}
	if (corsDomain) {
		options.domain = corsDomain
	}

	res.clearCookie('new-used-media-token', options)
	res.clearCookie('new-used-media-logged', options)
	res.clearCookie('new-used-media-first-login', options)
}
