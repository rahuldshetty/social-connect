create database socialdb;
use socialdb;

create table user(
	uid varchar(20) primary key,
	name varchar(30) not null,
    dob date,
    email varchar(100),
    password varchar(150),
	profile longblob
);


create table friends(
	uid1 varchar(20),
    uid2 varchar(20),
    friendsince date,
    status varchar(10),
	foreign key(uid1) references user(uid),
    foreign key(uid2) references user(uid)
);

create table post(
	pid int primary key AUTO_INCREMENT,
    ptitle varchar(20),
    pdesc varchar(200),
    ptype varchaR(10),
    ptime timestamp,
    uid varchar(20),
    foreign key(uid) references user(uid)
);

create table comments(
	cid int primary key AUTO_INCREMENT,
    cdesc varchar(200),
    ctime timestamp,
    pid int,
    uid varchar(20),
    foreign key(uid) references user(uid),
	foreign key(pid) references post(pid)
);

create table likes(
	lid int primary key AUTO_INCREMENT,
    ltime timestamp,
    pid int,
	uid varchar(20),
    foreign key(uid) references user(uid),
    foreign key(pid) references post(pid)
);
