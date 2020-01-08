import socketio from 'socket.io'
import sharedsession from 'express-socket.io-session'

/** @type {socketio.Server} iobro */
let io
export function initWebSockets(server, session) {
	io = socketio(server, { origins: '*:*', transports: ['websocket'] })
	io.use(sharedsession(session, { autoSave: true }))
	io.on('connection', onConnect)
}

/** @param { socketio.Socket } socket */
async function onConnect(socket) {
	let session = socket.handshake.session
	if (!session.user) {
		socket.disconnect(true)
		return
	}

	socket.on('message', data => onMessage(socket, data))
	socket.on('disconnect', () => onDisconnect(socket))
}

function onDisconnect(socket) {}

export async function tryPushNotification(notification, userId) {
	let sockets = getSocketsByUserId(userId)
	for (let socket of sockets) {
		socket.emit('notification', notification)
	}
}

export async function trySendUpdatedTrade(trade, userId) {
	let sockets = getSocketsByUserId(userId)
	for (let socket of sockets) {
		socket.emit('trade', trade)
	}
}

export function removeFromLibraryAtTrade(mediaOf, otherUserId, tradeId, mediaId) {
	let sockets = getSocketsByUserIds([mediaOf, otherUserId])
	for (let socket of sockets) {
		socket.emit('disabled', { userId: mediaOf, tradeId, mediaId })
	}
}

async function onMessage(socket, data) {
	let from = socket.user.id
}

function getSocketsByUserId(userId) {
	return Object.values(io.sockets.sockets).filter(socket => socket.handshake.session.user.id == userId)
}

function getSocketsByUserIds(ids) {
	return Object.values(io.sockets.sockets).filter(socket => ids.includes(socket.handshake.session.user.id))
}
