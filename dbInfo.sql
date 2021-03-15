create database musha;

create table users (
  id int not null primary key auto_increment,
  username varchar(32) not null, 
  password varchar(128) not null, 
  imagepath varchar(255)
);

create table posts (
  post_id int primary key auto_increment,
  contributor_id int not null,
  title varchar(128) not null, 
  artist  varchar(50) not null,
  contributed_time datetime,
  article varchar(3000) not null,
  foreign key (contributor_id) references users (user_id)
);

create table stock (
  stock_id int primary key auto_increment,
  user_id int,
  article_id int,
  foreign key (user_id) references users (user_id),
  foreign key (article_id) references users (user_id),
);

create table post_comments (
  comment_id int primary key auto_increment,
  post_id int,
  contributor_id int,
  comment varchar(500),
  foreign key (post_id) references posts (post_id),
  foreign key (contributor_id) references users (user_id)
);


create table good (
  good_id int primary key auto_increment,
  user_id int,
  article_id int,
  foreign key (user_id) references users (user_id),
  foreign key (post_id) references articles (post_id)
);
