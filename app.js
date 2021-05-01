//jshint esversion:6

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Setting up express session
app.use(session({
 secret: "olorunfemi is my name",
 resave: false,
 saveUninitialized: false
}));

//Setting up passport initializing and using it with express session
app.use(passport.initialize());
app.use(passport.session());

const Schema = mongoose.Schema;

const mongoURL = "mongodb://localhost:27017/userDB";

mongoose.connect(mongoURL, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const userSchema = new Schema({
 username: "String",
 password: "String",
 googleId: "String",
 facebookId: "String",
 secret: "String"
});

//uses the passportLocalMongoose with the Mongoose Schema
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

//telling passport how to handle our cookie (setting and using it)
passport.serializeUser(function(user, done) {
 done(null, user.id);
});

passport.deserializeUser(function(id, done) {
 User.findById(id, function(err, user) {
   done(err, user);
 });
});

///Implementing Google Oauth Strategy
passport.use(new GoogleStrategy({
 clientID: process.env.GOOGLE_CLIENT_ID,
 clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
 User.findOrCreate({ googleId: profile.id }, function (err, user) {
   return cb(err, user);
 });
}
));


// Implementing Facebook Oauth Strategy 
passport.use(new FacebookStrategy({
 clientID: process.env.FACEBOOK_APP_ID,
 clientSecret: process.env.FACEBOOK_APP_SECRET,
 callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
function(accessToken, refreshToken, profile, done) {
 console.log(profile);
 User.findOrCreate({facebookId: profile.id}, function(err, user) {
   if (err) { return done(err); }
   done(null, user);
 });
}
));

app.get("/", function(req, res){
 res.render("home");
});

app.get('/auth/google', 
 passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
 passport.authenticate('google', { failureRedirect: '/login' }),
 function(req, res) {
  // Successful authentication, redirect home.
  res.redirect('/secrets');
});

// Redirect the user to Facebook for authentication.
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.
app.get('/auth/facebook/secrets', 
 passport.authenticate('facebook', { failureRedirect: '/login' }),
 function(req, res) {
  // Successful authentication, redirect home.
  res.redirect('/secrets');
});

app.get("/register", function(req, res){
 res.render("register");
});

app.get("/secrets", function(req, res){
 if(req.isAuthenticated()){
   User.find({secret: {$ne: null}}, function(err, foundUsers){
     if(err){
       console.log(err);
     }else{
       res.render("secrets", {users: foundUsers});
     }
   });
 }else{
  res.redirect("/login");
 }
});

app.get("/login", function(req, res){
 res.render("login");
});

app.get('/logout', function(req, res){
 req.logout();
 res.redirect('/');
});

app.get("/submit", (req, res) =>{
  res.render("submit");
});

app.post("/register", function(req, res){
 User.register({username: req.body.username}, req.body.password,function(err, user){
  if(err){
   console.log(err);
  }else{
   passport.authenticate("local")(req,res, function(){
    res.redirect("/secrets");
   });
  }
 });
});

app.post('/login', function(req, res){
 const newUser = new User({
  username: req.body.username,
  password: req.body.password
 });

 req.login(newUser, function(err){
  if(err){
   console.log(err);
  }else{
   passport.authenticate("local")(req, res, function() {
    res.redirect("/secrets");
   });
  }
 });
 
});

app.post("/submit", function(req, res){
  User.findOneAndUpdate({_id: req.user._id}, {secret: req.body.secret}, {useFindAndModify: false}, function(err){
    if(err){
      console.log(err);
    }
  });
  res.redirect("/secrets");
});

app.listen(3000, function() {
 console.log("server is currently listening on port 3000.");
});