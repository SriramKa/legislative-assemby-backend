const express = require("express");
const bodyparser = require("body-parser");
const bcrypt = require("bcryptjs");
const async= require('async');
const functions = require("../configs/functions");
const email = require('../configs/emailing');
const auth = require('../configs/authenticate');
const Mla = require("../models/mla");
const Party = require('../models/party');

const router = express.Router();
router.use(bodyparser.json());

router.get('/', (req, res, next) => {
	res.status(200).end('Enter username and password as JSON and send POST request to /auth' + (req.query.dest ? ('?dest=' + encodeURIComponent(req.query.dest)) + '&method=' + req.query.method + '\nYou\'ll get redirected to the route ' + decodeURIComponent(req.query.dest) + '.' : '') + '\nIf you wanna register, put /register beside \'auth\' in the URL');
})

router.post('/', (req, res, next) => {
	auth.login(req, res, next);
});

router.get('/register', (req, res, next) => {
	res.status(200).end('Enter user details (MLA ID, name, email, party, username, password) as JSON and send POST request to /auth/register' + (req.query.dest ? ('?dest=' + encodeURIComponent(req.query.dest)) + '&method=' + req.query.method + '\nYou\'ll send ' + req.query.method + ' request to ' + decodeURIComponent(req.query.dest) : ''));
})

router.post("/register", (req, res, next) => {
	let toInsert = JSON.parse(JSON.stringify(req.body));
	async.parallel([
		(callback) => Mla.findOne({email: toInsert.email}).then((mla) => callback(null, mla)),
		(callback) => Mla.findOne({username: toInsert.username}).then((mla) => callback(null, mla)),
		(callback) => Mla.findOne({id: toInsert.id}).then((mla) => callback(null, mla)),
		(callback) => Party.findOne({name: toInsert.party}, '_id').then((party) => callback(null, party)) //to save objectID of party passed as string
	])
	.then((result) => {
		if(result[0]) res.status(200).end('User with that email already exists');
		else if(result[1]) res.status(200).end('User with that username already exists');
		else if(result[2]) res.status(200).end('User with that MLA ID already exists');
		else {
			if(result[3]) toInsert.party = result[3]._id; //save objectID of party if it exists
			return async.waterfall([
				(callback) => {
					bcrypt.genSalt(10)
					.then((salt) => callback(null, salt));
				},
				(salt, callback) => {
					bcrypt.hash(toInsert.password, salt)
					.then((hash) => callback(null, hash));
				},
				(hash, callback) => {
					toInsert.password = hash;
					if(typeof toInsert.party === 'string') { //creating party if it doesn't exist
						Party.create({name: toInsert.party})
						.then((party) => callback(null, party));
					}
					else {
						Party.findById(toInsert.party)
						.then((party) => callback(null, party));
					}
				},
				(party, callback) => {
					toInsert.party = party._id;
					Mla.create(toInsert)
					.then((mla) => callback(null, mla, party));
				},
				(mla, party, callback) => {
					party.members.push(mla._id);
					party.save().then((party) => callback(null, {mla, party}));
				}
			]);
		}
	})
	.then((result) => {
		if(result) { //to deal with cases where promise isnt resolved(i.e. mla already exists)
			console.log('registration successful');
			//log in if registration successful
			email.nodemailerEmail(
				'You have successfully registered',
				`<p>You have successfully registered for the Legislative Assembly portal.</p>
				<div>Name: ${result.mla.name}</div>
				<div>MLA ID: ${result.mla.id}</div>
				<div>Party: ${result.party.name}</div>
				<div>Username: ${result.mla.username}</div>`,
				result.mla.email
			);
			//login once registered
			auth.login(req, res, next);
		}
	})
	.catch((err) => {
		console.log('there\'s an error: \n', err);
		res.status(500).json(functions.getPureError(err));
	});
});

router.get('/logout', (req, res, next) => {
	req.logout();
	res.clearCookie('connect.sid');
	res.status(200).end('You are now logged out.');
})

module.exports = router;
