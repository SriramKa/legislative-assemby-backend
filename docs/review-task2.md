*This is an automated recorded review for "Sriram Karanjkar"(MIT-Regex@03/13/2020) using ReviewTemplateEngine*

**This review file will be updated only until the review date. Any and every detail specified in this document can and will be recorded for future reference. Acceptance of the pull request proposed to merge the review will be considered an agreement to the terms of conduct.**

URL Structure:
`<Complete>`
- Consider avoiding long attribute names for 'Business Logic' security reasons. Ex: Try `size` instead of `items-per-page`. (Modified)
- Document formatting (ordering and structure). (Modified)
- Suggested usage of csrf-token/cookies to persist login-state and ease of auth-state management. (Modified)
- Represent arrays as `string[]` or `array<string>` or `list<string`. (Modified)
- Consider using `enums` for definite selection values. (Modified)
- Suggested addition of `user/change/pass`. (Modified)
- Consider dynamically generating random value for a field and storing in database when `/startpoll` called to get anonymity.

DMD:
`<Review Skipped>`
-	Skipping review. Must be worked on only during laxation.

Functional Breakdown:
`<Review Skipped>`
-	Skipping review. Must be worked on only during laxation.

Extras:
-	The repository is registered as working repository on 02/16/2020
-	Last reviewed on 03/10/2020
- Changed filenames

---

Q:
1. `Would it be better to have an array of party members in each party object so not every MLA will be queried?`\
Depends on the approach really, A more RDBMS style thinking would allow ids to be included and queried for all MLAs but a NoSQL thinking would allow nested objects to be stored directly. There is no hard rule at play here. One can mix and match the thinking without significant performance impacts due to internal mechanics being optimized for both approaches. Generally such a question boils down to personal preference.

2. `Would it even make sense to have /register to be a sub-handle from /auth, although it makes semantic sense to have all authorisation under one common URL?`\
Sure, generally authorization is kept tightly wound to login and generally tied logic but in different mentality this approach is also very viable and proved efficient.

3. `How will authentication work in this case, since if it's a direct click from the mail application, the user won't be logged in to this portal?`\
One way to do that is clarified in a note and already made as a change in this proposal. Other than that, one can lead the link to another handle which asks for a sign-in. It's much more security oriented as somebody cannot tackle down the link and use it as they please.
