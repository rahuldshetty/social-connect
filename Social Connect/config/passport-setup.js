const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var mysql = require('mysql');
const con = require('../db');

passport.serializeUser((user, done) => {
  done(null, user.uid);
});

passport.deserializeUser((uid, done) => {
  con.query("select * from user where uid=" + mysql.escape(uid), function (err, rows){
    done(err, rows[0]);
  });
});

passport.use("loginCheck", new LocalStrategy({
  usernameField:'email',
  passwordField:'password',
  passReqToCallback:true
  },
  function(req,email, password, done) {
    const usr = email;
    const psw = password;
    var sql = "SELECT * FROM user where email=" + mysql.escape(usr) + " and password=" + mysql.escape(psw);
      con.query(sql, function (err, result, fields) {
        if (err){
          return done(err);
        }
        if (!result.length){
          return done(null, false);
        }
        return done(null, result[0]);
      });
  }
));

passport.use("save", new LocalStrategy({   // 'login-signup' is optional 
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true },
  function(req, email, password, done) {
      
      var sql = "insert into user(uid,email,password,name,dob) values(" +mysql.escape(req.body.username) + "," + mysql.escape(req.body.email) + "," + mysql.escape(req.body.password) + "," + mysql.escape(req.body.name)+","+ mysql.escape(req.body.dob) +")";
      con.query(sql, function(err, result1, fields){
        sql = "SELECT * FROM user where email=" + mysql.escape(req.body.email) + " and password=" + mysql.escape(req.body.password);
        con.query(sql, function(err, result2, fields){
          done(null, result2[0]);
        });
    });
  }
));

module.exports = passport;
