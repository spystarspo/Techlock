//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
 const  bcrypt = require("bcrypt");
const saltRounds = 10;
const app = express();

console.log(process.env.API_KEY);
//console.log("weak password hash: " + md5("apple"));

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));


//const mongoose = require('mongoose');
// connect to databse
mongoose.connect('mongodb://127.0.0.1:27017/userDB',{useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema ({
  email:String,                                        /////changes for mongoose encrytion based on doc
  password: String
});
//////////////////////database encryption///////////////
                                                          //SECRET used to encrypt our database in .env file
//userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ['password']  }); //this should nebore creating mongoose.model

////////////////////////////////////////////////////////////////////

const User = new mongoose.model("User",userSchema) ; //User is collection name always singular and starts with capital U

app.get("/",function(req,res){
  res.render("home");                  //to render home pape on browser fisrt step
});

app.get("/login",function(  req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/registertologin",function(req,res){
  res.render("registertologin");
});

 app.post("/register",function(req,res){

   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
       // Store hash in your password DB
       const newUser = new User({
         email : req.body.username,
         password : hash       //md5(req.body.password)
       });

       newUser.save(function(err){
         if(err){
           console.log(err)
         }else{
           res.render("secrets");
         }
       });
   });


 });

////for login route//////////////////
app.post("/login",function(req,res){
  const username = req.body.username;    //username here is text typed by user typed in login.ejs
  const password =  req.body.password;                  //md5(req.body.password);
User.findOne({email:username}, function(err,foundUser){
  if(err){
    console.log(err);
  }else{
    if(foundUser)
    {
      bcrypt.compare(password, foundUser.password , function(err, result) {
    // result == true
    if(result ===true){
        res.render("secrets");
    }
    else{
      res.render("registertologin");
        }
});
        /*if(foundUser.password === password){*/  //typed password compared with stored passed in databse




    }

    }

});

});





app.listen(3000, function() {
  console.log("Server started on port 3000");
});
