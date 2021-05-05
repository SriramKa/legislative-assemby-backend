const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	members:[{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'mla'
	}],
	supporting: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'bill'
	}],
	presented: [{
		type:mongoose.Schema.Types.ObjectId,
		ref: 'bill'
	}]
});

const partyModel = mongoose.model('party', partySchema, 'parties');

module.exports = partyModel;