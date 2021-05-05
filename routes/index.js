const express = require('express');
const bodyparser = require('body-parser');

const router = express.Router();
router.use(bodyparser.json());

router.get('/', (req, res, next) => {
	if(req.isAuthenticated()) res.status(200).end('You\'re logged in as ' + req.user.name);
	else res.status(200).end('You\'re not logged in');
})

module.exports = router;