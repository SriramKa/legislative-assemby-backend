const express = require("express");
const Mla = require("../models/mla");
const Party = require("../models/party");
const { displayMlas } = require("../configs/functions");
const { genericErrorHandler } = require("../configs/errors");

const router = express.Router();

router.get(
	"/",
	(req, res, next) => {
		let size = req.query.size ? parseInt(req.query.size) : 10;
		let page = req.query.page ? parseInt(req.query.page) : 1;

		if (req.query.party) {
			//if party parameter is used
			/* Using the array of members stored in party doc */
			Party.findOne({ name: req.query.party }, "-presented -supporting").then(
				(party) => {
					if (party) {
						//querying mla collection directly using party id
						displayMlas(
							Mla.find({ party: party._id }, "name id party presented email"),
							size,
							page,
							res
						);
					} else throw new Error("No party by that name found.");
				}
			);
		} else {
			displayMlas(
				Mla.find({}, "name id party presented email"),
				size,
				page,
				res,
				next
			);
		}
	},
	genericErrorHandler
);

module.exports = router;
