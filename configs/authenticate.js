const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const functions = require('./functions');
const Mla = require('../models/mla');

exports.setup = (passport) => {
	passport.use(new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password'
	}, (username, password, done) => {
		Mla.findOne({username: username})
		.then((mla) => {
			//if user not found
			if(!mla) return done(null, false, {message: 'Incorrect credentials'});

			else {
				bcrypt.compare(password, mla.password, (err, isMatch) => {
					if(err) throw err;
					if(isMatch === true) return done(null, mla);
					else return done(null, false, {message: 'Incorrect credentials'});
				});
			}
		})
		.catch((err) => {
			console.log('there\'s an error: ', err);
			res.status(500).json(functions.getPureError(err));
		});
	}));

	passport.serializeUser((mla, done) => done(null, mla._id));

	passport.deserializeUser((id, done) => Mla.findById(id).then((mla) => done(null, mla)));
}

exports.check = (req, res, next) => {
	if(req.isAuthenticated()) return next();
	else res.redirect('/auth?dest=' + encodeURIComponent(req.originalUrl) + '&method=' + req.method);
}

exports.login = (req, res, next) => {
	passport.authenticate('local', (err, user, info) => {
		if(err) {
			console.log('there\'s an error: ', err);
			res.status(500).json(functions.getPureError(err));
		}
		else if(user) {
			req.logIn(user, (err) => {
				if(err) {
					console.log('there\'s an error: ', err);
					res.status(500).json(functions.getPureError(err));
				}
				else {
					if(req.query.dest) {
						if(req.query.method === 'GET') res.redirect(decodeURIComponent(req.query.dest));
						else if(req.query.method === 'POST') res.redirect(307, decodeURIComponent(req.query.dest))
					}
					else res.redirect('/');
				}
			});
		}
		else if(!user) res.status(200).end('Invalid credentials, try again');
	})(req, res, next);
}