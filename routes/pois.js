var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('knowYourCity', server, {safe: true});

var locations = [];
var currentLocation;

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'knowYourCity' database");
        db.collection('poi', {safe:true}, function(err, collection) {
            if (err) {
                console.log("The 'poi' collection doesn't exist. Creating it with sample data...");
                //populateDB();
            }
            collection.find().toArray(function(err, items) {
                locations = items;
            });
        });
    }
});

exports.index = function(req,res){
    if(!req.session.locations){ //Create the location session variable if it doesn't exist
        req.session.locations = locations.slice(0); //copy by value
    }
    res.send('hello');
}

exports.getNextPoi = function(req,res){
    if(!req.session.locations || req.session.locations.length === 0){ //Create the location session variable if it doesn't exist
        console.log('reset locations');
        req.session.locations = locations.slice(0); //copy by value
    }
    var itemIndex = Math.floor(Math.random()*req.session.locations.length); //get random index
    currentLocation = req.session.locations.splice(itemIndex, 1)[0];  //remove item from session, and return it
    console.log(currentLocation); 
    console.log("locations");
    res.send({name: currentLocation.name});
}

exports.resetGame = function(req,res){
   req.session.locations = locations.slice(0);
   res.send('test');
}



exports.test = function(req, res){
    // res.send({name: getThis});
    console.log(currentLocation);

    // var self = this;
    // console.log('in test');
    // req.session.city = 'Atlanta';   
    res.send({msg: currentLocation});
};

exports.test2 = function(req, res){
    console.log('in test2');
    console.log(req.session.city);
    res.send({msg:"test2"});

};

// exports.findById = function(req, res) {
//     var id = req.params.id;
//     console.log('Retrieving wine: ' + id);
//     db.collection('wines', function(err, collection) {
//         collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
//             res.send(item);
//         });
//     });
// };

// exports.findAll = function(req, res) {
//     db.collection('wines', function(err, collection) {
//         collection.find().toArray(function(err, items) {
//             res.send(items);
//         });
//     });
// };

// exports.addWine = function(req, res) {
//     var wine = req.body;
//     console.log('Adding wine: ' + JSON.stringify(wine));
//     db.collection('wines', function(err, collection) {
//         collection.insert(wine, {safe:true}, function(err, result) {
//             if (err) {
//                 res.send({'error':'An error has occurred'});
//             } else {
//                 console.log('Success: ' + JSON.stringify(result[0]));
//                 res.send(result[0]);
//             }
//         });
//     });
// }




