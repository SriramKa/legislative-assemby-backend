const express = require("express");
const bodyparser = require("body-parser");

const router = express.Router();
router.use(bodyparser.json());

router.get("/", (req, res, next) => {
	const authStatus = req.isAuthenticated()
		? "logged in as " + req.user.name
		: "not logged in";
	let result = `<p>
	Hi!
	<br>This is a backend to a legislative assembly portal.
	<br>For more information, <a href="https://github.com/SriramKa/legislative-assemby-backend" target="_blank">click here</a>.
	<br>For the documentation and usage, <a href="https://github.com/SriramKa/legislative-assemby-backend/blob/main/docs/url-breakdown.md" target="_blank">click here</a>.
	<br>Thank you!
	<br><br>Currently, you're ${authStatus}.
	</p>`;
	res.set({ "Content-Type": "text/html" }).end(result);
});

module.exports = router;
