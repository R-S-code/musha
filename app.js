const express = require('express');
const mysql = require('mysql');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');

// 初期設定
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

// データベース接続設定
const arr = require('./.db_sec_info.js');
const connection = mysql.createConnection({
  host: arr.host,
  user: arr.dbuser,
  password: arr.dbpassword,
  database: arr.db,
});

// use
app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);
app.use((req, res, next) => {
  if (req.session.userid === undefined) {
    console.log('ログインしていません');
    res.locals.isLoggedIn = false;
  } else {
    console.log('ログインしています');
    res.locals.userid = req.session.userid;
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
  }
  next();
});

// ルーティング
// トップ
app.get('/', (req, res) => {
  connection.query(
    'SELECT post_id, title, artist, username, contributed_time FROM posts JOIN users ON posts.contributor_id = users.user_id ORDER BY post_id DESC',
    (error, results) => {
      console.log(results);
      res.render('top.ejs', {posts: results});
    }
  );
});

// 登録処理
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
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hash],
        (error, results) => {
          if(error) {
            errors.push('エラーが発生しました');
            console.log(error);
            res.render('subscribe.ejs', { errors: errors }); 
          } else {
            req.session.userid = results.insertId;
            req.session.username = username;
            console.log(req.session.userId);
            console.log(req.session.username);
            console.log(results);
            res.redirect('/'); 
          }
        }
      );
    })
  }
)

// ログイン処理
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
            req.session.userid = results[0].user_id;
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

// ログアウト
app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    res.redirect('/');
  });
});

// マイページ処理
app.get('/mypage', (req, res) => {
  let userid = req.session.userid;
  connection.query(
    'SELECT * FROM posts WHERE contributor_id = ?',
    [userid],
    (error, results) => {
      if(error) {
        console.log("mypage get error");
        console.log(error);
        res.redirect("/");
      } else {
        res.render('mypage.ejs', {posts: results});
      }
    }
  )
  
});
app.post('/name_change', (req, res) => {
  const username = req.body.username;
  const userid = req.session.userid;

  connection.query(
    'UPDATE users SET username = ? WHERE user_id = ?',
    [username, userid],
    (error1, result1) => {
      if(error1) {
        console.log('ユーザーネーム変更エラー');
        res.redirect('/mypage'); 
      } else {
        connection.query(
          'SELECT username FROM users WHERE id = ?',
          [userid],
          (error2, result2) => {
            console.log('yes');
            console.log(result2);
            req.session.username = result2[0].username;
            res.redirect("/mypage");
          }
        )
      }
    }
  )
}); 

app.get('/delete_article/:id', (req, res) => {
  const article_id = req.params.id;
  connection.query(
    'DELETE FROM posts WHERE article_id = ?',
    [article_id],
    (error, result)=> {
      if(error) {
        console.log("記事削除エラー");
        console.log(error);
        res.redirect("/");
      } else {
        console.log(result);
        res.redirect("/mypage");
      }
    }
  )
});
      
// 画像を変更するための処理
app.get('/change_icon', (req, res) => {
  res.render('change_icon.ejs',);
});

const storage = multer.diskStorage({
  destination: (req, file, cb)=> {
    // 保存先
    cb(null, './public/userIcon')
  },
  filename: (req, file, cb)=> {
    // 保存するファイルの名前
    const userid = req.session.userid;
    cb(null, `${userid}.jpg`)
  }
})

const upload = multer({storage: storage});

app.post('/change_icon', upload.single('file'), (req,res)=> {
  const userid = req.session.userid;
  const imagepath = "/userIcon/" + userid + ".jpg";
  connection.query(
    'UPDATE users SET imagepath = ? WHERE user_id = ?',
    [userid, imagepath],
    (error, result)=> {
      if(error) {
        console.log("イメージパス変更エラー");
        console.log(error);
        res.redirect('/mypage');
      } else {
        console.log("イメージパス変更!");
        console.log(result);
        res.redirect('/mypage');
      }
    }
  )
});


// 記事詳細
app.get('/postDetail/:id', (req,res) => {
  reading_id = req.params.id;
  post_id = req.params.id;
  connection.query(
    'SELECT * FROM posts JOIN users ON posts.contributor_id = users.user_id  WHERE posts.post_id = ?',
    [post_id],
    (error1, results1) => {
      console.log(results1);
      connection.query(
        'SELECT * FROM post_comments JOIN users ON post_comments.contributor_id = users.user_id where post_comments.post_id = ?',
        [post_id],
        (error2, results2) => {
          res.render('post_detail.ejs', {
            post: results1,
            post_comments: results2
          });
        }
      )
    }
  )
});
app.post('/postComment/:id', (req, res) => {
  const reading_id = req.params.id;
  connection.query(
    'INSERT INTO post_comments (post_id, contributor_id, comment) values (?, ?, ?)',
    [reading_id, req.session.userid, req.body.comment],
    (error, result) => {
      if(error) {
        console.log("コメントエラー");
        console.log(error);
        res.redirect(`/postDetail/${reading_id}`);
      } else {
        console.log(reading_id);
        console.log(req.session.userid);
        console.log(req.body.comment);
        res.redirect(`/postDetail/${reading_id}`);
      }
    }
  )
});

// 投稿処理
app.get('/post', (req, res) => {
  res.render('post.ejs');
});
app.post('/post', (req, res) => {
  const title =  req.body.title;
  const artist =  req.body.artist;
  const contents = req.body.contents;
  const userid = req.session.userid;
  const datetime = new Date();

  connection.query(
    "INSERT INTO posts (contributor_id, title, artist, article, contributed_time) VALUES (?, ?, ?, ?, ?)",
    [userid, title, artist, contents, datetime],
    (error, result)=> {
      if(error) {
        console.log("記事投稿エラー");
        console.log(error);
        res.redirect("/");
      } else {
        console.log(result);
        res.redirect("/");
      }
    }
  )
})

// ストック
app.get('/stock', (req, res) => {
  const userid = req.session.userid;

  connection.query(
    "SELECT * FROM stock JOIN posts ON stock.post_id = posts.post_id JOIN users ON stock.user_id = users.user_id WHERE stock.user_id = ?",
    [userid],
    (error, result)=> {
      if(error) {
        console.log("ストック取得エラー");
        console.log(error);
      } else {
        console.log("ストック取得");
        console.log(result);
        res.render('stock.ejs', {stocks: result});
      }
    }
  )
});
// ページ読み込み時ストック確認
app.get("/stock_axios_check", (req, res)=>{
  postid = Number(req.query.id);
  userid = req.session.userid;

  connection.query(
    "SELECT * FROM stock WHERE post_id = ? AND user_id = ?",
    [postid, userid],
    (error, result)=> {
      if(error) {
        console.log("ストック取得エラー");
        console.log(error);
      } else {
        console.log(postid);
        console.log(userid);
        console.log("ストック確認");
        console.log(result);
        res.send({result});
      }
    }
  )
});

// ストックボタンを押した時
app.get("/stock_axios", (req, res)=>{
  postid = Number(req.query.id);
  userid = req.session.userid;
  
  connection.query(
    "INSERT INTO stock (post_id, user_id) VALUES (? ,?)",
    [postid, userid],
    (error, result)=> {
      if(error) {
        console.log("ストックエラー");
        console.log(error);
      } else {
        console.log("ストック成功");
        console.log(result);
        res.send({result})
      }
    }
  )
})
// ストックから外すを押した時
app.get("/unstock_axios", (req, res)=>{
  postid = Number(req.query.id);
  userid = req.session.userid;
  
  connection.query(
    "DELETE FROM stock WHERE post_id = ? AND user_id = ?",
    [postid, userid],
    (error, result)=> {
      if(error) {
        console.log("アンストックエラー");
        console.log(error);
      } else {
        console.log("アンストック成功");
        console.log(result);
        res.send({result})
      }
    }
  )
})

const port = 3800;
console.log(`running ${port}`);
console.log(`running 4000 on browser-sync`);
app.listen(port);


