const express = require('express');
const bodyparser = require('body-parser');
const async = require('async');
const Bill = require('../models/bill');
const emailing = require('../configs/emailing');
const functions = require('../configs/functions');
const auth = require('../configs/authenticate');

const router = express.Router();
router.use(bodyparser.json());

router.post('/', auth.check, (req, res, next) => {
	let user = req.user; //stores logged in user's doc

	Bill.findOne({no: parseInt(req.query.bill)}, '-represented')
	.populate('subscribers.mla', 'name email')
	.then((bill) => {

		if(bill) {
			//quitting if the MLA who started evaluation isn't the bill's presenter
			if(bill.presenter.toString() !== user._id.toString()) {
				res.status(401).end('only presenter of the bill can evaluate the poll. tell that fellow to start.');
			}

			//checking if the bill is up for polling
			else if(bill.polling === false) {
				res.status(403).end('this bill isn\'t even put up for voting');
			}

			//applying voting logic and mailing
			else {
				let mailCalls = []

				let favors = 0;
				let opposes = 0;

				bill.subscribers.forEach((sub) => {
					if(sub.voted === true) {
						if(sub.vote) favors+=1;
						else opposes+=1;
					}
				});

				//voting logic
				if (favors > opposes) bill.status = 'accepted';
				else if(opposes > favors) bill.status = 'rejected';
				else bill.status = 'pending';
				bill.polling = false;

				//mailing begins here
				let subject = 'Bill no. ' + bill.no + ' polling results: ' + ((bill.status === 'pending') ? 'no clear majority' : bill.status);
				let results = (bill.status === 'pending') ? 'no clear majority' : bill.status;
				let content = `<h2>Bill ${bill.name} polling results: ${results}</h2>
				<p>Total votes: ${favors + opposes}</p>
				<p>Favors: ${favors}</p>
				<p>Opposes: ${opposes}</p>`

				let saveBill = (callback) => bill.save().then((bill) => callback(null, bill));
				mailCalls.push(saveBill);

				bill.subscribers.forEach((sub) => {
					let mailCall = (callback) => {
						emailing.nodemailerEmail(subject, content, sub.mla.email)
						.then((msg) => callback())
					}
					mailCalls.push(mailCall);
				});

				return async.parallel(mailCalls)
				//mailing ends here
			}
		}

		else res.status(404).end('bill doesn\'t exist');
	})
	.then((results) => {
		if(results) {
			res.status(200).end('bill ' + ((results[0].status === 'pending') ? 'has no clear majority' : 'is ' + results[0].status) + '! mail sent to subscribers.\n', results[0]);
		}
	})
	.catch((err) => {
		res.status(500).json(functions.getPureError(err));
		console.log('there\'s an error: \n', err);
	});
});

module.exports = router;