const express = require("express");
const async = require("async");
const bcrypt = require("bcryptjs");
const Mla = require("../models/mla");
const Bill = require("../models/bill");
const Party = require("../models/party");
const { displayBills, getPureError } = require("../configs/functions");
const auth = require("../configs/authenticate");

const router = express.Router();

router.get("/", auth.check, (req, res, next) => {
	let user = req.user; //stores logged in user's doc

	if (!req.query.presented) res.status(200).json(user);
	else {
		//finding presented bills using the field in the mla doc (user)
		displayBills(
			Bill.find(
				{ _id: { $in: user.presented } },
				"name no description party represented status"
			),
			0,
			1,
			res
		);
	}
});

router.post("/change", auth.check, (req, res, next) => {
	let user = req.user; //stores logged in user's doc

	let toChange = req.query["to-change"].split(" ");
	let toUpdate = req.body;

	bcrypt.compare(req.body.password, user.password, async (err, isMatch) => {
		if (err) throw err;
		else if (!isMatch) res.status(403).end("password doesn't match");
		else {
			delete toUpdate.password;
			//assuming the input for party is party's name, then gotta save objectId there
			if (toChange.indexOf("party") !== -1) {
				toUpdate.party = await Party.findOne({ name: toUpdate.party }, "_id");
			}

			let usernameCheck;
			if (toChange.indexOf("username") !== -1) {
				usernameCheck = await Mla.findOne({ username: toUpdate.username });
			}
			let idCheck;
			if (toChange.indexOf("id") !== -1) {
				idCheck = await Mla.findOne({ id: toUpdate.id });
			}

			if (idCheck || usernameCheck) {
				if (idCheck) throw new Error("this MLA ID is already taken\n");
				if (usernameCheck) throw new Error("this username is already taken\n");
			}
			//updating
			else {
				Mla.findByIdAndUpdate(user._id, { $set: toUpdate }, "-password")
					.then((mla) => res.status(200).end("update successful"))
					.catch((err) => {
						res.status(500).json(getPureError(err));
						console.log("there's an error: \n", err);
					});
			}
		}
	});
});

router.post("/change/pass", auth.check, async (req, res, next) => {
	let user = req.user; //stores logged in user's doc

	bcrypt.compare(req.body.oldpwd, user.password, (err, isMatch) => {
		if (err) {
			console.log("there's an error: ", err);
			res.status(500).json(getPureError(err));
		} else if (!isMatch) res.status(403).end("password doesn't match");
		else {
			bcrypt
				.genSalt(10)
				.then((salt) => {
					return bcrypt.hash(req.body.newpwd, salt);
				})
				.then((hash) => {
					return Mla.findByIdAndUpdate(user._id, { password: hash });
				})
				.then((mla) => res.status(200).end("password change successful"))
				.catch((err) => {
					console.log("there's an error: ", err);
					res.status(500).json(getPureError(err));
				});
		}
	});
});

router.post("/presentbill", auth.check, async (req, res, next) => {
	let user = req.user; //stores logged in user's doc

	let toInsert = req.body;
	toInsert.presenter = user._id; //adding presenter
	toInsert.subscribers = [
		{
			//adding presenter to subscriber list
			mla: user._id,
			status: "presenter",
			voted: false,
			vote: false,
		},
	];
	if (!toInsert.supporting) toInsert.supporting = [];

	//modification functions to format input JSON object of bill to agree with schema..
	//..(store party names as parties) and filling subscriber list
	let modificationCalls = [
		//changing presenting party name to party's ObjectID, and adding subscribers
		(callback) => {
			Party.findOne({ name: toInsert.party }, "_id members").then((party) => {
				toInsert.party = party._id; //set as presenting party
				//adding members of presenting party to subscriber list
				party.members.forEach((member) => {
					if (member.toString() !== user._id.toString())
						toInsert.subscribers.push({
							mla: member,
							status: "presenting",
							voted: false,
							vote: false,
						});
				});
				callback(null, party);
			});
		},
		//changing supporting party names to party's ObjectIDs, and adding subscribers
		(callback) => {
			Party.find({ name: { $in: toInsert.supporting } }, "_id members").then(
				(parties) => {
					toInsert.supporting = [user.party._id]; //added presenting party as supporter
					parties.forEach((supporter) => {
						//adding to supporting (if it's not the presenting party)
						if (supporter._id.toString() !== user.party._id.toString()) {
							toInsert.supporting.push(supporter._id);
							//adding supporting party members as subscribers
							supporter.members.forEach((member) =>
								toInsert.subscribers.push({
									mla: member,
									status: "supporting",
									voted: false,
									vote: false,
								})
							);
						}
					});
					callback(null, parties);
				}
			);
		},
	];

	//executing the queries parallelly using async module, since we wanna..
	//..send the response after the parallely run queries are completed.
	async
		.parallel(modificationCalls)
		.then((result) => {
			//inserting the bill to the db
			return Bill.create(toInsert);
		})
		.then((bill) => {
			//updating the party(supporting and presented) and mla(presented) docs
			let updateCalls = [
				//to insert bill into the results for the callback
				(callback) => {
					callback(null, bill);
				},
				//updating 'presented' of party
				(callback) => {
					Party.findByIdAndUpdate(bill.party, {
						$push: { presented: bill._id },
					}).then((party) => callback(null, party));
				},
				//updating 'supporting' of party
				(callback) => {
					Party.updateMany(
						{ _id: { $in: bill.supporting } },
						{ $push: { supporting: bill._id } }
					).then((party) => callback(null, party));
				},
				//updating 'presented' of mla
				(callback) => {
					Mla.findByIdAndUpdate(user._id, {
						$push: { presented: bill._id },
					}).then((mla) => callback(null, mla));
				},
			];
			return async.parallel(updateCalls);
		})
		.then((result) => {
			res.status(200).json(result[0]); //result[0] stores the bill; observe the array.
			console.log("bill created, MLAs and Parties updated accordingly\n");
		})
		.catch((err) => {
			res.status(500).json(getPureError(err));
			console.log("there's an error: \n", err);
		});
});

router.post("/subscribebill", auth.check, (req, res, next) => {
	let user = req.user; //stores logged in user's doc

	Bill.findOne({ no: parseInt(req.query.bill) })
		.then((bill) => {
			let already = false;
			//checks if user is already subscribed
			bill.subscribers.forEach((subscriber) => {
				if (subscriber.mla.toString() === user._id.toString()) already = true;
			});
			if (already === true) res.status(200).end("you're already subscribed");
			else {
				bill.subscribers.push({
					mla: user._id,
					status: "regular",
					voted: false,
					vote: true,
				});
				return bill.save();
			}
		})
		.then((bill) => {
			if (bill) res.status(200).end("subscription succesful");
			//put an if condn to deal with when bill.save isnt called(ie the promise is never made)
		})
		.catch((err) => {
			res.status(500).json(getPureError(err));
			console.log("there's an error: \n", err);
		});
});

router.post("/poll", auth.check, (req, res, next) => {
	let user = req.user; //stores logged in user's doc

	Bill.findOne({ no: parseInt(req.query.bill) })
		.then(
			(bill) => {
				//checking if the bill is up for polling
				if (bill.polling === false) {
					res.status(403).end("this bill isn't even put up for voting");
				}

				//implementing the vote
				else {
					let voterIndex = bill.subscribers.findIndex(
						(sub) => sub.mla.toString() === user._id.toString()
					);
					if (voterIndex !== -1) {
						if (bill.subscribers[voterIndex].voted !== true) {
							(bill.subscribers[voterIndex].voted = true),
								(bill.subscribers[voterIndex].vote = req.query.vote === "true");
							return bill.save();
						} else res.status(200).end("you've already voted for this bill");
					} else res.status(500).end("you're not subscribed to this bill");
				}
			},
			(err) => {
				res.status(500).json(getPureError(err));
				console.log("there's an error: \n", err);
			}
		)
		.then((bill) => {
			if (bill) {
				//to handle in case bill.save isn't called(ie the promise is never made)
				res.status(200).json({
					status: "vote confirmed",
					bill: bill.name,
					vote: req.query.vote,
				});
			}
		})
		.catch((err) => {
			res.status(500).json(getPureError(err));
			console.log("there's an error: \n", err);
		});
});

module.exports = router;
