const express = require('express');
const mysql = require('mysql');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

const arr = require('./.db_sec_info.js');
const connection = mysql.createConnection({
  host: arr.host,
  user: arr.dbuser,
  password: arr.dbpassword,
  database: arr.db,
});

app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  if (req.session.userId === undefined) {
    console.log('ログインしていません');
    res.locals.isLoggedIn = false;
  } else {
    console.log('ログインしています');
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
  }
  next();
});

app.get('/', (req, res) => {
  connection.query(
    'SELECT articles.id, title, good, username FROM articles Join users ON articles.contributor_id = users.id',
    (error, results) => {
      console.log(results);
      res.render('top.ejs', {articles: results});
    }
  );
});

app.get('/subscribe', (req, res) => {
  res.render('subscribe.ejs', {errors: []});
});

app.post('/subscribe', 
  (req, res, next) => {
    console.log('入力値チェック');
    const username = req.body.subscribe_username;
    const password = req.body.subscribe_password;
    const errors = [];

    if (username === '') {
      errors.push('ユーザー名が空です');
    }
    if (password === '') {
      errors.push('パスワードが空です');
    }
    if (password.length <= 3) {
      errors.push('パスワードは4文字以上です');
    }
    if (errors.length > 0) {
      res.render('subscribe.ejs', { errors: errors });
    } else {
      next();
    }
  },
  (req, res, next) => {
    console.log('ユーザー名重複チェック');
    const username = req.body.subscribe_username;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (error, results) => {
        if (results.length > 0) {
          errors.push('そのユーザー名は既に存在しています');  
          res.render('subscribe.ejs', { errors: errors }); 
        } else {
          next();
        }
      }
    );
  },
  (req, res) => {
    const username = req.body.subscribe_username;
    const password = req.body.subscribe_password;
    const errors = [];
    bcrypt.hash(password, 10, (error, hash) => {
      connection.query(
        'insert into users (username, password) values (?, ?)',
        [username, hash],
        (error, results) => {
          if(error) {
            errors.push('エラーが発生しました');
            res.render('subscribe.ejs', { errors: errors }); 
          } else {
            req.session.userId = results.insertId;
            req.session.username = username;
            res.redirect('/'); 
          }
        }
      );
    })
  }
)

app.get('/login', (req, res)  => {
  res.render('login.ejs', {errors: []});
});
app.post('/login', 
  (req, res, next) => {
    console.log('入力値チェック');
    const username = req.body.login_username;
    const password = req.body.login_password;
    const errors = [];
    if (username === '') {
      errors.push('ユーザー名が空です');
    }
    if (password === '') {
      errors.push('パスワードが空です');
    }
    if (errors.length > 0) {
      res.render('login.ejs', { errors: errors });
    } else {
      next();
    }
  },
  (req, res) => {
  const username = req.body.login_username;
  const errors = [];
  connection.query(
    'SELECT * FROM users WHERE username = ?',
    [username],
    (error, results) => {
      if (results.length > 0) {
        const plain_password = req.body.login_password;
        const hash_password = results[0].password;
        bcrypt.compare(plain_password, hash_password, (error, isEqual) => {
          if (isEqual){
            console.log('認証に成功しました');          
            req.session.userId = results[0].id;
            req.session.username = results[0].username;
            res.redirect('/');
          } else {
            console.log('認証に失敗しました');
            errors.push('パスワードが違います');
            res.render('login.ejs', { errors: errors });
          }
        });
      } else {
        errors.push('ユーザーが存在しません');
        res.render('login.ejs', {errors: errors});
      }
    }
  )
});

app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    res.redirect('/');
  });
});

app.get('/mypage', (req, res) => {
  res.render('mypage.ejs');
});

const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, './public/userIcon')
  },
  filename: function(req, file, cb){
    cb(null, 'image.jpg')
  }
})

const upload = multer({storage: storage})
app.post('/mypage', upload.single('file'), function(req,res){
  res.redirect('/mypage');
});

app.get('/articleDetail/:id', (req,res) => {
  article_id = req.params.id;
  connection.query(
    'SELECT * FROM articles Join users ON articles.contributor_id = users.id  WHERE articles.id = ?',
    [article_id],
    (error1, results1) => {
      connection.query(
        'SELECT * FROM article_comments Join users ON article_comments.contributor_id = users.id where article_comments.article_id = ?',
        [article_id],
        (error2, results2) => {
          res.render('article_detail.ejs', {
            article: results1,
            article_comments: results2,
          });
        }
      )
    }
  )
 
});

const port = 3005;
console.log(`running ${port}`);
console.log(`running 4000 on browser-sync`);
app.listen(port);
