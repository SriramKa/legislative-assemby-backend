const express = require("express");
const bodyparser = require("body-parser");
const async = require("async");
const functions = require("../configs/functions");
const Bill = require("../models/bill");
const Party = require("../models/party");
const emailing = require("../configs/emailing");
const auth = require("../configs/authenticate");

const router = express.Router();
router.use(bodyparser.json());

router.post("/", auth.check, (req, res, next) => {
	let user = req.user; //stores logged in user's doc
	let url = req.protocol + "://" + req.get("host");

	Bill.findOne({ no: parseInt(req.query.bill) })
		.populate("party", "name")
		.populate("subscribers.mla", "party email")
		.then((bill) => {
			if (bill) {
				//allowing only presenter to allow polling
				if (user._id.toString() === bill.presenter.toString()) {
					//setting the bill to start polling
					bill.status = "pending";
					bill.polling = true;
					return bill.save();
				} else
					res.status(500).end("only presenter is authorized to begin polling");
			} else res.status(404).end("bill doesn't exist");
		})
		.then(async (bill) => {
			/****** IMPLEMENTING EMAILING LOGIC *******/
			//mailing begins here
			if (bill) {
				let mailCalls = [];
				for (sub of bill.subscribers) {
					let email = sub.mla.email;
					let subject = "Bill no. " + bill.no + " polling has begun";
					let header =
						"<h2>Bill " +
						bill.no +
						": " +
						bill.name +
						" has begun polling.</h2>";
					let body = `<p>Bill description: ${bill.description}</p>
				<p>
					<form method="post"action="${url}/user/poll?bill=${bill.no}&vote=true" class="inline">
						<input type="hidden">
							<button>Vote FOR</button>
						</input>
					</form>
					<form method="post" action="${url}/user/poll?bill=${bill.no}&vote=false" class="inline">
						<input type="hidden">
							<button>Vote AGAINST</button>
						</input>
					</form>
				</p>`;
					let content = "";

					//for member of presenting party
					if (sub.status === "presenting") {
						content = header.concat(
							"<h4>You are a member of the party " +
								bill.party.name +
								", the party that presented this bill.</h4>",
							body
						);
					}

					//for members of the supporting party
					else if (sub.status === "supporting") {
						let party = await Party.findById(sub.mla.party, "name");
						content = header.concat(
							"<h4>You are a member of the party " +
								party.name +
								", a party supporting this bill.</h4>",
							body
						);
					}

					//for presenter of the bill
					else if (sub.status === "presenter") {
						content = header.concat(
							"<h4>You have presented this bill in the assembly.</h4>",
							body
						);
					}

					//for other regular subscribers
					else if (sub.status === "regular") {
						content = header.concat(
							"<h4>You have subscribed to updates for this bill.</h4>",
							body
						);
					}

					let mailCall = (callback) => {
						emailing
							.nodemailerEmail(subject, content, email)
							.then((msg) => callback(null, msg));
					};

					mailCalls.push(mailCall);
				}

				return async.parallel(mailCalls);
				//mailing ends here
			}
		})
		.then((results) => {
			if (results) {
				//to deal with when promise isnt resolved(i.e. when mails aren't sent)
				results.forEach((msg) => res.write(msg));
				res.status(200).end("mails sent, polling for has begun.");
			}
		})
		.catch((err) => {
			res.status(500).json(functions.getPureError(err));
			console.log("there's an error: \n", err);
		});
});

module.exports = router;
