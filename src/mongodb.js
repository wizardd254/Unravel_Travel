const mongoose = require('mongoose');

const connectionstring = "mongodb+srv://@unravelcluster0.ssgcbvd.mongodb.net/Userlist?retryWrites=true&w=majority&appName=unravelcluster0"

mongoose
   .connect(connectionstring)
   .then(()=>console.log("CONNECTED TO THE DB"))
   .catch((err)=>console.log(err))

const placeSchema = new mongoose.Schema({
    placename: String,
    placeloc: String,
    placephoto: String,
    price: Number
});

const daySchema = new mongoose.Schema({
    Hotel: {
        hotelname: String,
        hotellocation: String,
        day: Number,
        hotelphoto: String,
        price: Number
    },
    Places: [placeSchema] // Array of places for each day
});

const flightSchema = new mongoose.Schema({
    flighttime: String,
    flightprice: Number,
    departureloc: String,
    destinationloc: String,
    departuretime: String,
    arrivaltime: String, // Added for clarity, assuming you need both departure and destination locations
    price: Number
});

const itinerarySchema = new mongoose.Schema({
    DepartingFlights: [flightSchema],
    ArrivalFlights: [flightSchema], // Assuming two flights: to and fro
    Days: [daySchema] // Array of days, each with a hotel and multiple places
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    itineraries: [itinerarySchema] // Array of itineraries
});

const placeSchema1 = new mongoose.Schema({
    name: String,
    latitude: Number,
    longitude: Number,
    airportCode: String
  });



module.exports = {
  place: mongoose.model('placeslists', placeSchema1),
  collection: mongoose.model("collection12", userSchema)
};

