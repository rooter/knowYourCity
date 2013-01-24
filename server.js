var express = require('express'),
    path = require('path'),
    http = require('http'),
    
    game = require('./routes/game'),
    city = require('./routes/city');

var app = express(),
    store = new express.session.MemoryStore;

app.use(express.cookieParser()); //Change for production
app.use(express.session({ secret: 'm1l0C0ol', store: store }));

app.configure(function () {
    app.set('port', process.env.PORT || 80);
    app.use(express.logger('dev'));  /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    app.use(express.static(path.join(__dirname, 'public')));
});

app.get('/startGame', game.startGame);
app.get('/endGame', game.endGame);
app.get('/guess/:lat/:lon', game.sendGuess);
app.get('/skip', game.skip);
app.get('/city/:id', city.findById);
app.get('/subHighScore/:name',game.subHighScore);
app.get('/getHighScores',game.getHighScores);
app.get('/getScore',game.getScore);
app.get('/getAllPoi',game.getAllPoi);


http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
