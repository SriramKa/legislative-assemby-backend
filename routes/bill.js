const express = require('express');
const bodyparser = require('body-parser');
const Bill = require('../models/bill');
const Party = require('../models/party');
const functions = require('../configs/functions');
const auth = require('../configs/authenticate');

const router = express.Router();
router.use(bodyparser.json());

router.get('/', (req, res, next) => {
	//pagination variables
	let size = req.query.size ? parseInt(req.query.size) : 10;
	let page = req.query.page ? parseInt(req.query.page) : 1;

	//to show all bills ever
	if(req.query.show_all) {
		functions.displayBills(Bill.find({}, 'name no description party represented status'), size, page, res);
	}

	//show bills based on passed status
	else if(req.query.status) {
		functions.displayBills(Bill.find({status: req.query.status}, 'name no description party represented status'), size, page, res);
	}

	//show bills presented by passed party
	else if(req.query.party) {
		Party.findOne({name: req.query.party}, '_id presented')
		.then((party) => {
			if(party) functions.displayBills(Bill.find({party: party._id}, 'name no description party represented status'), size, page, res);
			else res.status(404).end('that party doesn\'t exist');
		})
		.catch((err) => {
			res.status(500).json(functions.getPureError(err));
			console.log('there\'s an error: \n', err);
		});
	}

	else if(!(req.query.show_mine || req.query.show_supported)) {
		functions.displayBills(Bill.find({}, 'name no description party represented status'), size, page, res);
	}

	else next();
}, auth.check, (req, res, next) => {
	//pagination variables
	let size = req.query.size ? parseInt(req.query.size) : 10;
	let page = req.query.page ? parseInt(req.query.page) : 1;

	let user = req.user; //stores logged in user's doc

	//show bills supported/presented by logged-in user's party
	let search = {};
	let filter = (req.query.show_mine === 'true') ? 'party' : 'supporting';
	search[filter] = user.party;
	functions.displayBills(Bill.find(search, 'name no description party represented status'), size, page, res);
});

module.exports = router;