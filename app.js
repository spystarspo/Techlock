//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
//const  bcrypt = require("bcrypt");
//const saltRounds = 10;

const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

//console.log(process.env.API_KEY);
//console.log("weak password hash: " + md5("apple"));

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "this out little secret.",
  resave: false,
  saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());

//const mongoose = require('mongoose');
// connect to databse
mongoose.connect('mongodb://127.0.0.1:27017/userDB',{useNewUrlParser: true, useUnifiedTopology: true});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email:String,                                        /////changes for mongoose encrytion based on doc
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);         //for passportLocalMongoose plugin
userSchema.plugin(findOrCreate);

//////////////////////database encryption///////////////
                                                          //SECRET used to encrypt our database in .env file
//userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ['password']  }); //this should nebore creating mongoose.model

////////////////////////////////////////////////////////////////////

const User = new mongoose.model("User",userSchema) ; //User is collection name always singular and starts with capital U


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){
  res.render("home");                  //to render home pape on browser fisrt step
});

/*app.get("/auth/google",function(req,res){
  passport.authenticate("google", {scope: [ "profile" ]})                           //to authinticate with user we use passport
});*/

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }));

  app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
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

app.get("/error",function(req,res){
  res.render("error");
});


app.get("/secrets",function(req,res){

  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });

});


app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
      res.render("submit");
  }else{
      res.redirect("/login");
  }
});

app.post("/submit",function(req,res ){
  const submittedSecret = req.body.secret;
  console.log(req.user.id);

  User.findById(req.user.id, function(err, foundUser) {
    if(err){
      console.log(err);
    }else{
      if (foundUser){
        foundUser.secret=submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  })
})

/*app.get("/logout",function(req,res){
  req.logout();
  res.render("/");
}); */

app.get("/logout", (req, res) => {
  req.logout(req.user, err => {
    if(err) return next(err);
    res.redirect("/");
  });
});


 app.post("/register",function(req,res){

   /*bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
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
   }); */

User.register({username: req.body.username}, req.body.password, function(err,user){
  if(err){
    console.log(err);
    res.redirect("/error");
  }else{
    passport.authenticate("local")(req, res, function(){
      res.redirect("/secrets");
    });
  }
});

 });

////for login route//////////////////
app.post("/login",  passport.authenticate('local', { failureRedirect: '/registertologin' }), function(req,res){
  /*  const username = req.body.username;    //username here is text typed by user typed in login.ejs
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




  /*  }

    }

});*/



const user = new User({
  username : req.body.username,
  password : req.body.password
});

 req.login(user, function(err){
   if(err){
     console.log(err)

   }else{
             passport.authenticate("local")(req, res, function(err,result){
             res.redirect("/secrets");

             });
        }
 })

});





app.listen(3000, function() {
  console.log("Server started on port 3000");
});
