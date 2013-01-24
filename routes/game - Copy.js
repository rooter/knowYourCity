var mongo = require('mongodb'),
    geolib = require('geolib');
    // mongoose = require('mongoose');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('knowYourCity', server, {safe: true});

var locations = [];

//all these need to be in the session
var currentLocation,  
    currentScore = 0, 
    city,
    timer,
    startTime,
    guesses = [],
    status = 'active';
    
// mongoose.connect('mongodb://localhost/knowYourCity');
// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function callback () {
//   // yay!
// });
// var gameSchema = mongoose.Schema({
//     // city: ObjectId,
//     startTime: Number,
//     guesses: Array,
//     score: Number
// });
// var Game = mongoose.model('Game', gameSchema);

// var testGame;



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
                // console.log(locations);
                // for(var x=0; x < locations.length; x++){
                //         console.log(x +": "+locations[x]);
                // }
            });
        });
    }else{
    	console.log("db open failed");
    }
});

// exports.index = function(req,res){
//     if(!req.session.locations){ //Create the location session variable if it doesn't exist
//         req.session.locations = locations.slice(0); //copy by value
//     }
//     res.send('hello');
// }

exports.startGame = function(req,res){
    //TODO test if status = active
   

    req.session.locations = locations.slice(0); //copy by value
    // printCurrentPois(req);
    startTime = Math.round(new Date().getTime() / 1000); //time game started
    currentScore = 0;
    //, actualPos: currentLocation.
    
    res.send({startTime: startTime,nextPoi: getNextPoi(req), score: 0});
    // testGame = new Game({startTime: startTime,score: 0});
    // console.log(testGame);

    // db.game.insert({name: 'test'});

}

addGame = function() {
    var theGame = {
        // cityId: ObjectId("50f821eebce4be3804000002"),
        startTime: startTime,
        guesses: guesses,
        score: currentScore
    };
    // console.log('Adding wine: ' + JSON.stringify(wine));
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


exports.endGame = function(req,res){
    status = 'end';
    var endTime = Math.round(new Date().getTime() / 1000);

    addGame();
    // console.log(endTime - startTime);
    //Store game 
    res.send({score: currentScore});
}

// exports.gameStatus = function (req,res) {
//     res.send({gameStatus: status})
// }

exports.sendGuess = function(req,res){
    //TODO test if startTime is more than 30 seconds ago, and if so, send an endGame and return

	var lat = req.params.lat;
	var lon = req.params.lon;

	var distance = geolib.getDistance(
   		{latitude: lat, longitude: lon}, 
    	{latitude: currentLocation.loc[0], longitude: currentLocation.loc[1]}
    );
	var miles = metersToMiles(distance);
	currentScore += calculateScore(distance);

    guesses.push({poiId: currentLocation._id,distance: distance});

	res.send({score: currentScore, distance: distance, actualPos: currentLocation.loc, nextPoi: getNextPoi(req)});


    // db.guess.
}

var getNextPoi = function(req){
    if(req.session.locations.length == 0){
        req.session.locations = locations.slice(0);
    }
    // printCurrentPois();
    var itemIndex = Math.floor(Math.random()*req.session.locations.length); //get random index
    currentLocation = req.session.locations.splice(itemIndex, 1)[0];  //remove item from session var, and return it
    // console.log("# of pois left: "+req.session.locations.length);
    // console.log(currentLocation);
    // printCurrentPois(req);
    return currentLocation.name;
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
    var score = 1000-(m/2);
    return (score < -1000) ? -1000 : score;
}
// var calculateScore = function(miles){
// 	if(miles <= 0.0625){ // 1/16
// 		return 100;
// 	}else if(miles <= 0.125){ // 1/8
// 		return 50;
// 	}else if(miles <= 0.25){ // 1/4
// 		return 40;
// 	}else if(miles <= 0.5){  // 1/2
// 		return 30;
// 	}else if(miles <= 0.75){  //  3/4
// 		return 20;
// 	}else if(miles <= 1){
// 		return 10;
// 	}else{
// 		return -10;
// 	}
// }
