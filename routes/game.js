var mongo = require('mongodb'),
    geolib = require('geolib');
    // mongoose = require('mongoose');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('knowYourCity', server, {safe: true});

var locations = [];

//On start, populate locations 
//TODO: Differentiate citys (hash?)
db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'knowYourCity' database");
        db.collection('poi', {safe:true}, function(err, collection) {
            if (err) {
                console.log("The 'poi' collection doesn't exist.");
            }
            collection.find().toArray(function(err, items) {
                locations = items;
            });
        });
    }else{
    	console.log("db open failed");
    }
});

exports.startGame = function(req,res){
    //TODO test if status = active
    req.session.guesses = [];
    req.session.locations = locations.slice(0); //copy by value
    req.session.skips = 2;
    // printCurrentPois(req);
    req.session.startTime = Math.round(new Date().getTime() / 1000); //time game started
    req.session.currentScore = 0;
    res.send({startTime: req.session.startTime,nextPoi: getNextPoi(req), score: req.session.currentScore});
}

exports.skip = function(req,res){
    if(req.session.skips > 0){
        req.session.skips--;
        res.send({skips: req.session.skips, nextPoi: getNextPoi(req)});
    }else{
        res.send({skips: 0, msg: "No More Skips"});
    }
}

exports.endGame = function(req,res){
    status = 'end';
    var endTime = Math.round(new Date().getTime() / 1000);

    addGame(req);
    var topScores;

    db.collection('highScores', function(err, collection) {
        collection.find().sort({score: -1}).limit(10).toArray(function(err, items) {
            topScores = items;
        });
    });
    res.send({score: req.session.currentScore, topScores: topScores});
}

exports.getScore = function(req,res){
    res.send({score: req.session.currentScore});
}

exports.sendGuess = function(req,res){
    //TODO test if startTime is more than 30 seconds ago, and if so, send an endGame and return

	var lat = req.params.lat;
	var lon = req.params.lon;

	var distance = geolib.getDistance(
   		{latitude: lat, longitude: lon}, 
    	{latitude: req.session.currentLocation.loc[0], longitude: req.session.currentLocation.loc[1]}
    );
	// var miles = metersToMiles(distance);

   
	req.session.currentScore += calculateScore(distance);
    req.session.currentScore = (req.session.currentScore < 0) ? 0 : req.session.currentScore; 
    req.session.guesses.push({poiId: req.session.currentLocation._id,distance: distance});

	res.send({score: req.session.currentScore, distance: distance, actualPos: req.session.currentLocation.loc, nextPoi: getNextPoi(req)});
}

exports.subHighScore = function(req,res){
    var highScore = {
        score: req.session.currentScore,
        name: req.params.name
    };
    db.collection('highScores', function(err, collection) {
        collection.insert(highScore, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred:'+err});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
            }
        });
    });
    res.send({msg: "success"}); 
}

exports.getAllPoi = function(req,res){
    db.collection('poi', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });  
}

exports.getHighScores = function(req,res){
    db.collection('highScores', function(err, collection) {
        collection.find().sort({score: -1}).toArray(function(err, items) {
            res.send(items);
        });//.sort({score: -1}).limit(10)
    });
}

var addGame = function(req) {
    var theGame = {
        // cityId: ObjectId("50f821eebce4be3804000002"),
        startTime: req.session.startTime,
        guesses: req.session.guesses,
        score: req.session.currentScore
    };
    db.collection('game', function(err, collection) {
        collection.insert(theGame, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
            }
        });
    });
}

var getNextPoi = function(req){
    if(req.session.locations.length == 0){
        req.session.locations = locations.slice(0);
    }
    var itemIndex = Math.floor(Math.random()*req.session.locations.length); //get random index
    req.session.currentLocation = req.session.locations.splice(itemIndex, 1)[0];  //remove item from session var, and return it
    // printCurrentPois(req);
    return req.session.currentLocation.name;
}

var printCurrentPois = function (req) {
    for(var x=0; x < req.session.locations.length; x++){
        console.log(x +": "+req.session.locations[x].name);
    }
}

var metersToMiles = function(m){
	var miles = m/1609.34;
	return miles.toFixed(3);
}

var calculateScore = function(m){
    var score = 1000-(m/2).toFixed(0);
    // return (score < -1000) ? -1000 : score;
    return (score < -500) ? -500 : score;
}