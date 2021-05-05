const mongoose = require('mongoose');

const mlaSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: true
	},
	eval: {
		type: Boolean,
		required: true,
		default: true
	},
	id: {
		type: Number,
		required: true
	},
	party: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'party'
	},
	presented: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'bill'
	}],
	email: {
		type: String,
		trim: true,
		required: true
	},
	username: {
		type: String,
		trim: true,
		required: true
	},
	password: {
		type: String, //hashed value
		required: true
	}
});

const mlaModel = mongoose.model('mla', mlaSchema, 'MLAs');

module.exports = mlaModel;