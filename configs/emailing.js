const path = require('path');
const fs = require('fs');
require('dotenv').config({path: path.resolve(__dirname, './.env')});

exports.nodemailerEmail = (subject, content, recipient) => {
	const nodemailer = require('nodemailer');
	let transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			user: 'testingrandom852@gmail.com',
			pass: process.env.GMAIL_PWD
		}
	});

	let mail = {
		from: 'Legislative Assembly (Regex) <testingrandom852@gmail.com>',
		to: recipient,
		subject: subject,
		text: 'From Legislative Assembly',
		html: content
	}

	return new Promise((resolve, reject) => {
		transporter.sendMail(mail, (err, data) => {
			if(err) {
				console.log('there\'s an error, fool \n', err);
				reject(err);
			}
			else {
				console.log('mail successfully sent to '+ recipient +', yayyy');
				resolve('mail sent to ' + recipient + '\n');
			}
		});
	});
}

//preferably don't use this, it uses a sandbox domain since you're not a premium user.
//using this sandbox domain, you can only send to 5 recipients, and they have to be verified..
//..by logging into mailgun, so fuck it
exports.mailgunEmailer = (subject, content, recipients) => {
	const mailgun = require('mailgun-js');
	const mg = mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});
	const data = {
		from: 'Excited User <me@samples.mailgun.org>',
		to: recipients.join(', '),
		subject: subject,
		text: content
	};
	mg.messages().send(data, function (error, body) {
		console.log(body);
	});
}