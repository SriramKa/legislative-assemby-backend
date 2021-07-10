const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const bodyparser = require("body-parser");
const morgan = require("morgan");
const session = require("express-session");
const auth = require("./configs/authenticate");
require("dotenv").config();

const port = process.env.PORT || 3000;

//setting up express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
	session({
		secret: "not-a-secret",
		resave: true,
		saveUninitialized: true,
	})
);
app.use(passport.initialize());
app.use(passport.session());
auth.setup(passport);

//mounting all routes and controllers
const index = require("./routes/index");
const mlaRoute = require("./routes/mla");
const billRoute = require("./routes/bill");
const userRoute = require("./routes/user");
const authRoute = require("./routes/auth");
const startpoll = require("./controllers/startpoll");
const evalpoll = require("./controllers/evalpoll");
app.use("/", index);
app.use("/mla", mlaRoute);
app.use("/bills", billRoute);
app.use("/user", userRoute);
app.use("/auth", authRoute);
app.use("/startpoll", startpoll);
app.use("/evalpoll", evalpoll);

//for all undefined routes:
app.use((req, res, next) => res.status(404).end("Route not found."));

//connecting to the database
mongoose
	.connect(process.env.DBURL, {
		//to avoid deprecation warnings:
		useCreateIndex: true,
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	})
	.then((db) => {
		console.log("Connected to db, good job");
		app.listen(port, () => console.log("Server walkn't at", port));
	})
	.catch((err) => {
		console.log("Error in connecting to the db: \n", err);
	});
