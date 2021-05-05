const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
	no: {
		type: Number,
		required: true
	},
	name: {
		type: String,
		trim: true,
		required: true
	},
	description: {
		type: String,
		trim: true
	},
	party: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'party',
		required: true
	},
	supporting: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'party'
	}],
	represented: {
		type: Boolean,
		required: true,
		default: true
	},
	status: {
		type: String,
		required: true,
		trim: true,
		default: 'pending',
		enum: ['pending', 'accepted', 'rejected']
	},
	polling: {
		type: Boolean,
		default: false
	},
	subscribers: [{
		_id: false,
		mla: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'mla'
		},
		status: {
			type: String,
			trim: true,
			enum: ['presenter', 'presenting', 'supporting', 'regular']
		},
		voted: {
			type: Boolean,
			default: false
		},
		vote: {
			type: Boolean,
			default: false
		}
	}],
	presenter: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'mla'
	}
});

const billModel = mongoose.model('bill', billSchema, 'bills');

module.exports = billModel;