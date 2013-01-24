var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('knowYourCity', server, {safe: true});


exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving city: ' + id);
    db.collection('city', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};