const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const connectDB = require("./config/db");
const passport = require("./middleware/passport");

const app = express();
const PORT = 9094;

connectDB();

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: "deskapp-passport-session-secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.currentUser = req.user || null;
    next();
});

app.use("/", require("./routes/index"));

app.listen(PORT, () => {
    console.log(`Server Running http://localhost:${PORT}`);
});


