import AuthRoutes from '../modules/auth/Auth.routes'

export default function(app) {
	app.use('/auth', AuthRoutes)
}
