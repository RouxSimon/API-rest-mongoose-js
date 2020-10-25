const { ObjectID, ObjectId } = require('bson');
var express = require('express'); 
var mongoose = require('mongoose');

// Nous définissons ici les paramètres du serveur.
var hostname = 'localhost'; 
var port = 3000; 

// Nous créons un objet de type Express. 
var app = express(); 

var bodyParser = require("body-parser"); 
app.use(bodyParser.json());
 

mongoose.connect('mongodb://localhost/masterclass_project', function(err) {
  if (err) { throw err; }
});

let restoSchema = new mongoose.Schema({
	// _id : ObjectId,
	location: {
		type: String,
		coordinates: [Number]     
	},
	name : String,
	price : { 
		rand : Number
	},
	reviews : {
		rand : [Number]
	}
});

//--------------------------------------------------------------------------------------

var RestoModel = mongoose.model('restaurants', restoSchema);

var myRouter = express.Router(); 


myRouter.route('/')
.all(function(req, res) { 
	res.json({message: 'Salut', method: req.method});
});

myRouter.route('/restaurants/:restaurants_id')
.get(function(req,res){  
	let id = req.params.restaurants_id;
	RestoModel.findOne({ "_id" : id }, function(err, resto) {
		res.json({resto});
	});
});

myRouter.route('/restaurants/')
.post(function(req,res){
	RestoModel.create({"name": req.body.name, 
		"location": {
			"coordinates" : [req.body.long,req.body.lat], 
			"type": "Point"
		}}, 
	function(err){
		res.json({message : 'Le restaurant est maintenant stockée en base de données'});
	});
});

myRouter.route('/restaurants/:restaurants_id')
.put(function(req,res){
	let id = req.params.restaurants_id;
	RestoModel.update({ "_id": id }, { "name": req.body.name, 
		"location": {
			"coordinates" : [req.body.long,req.body.lat],
			"type": "Point"
		}}, 
	function(err){
		res.json({message : 'Le restaurant à été modifié'});
	});
});

myRouter.route('/restaurants/:restaurants_id')
.delete(function(req,res){
	let id = req.params.restaurants_id;
	RestoModel.findByIdAndDelete(id, function (err) {
		if(err) console.log(err);
		res.json({message : 'Successful deletion'});
	});
});


// GET:
// /restaurants?long_coordinates=<value>&lat_coordinates=<value>&max_distance=<v
// alue>
// In the query of this request, you will receive these variables: ‘long_coordinates’,
// ‘lat_coordinates’, and ‘max_distance’ (in meters). The purpose of this request is to get
// all restaurants documents at proximity of the given coordinates (long_ coordinates
// and lat_coordinates) in a ray of the max_distance given. ‘long_coordinates’ and
// ‘lat_coordinates’ queries are required, and max_distance query is optional (by default,
// max_distance is 5000m).

myRouter.route('/restaurants/')
.get(function(req,res){
	let long = req.query.long_coordinates;
	let lat = req.query.lat_coordinates;
	let maxDistance = req.query.max_distance || 5000;
	RestoModel.find({
		'location.coordinates': {
			'$geoWithin': {
			  '$center': [
				[
				  parseInt(long), parseInt(lat)
				], parseInt(maxDistance)
			  ]
			}
		}
	  },
    function(err, resto){
        res.json({resto});
    });	
});


// - GET: /restaurants_price_average
// The purpose of this request is to get the price average of all restaurants using
// Mongodb aggregate.

myRouter.route('/restaurants_price_average')
.get(function(req,res){
	RestoModel.aggregate([{ $group: { _id: null, avg: { $avg: "$price.rand" } } }],
    function(err, avg){
        res.json({err,avg});
    });	
});

// - GET: /restaurants//average_rating
// The purpose of this request is to get the rating average of each restaurant using
// Mongodb aggregate and to project only the _id, name and average_rating for each
// restaurant.
myRouter.route('/restaurants_average_rating')
.get(function(req,res){
	RestoModel.aggregate([
		{ $unwind: "$reviews.rand" },
		{ $group:
			{
				_id: "$_id",
				reviewsAvg: { $avg: "$reviews.rand" }
			}
		}
	],
    function(err, avg){
        res.json(avg);
    });	
});

//Afin de faciliter le routage nous créons un objet Router.
//C'est à partir de cet objet myRouter, que nous allons implémenter les méthodes. 

app.use(myRouter);  
 
// Démarrer le serveur 
app.listen(port, hostname, function(){
	console.log("Mon serveur fonctionne sur http://"+ hostname +":"+port); 
});