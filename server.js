const express = require("express");
const app = express();
const path = require("path");
const http = require("http").createServer(app);
const dotenv = require('dotenv');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');
const session = require("express-session");
const MemoryStore = require('memorystore')(session)
const passport = require("passport");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const resetRouter = require("./routes/reset");
const searchRouter = require("./routes/search");
const playlistRouter = require("./routes/playlist");
const PORT = process.env.PORT || 3000;
// const helmet = require("helmet");

/* Begin using environment variables */
dotenv.config();

/* Express middleware */
//helmet is used to prevent a large number of xss attacks
// app.use(helmet({
//   contentSecurityPolicy: false,
// }));
/* Recognize incoming requests as String and JSON objects respectively
and process data accordingly */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* Express requests are sequential and do not recognize same users by default.
Using this middleware, every user of our website will be assigned a unique session
that allows us to store user state. This ID is stored in a cookie on client side as
well as on the server side and sent with every request where it can be processed upon
match. It uses a sessions secret key for securely communicating with server and to 
prevent someone from tampering. */
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: new MemoryStore({
    checkPeriod: 86400000
  })
}));

/* Sanitize all incoming request bodies */
app.use(mongoSanitize({
  onSanitize: ({ req, key }) => {
    console.warn(`This request[${key}] is sanitized`, req);
  }
}));

/* Authentication Strategy is invoked using the Passport module */
require("./security/passport")(passport);

/* Begin Passport session */
/* These two methods allow the Passport module to begin authentication
and securely pass user details between express requests. To do so,
it uses from passport.js (secruity folder) the "Strategy" we wrote for
authenticating and serialize/deserialize methods to attach authenticated
users to each request so their data (e.g username) can be accessed elsewhere
on server side. The session maintains this state between requests so we can
be sure the same user is accessing resources which need authentication. */
app.use(passport.initialize());
app.use(passport.session());

/* linking the public folder for static files */
app.use(express.static(__dirname + "/public"));

/* Linking Views folder for dynamic files */
app.set(path.join(__dirname, './views'))

/* Set Template Engines to EJS to render Dynamic HTML pages */
app.set('view engine', 'ejs')


/* All Routes */

/* Route for Login and Register pages */
app.use("/", authRouter);

/* Route for User pages */
app.use("/user", userRouter);

/* Route for Password Resets */
app.use("/reset", resetRouter);

/* Route for Search pages */
app.use("/search", searchRouter);

/* Route for Playlist pages */
app.use("/playlist", playlistRouter);

/* Connect to MongoDB */
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false },
  () => console.log("Connected to Database.")
);

/* App hosted on environment determined port (when hosted)
or otherwise on localhost:3000 */
http.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
