import { Router } from 'express'

/** @Group Auth */
const router = Router()

/** @Route GET /auth Load login form */
router.get('/', (req, res, next) => {
	res.send(`
  <html>
    <form action="/auth/login" method="post">
      <input name="email">
      <input name="password">
      <button type="submit">Submit</button>
    </form>
  </html>`)
})

router.post('/login', (req, res, next) => {
	if (req.body.email) {
		req.session.user = req.body
		res.send('logou')
	} else {
		res.redirect('/auth')
	}
})

export default router
