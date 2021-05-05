const express = require('express');
const bodyparser = require('body-parser');
const Mla = require('../models/mla');
const Party = require('../models/party');
const functions = require('../configs/functions');

const router = express.Router();
router.use(bodyparser.json());

router.route('/')
.get((req, res, next) => {
	let size = req.query.size ? parseInt(req.query.size) : 10;
	let page = req.query.page ? parseInt(req.query.page) : 1;

	if(req.query.party) {	//if party parameter is used
		/* Using the array of members stored in party doc */
		Party.findOne({name: req.query.party}, '-presented -supporting')
		.then((party) => {

			if(party) {
				//querying mla collection directly using party id
				functions.displayMlas(Mla.find({party: party._id}, 'name id party presented email'), size, page, res);
			}

			else res.status(404).end('no party by that name found.');
		});
	}

	else {
		functions.displayMlas(Mla.find({}, 'name id party presented email'), size, page, res, next);
	}
});

module.exports = router;