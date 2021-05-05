## Tech Stack Explanation

For this task I am intending to use Node.js, ExpressJS and MongoDB

#### Node.js

I'm choosing the Node.js ecosystem becasue it's flexible and as of now I'm somewhat familiar and comfortable with JavaScript. I've also read that it's a good ecosystem for beginners to get into backend development. Also a large userbase of Node and Express means support and help will be more easily and readily available.

#### ExpressJS

Express satisfies most of the requirements of the task. It has efficient routing API, and due to it's code flexibility and focus on code more than configuration, allowing routes to be coded directly with the business logic, or could also be saved as a separate file for each kind of route and then exported to the main app, thus helping with modularity of the API. It has tools for implementation of middleware, it is scalable, and has templating support - satisfying many needs of the task.

#### MongoDB

MongoDB is a NoSQL database program, and since I have no experience in database systems or any SQL, this feels well suited for me. ORM support can be achieved by a package called Mongoose. All records are documents, and thus no schema has to be followed, so even though practically we will conform to a schema, adding parameters to a schema will be easier than in RDBMS, improving flexibility and scalability.

## Data Model:

In MongoDB, every record is stored as a JSON-like document. Each document is assigned a unique ID. These documents can be categorised into collections. For our case, there will be 3 collections: one is for MLAs, one for bills and one for parties.

**Schema for MLA records:**
```
{
	"name": string,
	"is_evaluated": boolean,
	"id": number,	//MLA ID
	"party": Unique ID of the record of the MLA's party, listed in the parties'
	collection. Obtaining and storing this can be done in the MLA registration
	logic itself.
	"presented": array<Unique ID>	//of bills presented by the MLA
	"email": string,
	"username": string,
	"password": string (hash value) (I have yet to look into authentication
	methods, though)
}
```

A new record with all the entered details is added to the MLA collection for every new registration made. Subscribed bills aren't stored in MLA records because after adding an MLA to the polling booth of a certain bill, to mail every subscribed MLA instead of checking every MLA in the database whether he has subscribed for the polling booth or not, it'll be more efficient to store a list of MLAs of a polling booth for a bill in the record for that bill itself, it'll only have to email the specific MLAs in that list.

Every bill addition will add a record of that bill to the bills' collection.

**Schema of a bill record:**
```
{
	"no": int, //bill_no
	"name": string, //bill_name
	"description" string, //bill_description
	"party": Unique ID //of the presenting party, listed in the
	parties' collection. Obtaining and storing this can be done in the bill
	registration logic itself.
	"supporting": array<unique ID>	//Unique IDs of supporting parties. unique
	IDs can be found from the strings passed in the bill regsitration logic. In
	this logic you also add the bill's unique ID to each supporting party's
	record in the DB.
	"represented": boolean,
	"status": string,	//can accept only 3 values: pending(default), accepted,
	and rejected
	"polling": boolean	//if the bill is up for vote, it's true. set to true when
	the mail is sent to the subscribers. default = false
	"subscribers": array<{
		mla: unique ID,	//of subscribed MLA
		collection.
		status: string	//'presenter'(MLA), 'presenting'(party member of presenting party), 'supporting'(party member of supporting party) or 'regular'
		voted: boolean,	//true if MLA has voted, false if not
		vote: boolean	//stores the vote
	}>	//stores the voting details of subscribed MLAs
	"presenter": Unique ID	//unique ID of MLA who presented the bill,
	to account for variations in the mailing contents when the bill is put forth
	to vote for.
}
```

**Schema of a Party:**
```
{
	"name": string,					//party's name
	"members: array<unique ID>		//of member MLAs
	"supporting": array<unique ID>,	//bills the party supports
	"presented": array<unique ID>,	//bills the party has presented
}
```

I've stored array of supporting bills and presented bills in the party record itself, for the same reason as including array of subscribers in the bill record, and presented bills in the MLA record - to avoid querying the entire database for the presence of a particular value for a certain field, thus increasing efficiency and scalability.
