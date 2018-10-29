const router = require('express').Router();
var mysql = require('mysql');
const con = require('../db');
var fs=require("fs");

var multer = require('multer');
var upload = multer({ dest: '/tmp' })

var d = new Date();
var curDate = d.getFullYear() + "-";
if(!(d.getMonth() + 1 > 9)){
  curDate += "0" + (d.getMonth() + 1) + "-" + d.getDate();
}

const authCheck = (req,res,next) => {
  if(!req.user){
    res.redirect("/auth/login");
  } else {
    next();
  }
};


router.get("/", authCheck, (req,res) => {

    var query="select * from post p where (( p.uid in ("+
        "select uid2 from friends where status='accepted' and uid1="+ mysql.escape(req.user.uid) +")) or ( uid = " + mysql.escape(req.user.uid)+ " ))  order by ptime desc"
    ;  
    con.query(query,(err,res1)=>{
        
        var userData=new Array();
        
        
            var query1="Select * from user";
            con.query(query1,(err2,res2)=>{
                if(!err2)
                {
                    for(var i=0;i<res1.length;i++){
                        
                        var cid=res1[i].uid;
                        var temp="";
                        for(var j=0;j<res2.length;j++)
                            if(res2[j].uid==cid)
                            {   
                                temp=res2[j];
                                break;
                            }

                        var img=temp.profile;
                        var data="";
                        if(img){
                        var buffer = new Buffer( img, 'binary' );
                        var bufferBase64 = buffer.toString('base64');
                        var header="data:image/png;base64,";
                        data=header+bufferBase64;
                        }
                        else{
                            data=null;
                        }

                        userData.push(
                            {
                                name:temp.name,
                                profile:data
                            }
                        );
                        
                    }
                    
                    res.render("userfeed", {
                        user: req.user,
                        posts:res1,
                        userData:userData
                    });


                }
            });

        
        
      
    });
});


router.get("/post/:pid",authCheck,(req,res)=>{
    var pid=req.params.pid;

    var validquery="select * from post where uid="+mysql.escape(req.user.uid)+" or uid in ( select uid2 from friends where uid1="+mysql.escape(req.user.uid)+" and status='accepted')";
    con.query(validquery,(err4,res4)=>{
        if(!err4)
        {
            var found=false;
            for(var i=0;i<res4.length;i++)
            {
                if(res4[i].pid==pid)
                {
                    found=true;
                    break;
                }
            }
            if(found)
            {

                var query="select * from post where pid="+mysql.escape(pid);
    con.query(query,(err,res1)=>{
        if(!err)
        {
            var data=res1[0];
            var uid=data.uid;
            

                var query2="select profile,name from user where uid="+mysql.escape(uid);
                con.query(query2,(err2,res2)=>{
                    if(!err2)
                    {
                        var user=res2[0];
                        var img=user.profile;

                        var imgdata="";
                        if(img){
                            var buffer = new Buffer( img, 'binary' );
                            var bufferBase64 = buffer.toString('base64');
                            var header="data:image/png;base64,";
                            imgdata=header+bufferBase64;
                        }
                        else{
                            imgdata=null;
                        }
                        var postProfileImage=imgdata;

                        var commentQuery="select * from comments c,user u where pid="+mysql.escape(pid) + " and c.uid=u.uid order by c.ctime";
                        con.query(commentQuery,(err3,res3)=>{

                            if(!err3)
                            {
                                var commentimage=new Array();
                                for(var i=0;i<res3.length;i++)
                                {
                                    var img=res3[i].profile;
                                    var imgdata="";
                                    if(img){
                                        var buffer = new Buffer( img, 'binary' );
                                        var bufferBase64 = buffer.toString('base64');
                                        var header="data:image/png;base64,";
                                        imgdata=header+bufferBase64;
                                    }
                                    else{
                                        imgdata=null;
                                    }    
                                    commentimage.push(imgdata);
                                }
                                var likeQuery = "select * from likes where pid="+mysql.escape(pid)+" and uid="+mysql.escape(req.user.uid);
                                con.query(likeQuery,(err7,res7)=>{
                                    if(!err7)
                                    { 
                                        var liked=true;
                                        if(res7.length==0)
                                        {
                                            liked=false;
                                        }  

                                        var noOfLikesQuery="select count(*) as nolikes from likes where pid="+mysql.escape(pid);
                                        con.query(noOfLikesQuery,(err8,res8)=>{
                                            if(!err8)
                                            {
                                                var nolikes=res8[0].nolikes;
                                                res.render("post",{
                                                    userimage:postProfileImage,
                                                    user:user,
                                                    post:data,
                                                    me:req.user,
                                                    commentimage:commentimage,
                                                    comment:res3,
                                                    liked:liked,
                                                    nolikes:nolikes
                                                });
        
                                            }
                                        });

                                        
                                    }
                                });
                            
                               
                             }

                        });
                    }
                });

            }
        });

            }
            else{
                res.redirect("/home/");
            }

        }
    });

    
});

router.get("/delpost/:pid",authCheck,(req,res)=>{
    var pid=req.params.pid;
    var query0="delete from comments where pid="+mysql.escape(pid);
    con.query(query0,(err2,res2)=>{
        if(!err2)
        {
            var query="delete from post where pid="+mysql.escape(pid)+" and uid="+mysql.escape(req.user.uid);
            con.query(query,(err,res1)=>{
                if(!err)
                {
                    res.redirect("/home");
                }
            });
        }
    });

    
});

router.get("/post/likepost/:pid/:ouid",authCheck,(req,res)=>{
    var pid=req.params.pid;
    var ouid=req.params.ouid;

    var checkLike="select * from likes where pid="+mysql.escape(pid)+" and uid="+mysql.escape(req.user.uid);
    con.query(checkLike,(err3,res3)=>{
        if(!err3 && res3.length==0)
        {
            var checkFriends="select * from friends where uid1="+mysql.escape(ouid)+" and uid2="+mysql.escape(req.user.uid)+" and status='accepted'";
            con.query(checkFriends,(err,res1)=>{
                if((!err && res1.length==1) || ouid==req.user.uid )
                {
                    var time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                    var likeQuery="insert into likes(pid,ltime,uid) values("+mysql.escape(pid)+","+mysql.escape(time)+","+mysql.escape(req.user.uid)+")";
                    con.query(likeQuery,(err2,res2)=>{
                        if(!err2){
                            res.redirect("/home/post/"+pid);
                        }
                    });
        
                }
                else
                    res.redirect("/home/post/"+pid);
            });
        }
        else{
            var deleteQuery="delete from likes where pid="+mysql.escape(pid)+" and uid="+mysql.escape(req.user.uid);
            con.query(deleteQuery,(err4,res4)=>{
                if(!err4)
                {
                    res.redirect("/home/post/"+pid);
                }
            });

        }
    });

   

});


router.post("/post/addcomment/:pid",authCheck,(req,res)=>{
    var pid=req.params.pid;
    var uid=req.user.uid;
    var cdesc=req.body.comment;
    var time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var query="insert into comments(cdesc,ctime,pid,uid) values("+mysql.escape(cdesc)+","+mysql.escape(time)+","+mysql.escape(pid)+","+mysql.escape(uid)+");";
    con.query(query,(err,res1)=>{
        if(!err)
        {
            res.redirect("/home/post/"+pid);
        }
    });
});

router.get("/delcomment/:pid/:cid",authCheck,(req,res)=>{
    var pid=req.params.pid;
    var cid=req.params.cid;
    var query="delete from comments where cid="+mysql.escape(cid) +" and uid="+mysql.escape(req.user.uid);
    con.query(query,(err,res1)=>{
        if(!err)
        {
            res.redirect("/home/post/"+pid);
        }
    });
});

router.get("/profile",authCheck,(req,res)=>{
    var img = req.user.profile;
    var data="";
    if(img){
    var buffer = new Buffer( img, 'binary' );
    var bufferBase64 = buffer.toString('base64');
    var header="data:image/png;base64,";
     data=header+bufferBase64;
    }
    else{
        data=null;
    }

    var query = "select * from post where uid="+mysql.escape(req.user.uid)+" order by ptime desc;";

    con.query(query,(err,res1)=>{
        res.render("profile",{
            user:req.user,
            userimage:data,
            posts:res1
        });

    });

    
});

router.get("/status/:uid1/:uid2",authCheck,(req,res)=>{
    var uid1=req.params.uid1;
    var uid2=req.params.uid2;
    if(uid1==uid2)
    {
        res.redirect("/home/edit");
    }
    else{
        var queryStatus="select * from friends where uid1="+mysql.escape(uid1)+" and uid2="+mysql.escape(uid2);
        con.query(queryStatus,(err,res1)=>{
            if(res1.length==0)
            {
                //Not Friends
                var query1="Insert into friends(uid1,uid2,status) values(" + mysql.escape(uid1)+"," + mysql.escape(uid2) + ","+mysql.escape("send") + ")";
                var query2="Insert into friends(uid1,uid2,status) values(" + mysql.escape(uid2)+"," + mysql.escape(uid1) + ","+mysql.escape("recv") + ")";
                con.query(query1,(err1,res2)=>{

                    if(!err1)
                    {
                        con.query(query2,(err2,res3)=>{
                            
                            res.redirect("/home/profile/"+uid2);

                        });
                    }

                });

            }
            else if(res1[0].status=="send" || res1[0].status=="accepted"){
                //Cancel Existing friend request
                var query1="Delete from friends where (uid1="+mysql.escape(uid1)+" and uid2="+ mysql.escape(uid2) + ") or (uid1=" + mysql.escape(uid2)+" and uid2="+mysql.escape(uid1)+")" ;

                
                con.query(query1,(err1,res2)=>{

                  if(!err1){
                     res.redirect("/home/profile/"+uid2);

                    
                }

                });        


            }
            else if(res1[0].status=="recv")
            {
                var query="update friends set status="+mysql.escape("accepted") + " where (uid1="+mysql.escape(uid1)+" and uid2="+mysql.escape(uid2)+") or (uid1="+mysql.escape(uid2)+" and uid2="+mysql.escape(uid1)+");";
                con.query(query,(err1,res1)=>{
                    if(!err1)
                    {
                        res.redirect("/home/profile/"+uid2);
                    }
                });

            }
            

        });


    }
});


router.get("/statusdel/:uid1/:uid2",authCheck,(req,res)=>{
    var uid1=req.params.uid1;
    var uid2=req.params.uid2;
    var query1="Delete from friends where (uid1="+mysql.escape(uid1)+" and uid2="+ mysql.escape(uid2) + ") or (uid1=" + mysql.escape(uid2)+" and uid2="+mysql.escape(uid1)+")" ;
    
    con.query(query1,(err1,res2)=>{
        if(!err1)
        {
            res.redirect("/home/profile/"+uid2);
        }
    });        

});

router.get("/profile/:uid",authCheck,(req,res)=>{
    var otheruid=req.params.uid;
    var query1 = "select * from user where uid="+mysql.escape(otheruid);
    con.query(query1,(err,res1)=>{
        if(err)
        {
            res.redirect("/home");
        }
        else{

            var img = res1[0].profile;
            var data="";
            if(img){
            var buffer = new Buffer( img, 'binary' );
            var bufferBase64 = buffer.toString('base64');
            var header="data:image/png;base64,";
             data=header+bufferBase64;
            }
            else{
                data=null;
            }
        
            var query = "select * from post where uid="+mysql.escape(otheruid)+" order by ptime desc;";
        
            con.query(query,(err,res2)=>{

                if(err)
                {
                    res.redirect("/home");
                }
                else{
                    var queryStatus="select * from friends where uid1="+mysql.escape(req.user.uid)+" and uid2="+mysql.escape(otheruid);
                    con.query(queryStatus,(err,res3)=>{
                        if(err)
                        {
                            res.redirect("/home");
                        }
                        else{
                            var status="";

                            if(otheruid==req.user.uid)
                                status="Edit Profile"
                            else if(res3.length==0){
                                status="Add As Friend";
                                res2=[];
                            }
                            else{
                                if(res3[0].status=="send"){
                                    res2=[];
                                    status="Cancel Friend Request";
                                }
                                else if(res3[0].status=="recv"){
                                    res2=[];
                                    status="Accept Friend Request"
                                }
                                else if(res3[0].status=="accepted")
                                {
                                    status="Unfriend";
                                }
                                
                                }
                            

                            res.render("otherprofiles",{
                                user:res1[0],
                                userimage:data,
                                posts:res2,
                                status:status,
                                me:req.user
                            });
                        
                        }
                    });


            }
        
            });

            

        }
    });

});

router.get("/friends",authCheck,(req,res)=>{
    var uid=req.user.uid;
    var query="select * from user where uid in ( select uid2 from friends where uid1=" +mysql.escape(uid)+" and status='accepted')";
    con.query(query,(err,res1)=>{
        if(err)
        {
            res.redirect('/home/');
        }
        else{
            var arr=new Array();

            res1.forEach((v)=>{
                var img=v.profile;
                var data="";
                if(img)
                {
                    var buffer = new Buffer( img, 'binary' );
                    var bufferBase64 = buffer.toString('base64');
                    var header="data:image/png;base64,";
                    data=header+bufferBase64;
                }
                else{
                    data=null;
                }
                arr.push(data);
            });

            res.render("friends",{
                users:res1,
                userimages:arr
            });
        }

    });
});


router.get("/requests",authCheck,(req,res)=>{
    var uid=req.user.uid;
    var query="select * from user where uid in ( select uid2 from friends where uid1=" +mysql.escape(uid)+" and status='recv')";
    con.query(query,(err,res1)=>{
        if(err )
        {
            res.redirect('/home/');
        }
        else{
            var arr=new Array();

            res1.forEach((v)=>{
                var img=v.profile;
                var data="";
                if(img)
                {
                    var buffer = new Buffer( img, 'binary' );
                    var bufferBase64 = buffer.toString('base64');
                    var header="data:image/png;base64,";
                    data=header+bufferBase64;
                }
                else{
                    data=null;
                }
                arr.push(data);
            });

            res.render("requests",{
                users:res1,
                userimages:arr
            });
        }

    });
});


router.post("/search",authCheck,(req,res)=>{
    var name=req.body.sname;
    var query="select * from user where name like "+mysql.escape("%"+name+"%") + " or uid like "+mysql.escape("%"+name+"%")+";";
    con.query(query,(err,res1)=>{
        if(err || res1.length==0)
        {
            res.redirect('/home/');
        }
        else{
            var arr=new Array();

            res1.forEach((v)=>{
                var img=v.profile;
                var data="";
                if(img)
                {
                    var buffer = new Buffer( img, 'binary' );
                    var bufferBase64 = buffer.toString('base64');
                    var header="data:image/png;base64,";
                    data=header+bufferBase64;
                }
                else{
                    data=null;
                }
                arr.push(data);
            });

            res.render("search",{
                users:res1,
                userimages:arr
            });
        }

    });

});

router.get("/edit",authCheck,(req,res)=>{
    res.render("edit",{user:req.user});
});

router.post("/edit",upload.single('file'),authCheck,(req,res)=>{
    var email=req.body.email;
    var name=req.body.name;
    var dob=req.body.dob;
    var pwd=req.body.password;
    var pic=req.file;
    
    var b64= new Buffer(fs.readFileSync(pic.path)).toString("base64");    
    var bufferValue = Buffer.from(b64,"base64");
    let array = new Array();
    for (data of bufferValue) array.push(data);
    if(email && name && dob &&  pwd){
    var query="update user set email="+mysql.escape(email)+",name="+mysql.escape(name)+",dob="+mysql.escape(dob)+",password="+mysql.escape(pwd)+ ",profile=CHAR("+array+") where uid="+mysql.escape(req.user.uid);
    con.query(query,(err,res1)=>{
        console.log(err,res1,"hello");
        if(err)
        {
            res.redirect("/home/edit");
        }
        else{
            res.redirect("/home/profile");
        }   
    });
    }
    else{
        res.redirect("/home/edit");
    }
});

router.get("/cpost", authCheck, (req,res) => {
  res.render("cpost");
});

router.post("/cpost", authCheck, (req,res) => {
  var title=req.body.title;
  var desc=req.body.desc;
  var time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  var query="insert into post(ptitle,pdesc,ptype,ptime,uid) values("+
  mysql.escape(title)+","+mysql.escape(desc)+","+mysql.escape("text")+","+ mysql.escape(time)
  +","+ mysql.escape(req.user.uid)+");";
  con.query(query,function(err,res1){
    if(err){
      res.redirect('/home/cpost');
    }
    else{
      res.redirect('/home/');
    }

  });
});


module.exports = router;