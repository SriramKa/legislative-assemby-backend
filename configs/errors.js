exports.genericErrorHandler = (err, req, res, next) => {
	res.status(400).json({
		status: false,
		errors: [
			{
				message: err.message,
			},
		],
	});
};
