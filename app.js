//jshint esversion:6

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const Schema = mongoose.Schema;

const mongoURL = "mongodb://localhost:27017/userDB";

mongoose.connect(mongoURL, {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new Schema({
 email: "String",
 password: "String"
});

const secret = process.env.SECRET;

userSchema.plugin(encrypt, {
 secret: secret, 
 encryptedFields: ['password']
});

const User = mongoose.model("User", userSchema);

app.get("/", function(req, res){
 res.render("home");
});

app.get("/register", function(req, res){
 res.render("register");
});

app.get("/login", function(req, res){
 res.render("login");
});

app.post("/register", function(req, res){
 const username = req.body.username;
 const password = req.body.password;

 const newUser = new User({
  email: username,
  password: password
 });

 newUser.save(function(err){
  if(err){
   console.log(err);
  }else{
   res.render("secrets");
  }
 });
});

app.post("/login", function(req, res){
 const username = req.body.username;
 const password = req.body.password;

 User.findOne({email: username}, function(err, foundUser){
  if(err){
   console.log(err);
  }else{
   if(foundUser){
    if(foundUser.password === password){
     res.render("secrets");
    }else{
     res.send("invalid passowrd");
    }
   }else{
    res.send("User not found!!!");
   }
  }
 });
});


app.listen(3000, function() {
 console.log("server is currently listening on port 3000.");
});