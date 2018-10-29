const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const strategies = require('../config/passport-setup');
var mysql = require('mysql');
const con = require('../db');


const profileCheck = (req,res,next) => {
  if(req.user){
    res.redirect("/home/");
  } else {
    next();
  }
};

//auth login
router.get("/login", profileCheck,(req,res) => {
  res.render("login", {user: req.user});
});

//auth log out
router.get("/logout", (req,res) => {
  req.logout();
  res.redirect("/");
});

router.get("/register",profileCheck, (req,res) => {
  res.render("register");
});

router.post("/register",
   strategies.authenticate("save", {
    successRedirect: "/home/",
    failureRedirect: "/auth/register"
 }
 ));

router.post('/login',
  passport.authenticate('loginCheck', {
    successRedirect: "/home/",
    failureRedirect: '/auth/login'
   }));



router.post("/save",
  strategies.authenticate("save", {
    successRedirect: "/home/",
    failureRedirect: "/auth/signup"
 })
);


module.exports = router;