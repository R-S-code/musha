create database musha;

create table users (
  id int not null primary key auto_increment,
  username varchar(32) not null, 
  password varchar(128) not null, 
  imagepath varchar(255)
);

create table articles (
  id int primary key auto_increment,
  contributor_id int,
  title varchar(128) not null, 
  good int,
  article varchar(21710)
);

insert into
articles (contributor_id, title, good, article)
values (3, "first article", 5, "hogehogehogehogehogehogehogehogehogehogehogehoge");

insert into
articles (contributor_id, title, good, article)
values (3, "second article", 12, "hogehogehogehogehogehogehogehogehogehogehogehoge");

insert into
articles (contributor_id, title, good, article)
values (3, "third article", 20, "hogehogehogehogehogehogehogehogehogehogehogehoge");

insert into
articles (contributor_id, title, good, article)
values (3, "4th article", 100, "hogehogehogehogehogehogehogehogehogehogehogehoge");

create table article_comments (
  id int primary key auto_increment,
  article_id int,
  contributor_id int,
  comment varchar(21710)
);

insert into
article_comments (article_id, contributor_id, comment)
values (1, 4, "ユーザーのコメントが入りますユーザーのコメントが入りますユーザーのコメントが入りますユーザーのコメントが入りますユーザーのコメントが入りますユーザーのコメントが入ります");
