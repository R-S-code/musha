create database musha;

create table users (
  id int not null primary key auto_increment,
  username varchar(32) not null, 
  password varchar(128) not null, 
  imagepath varchar(255)
);

create table tokokiji (
  id int primary key auto_increment,
  tokosha_id int,
  title varchar(128) not null, 
  good int
);

insert into
tokokiji (tokosha_id, title, good)
values (3, "first article", 5);

insert into
tokokiji (tokosha_id, title, good)
values (3, "secound article", 12);