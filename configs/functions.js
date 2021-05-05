//this file contains some functions used repeatedly throughout the app

//error handling functions
function replaceErrors(key, value) {
    if (value instanceof Error) {
        var error = {};
        Object.getOwnPropertyNames(value).forEach(function (key) {
            error[key] = value[key];
        });
        return error;
    }
    return value;
}

exports.getPureError = (error) => {
    return JSON.parse(JSON.stringify(error, replaceErrors));
}

//display functions
exports.displayBills = (query, size, page, res) => {
	query
	.sort('name')
	.skip(size*(page-1))	//for pagination
	.limit(size)			//for pagination
	.populate('party', 'name')
	.then((bills) => res.status(200).json(bills))
	.catch((err) => res.status(500).json());
}

exports.displayMlas = (query, size, page, res) => {
	query
	.sort('name')
	.skip(size*(page-1))	//for pagination
	.limit(size)			//for pagination
	.populate('party', 'name')
	.populate('presented', 'name')
	.then((mlas) => res.status(200).json(mlas))
	.catch((err) => res.status(500).render('error', {
		message: err.message,
		error: err
	}));
}