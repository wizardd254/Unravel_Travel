const express = require("express");
const app = express();
const path = require("path");
const ejs = require("ejs");
const templatepath= path.join(__dirname,'./templates')
const { place, collection } = require("./src/mongodb");
const mongoose = require('mongoose');
const { Console } = require("console");
const { ObjectId } = mongoose.Types;
const { getJson } = require("serpapi");

app.use(express.json());
app.set("view engine","ejs");
app.set("views",templatepath);
app.use(express.urlencoded({extended:false}));

// Set the path to the directory containing your static files
const publicDirectoryPath = path.join(__dirname, "./public");

let UserId=null;

async function fetchPlacesList(placeName) {
    try {
      // Fetch the place details from the database
      const placeDetails = await place.findOne({ name: placeName });
      if (!placeDetails) {
        console.log("Place not found in database");
        return [];
      }
      
      // Construct the location string (latitude,longitude)
      const location = `@${placeDetails.latitude},${placeDetails.longitude},10z`;
  
      // Fetch the list of places from SerpAPI based on the latitude and longitude
      const json = await getJson({
        engine: "google_maps",
        type: "search",
        q: "Tourist Places",
        ll: location,
        hl: "en",
        api_key: "1cefe1a6417cb816fd47d52f80068c0fad5c520f766c90b31dbad45167b81f9d"
      });
      
      if (!json.local_results || json.local_results.length === 0) {
        console.log("No local results found");
        return [];
      }
      
      const placesList = json.local_results.map(item => ({
        name: item.title || "N/A",
        address: item.address || "N/A",
        rating: item.rating || "N/A",
        reviews: item.reviews || "N/A",
        thumbnail: item.thumbnail || "N/A",
        // ... other properties you need
      }));

      return placesList;

    } catch (error) {
      console.error("Failed to retrieve places:", error);
      return []; // Return an empty array in case of error
    }
}

async function fetchHotelList(placeName, checkInDate, checkOutDate) {
    try {
      const json = await getJson({
        api_key: "1cefe1a6417cb816fd47d52f80068c0fad5c520f766c90b31dbad45167b81f9d",
        engine: "google_hotels",
        q: placeName,
        hl: "en",
        gl: "us",
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        currency: "INR"
      });
  
      if (!json.properties) {
        console.log("No properties found");
        return [];
      }
  
      const hotellist = json.properties.map(property => ({
        name: property.name || "N/A",
        address: property.address || "N/A",
        stars: property.extracted_hotel_class || "N/A",
        price: property.rate_per_night.lowest || "N/A",
        rating: property.overall_rating || "N/A",
        reviews: property.reviews || "N/A",
        type: property.type || "N/A",
        thumbnail: property.images[0].thumbnail || "N/A",
      }));
  
      return hotellist;
    } catch (error) {
      console.error("Failed to retrieve hotels:", error);
      return []; // Return an empty array in case of error
    }
  }

async function getFlightList(originCode, destinationCode, outboundDate) {
    return new Promise((resolve, reject) => {
        getJson({
            api_key: "1cefe1a6417cb816fd47d52f80068c0fad5c520f766c90b31dbad45167b81f9d", // Replace with your actual SerpAPI key
            engine: "google_flights",
            hl: "en",
            gl: "in",
            departure_id: originCode,
            arrival_id: destinationCode,
            outbound_date: outboundDate,
            currency: "INR",
            type: "2",
            adults: "1",
            children: "0"
        }, (data, error) => {
            if (error) {
                return reject(error);
            }
            if (!data.best_flights) {
                return reject(new Error("No flights found"));
            }
            const flightsList = data.best_flights.map((flight, index) => {
                const departureAirport = flight.flights[0].departure_airport;
                const arrivalAirport = flight.flights[flight.flights.length - 1].arrival_airport;
                const price = flight.price; // Ensure your API returns this data
                const airlineName = flight.flights[0].airline; // Ensure your API returns this data
                const flightno = flight.flights[0].flight_number;
                const tripType = flight.type; // Ensure your API returns this data
                const totalDuration = flight.total_duration; // Ensure your API returns this data
                const stops = flight.flights.length > 1 ? flight.flights.length - 1 : 0;
                const flightId = `${originCode}_${destinationCode}_${outboundDate}_${index}`; // Generate unique flight ID
                
                return {
                    id: flightId,
                    departureAirport: departureAirport.name,
                    departureTime: departureAirport.time, // Ensure your API returns this data
                    arrivalAirport: arrivalAirport.name,
                    arrivalTime: arrivalAirport.time, // Ensure your API returns this data
                    price: price,
                    airline: airlineName,
                    flightnumber: flightno,
                    tripType: tripType,
                    totalDuration: totalDuration,
                    stops: stops,
                    // Add any other properties you want from the 'flight' object
                };
            });
            resolve(flightsList);
        });
    });
}
  
// Serve static files from the public directory
app.use(express.static(publicDirectoryPath));

app.use(express.urlencoded({ extended: true })); 
app.get("/",(req,res)=>{
    res.render("login");
});

app.get("/signup",(req,res)=>{
    res.render("signup");
});

app.post("/signup",async (req,res)=>{
try{
const data = {
    name:req.body.name,
    password:req.body.password
}
await collection.insertMany([data])

console.log("added to database");
res.redirect('/login');
}
catch(err){
    console.log(err.body);
    res.render("signup");
}
})

app.post("/login",async (req,res)=>{
    try {
        const check = await collection.findOne({name:req.body.name});
        let userid=check.id;
        if (check && check.password === req.body.password) {
            UserId = userid;
            res.redirect(`/landingpage`);
        }else {
            console.log("wrongpassword");
            res.redirect('/login');
        }

    } catch (error) {
        console.log("invalid");
        res.redirect('/login');
    }
      
})

// You need to add a GET route for login
app.get("/print", async (req, res) => {
    try {
        const userId = UserId; // Assuming userId is provided as a query parameter
        const selectedHotels = req.query.selectedHotels; // Assuming selectedHotels is provided as a query parameter // Assuming selectedFlights is provided as a query parameter

        // Fetch the user document using userId
        const user = await collection.findOne({ _id: userId });

        if (!user) {
            return res.status(404).send("User not found");
        }
        const hotelsArray = JSON.parse(selectedHotels);
        // Append the data of flights and hotels to the user's database
        const hotelData = hotelsArray.map(hotel => ({
    Hotel: {
        hotelname: hotel.name,
        hotellocation: 'location_here', // Specify the location if available
        day: hotel.day,
        hotelphoto: hotel.thumbnail,
        price: hotel.price ? parseInt(hotel.price.replace(/\D/g, '')) : 0, // Parse the price to remove non-numeric characters
    },
    Places: [] // Assuming no places are added for each day initially
}));

// Append the hotelData to user's itinerary
    user.itineraries[0].Days.push(...hotelData);
    await user.save();
            const placeName = req.query.placeName; // Assuming you have a query parameter for the place name
            const checkInDate = req.query.checkInDate; // Assuming you have a query parameter for check-in date
            const checkOutDate = req.query.checkOutDate; // Assuming you have a query parameter for check-out date
            var dateString1 = checkInDate ;
            var dateString2 = checkOutDate;
            console.log(placeName);
            console.log(checkInDate);
            console.log(checkOutDate);

            // Convert date strings to Date objects
            var date1 = new Date(dateString1);
            var date2 = new Date(dateString2);

            // Calculate the difference in milliseconds
            var difference = date2.getTime() - date1.getTime();

            // Convert milliseconds to days
            const days = difference / (1000 * 3600 * 24);

      console.log('Number of days between the two dates:', days);
        try {
            // Fetch place details from the MongoDB database
            const placeDetails = await place.findOne({ name: placeName });

            // Fetch the list of tourist places using the SerpAPI
            const placeslist = await fetchPlacesList(placeName);
            console.log(placeslist); // Log the places list to the console
            res.render("Places",{placelist:placeslist,day:days,placeName:placeName,checkInDate:checkInDate,checkOutDate:checkOutDate});
            // Render the places.ejs template with the places list
        } catch (error) {
            console.error("Failed to retrieve places:", error);
        }
    } catch (error) {
        console.error("Error appending data:", error);
        res.status(500).send("Internal Server Error");
    }

});

app.get("/aboutus", (req, res) => {
    res.render("aboutus");
});

app.get("/contactus", (req, res) => {
    res.render("contactus");
});

app.get("/destination", (req, res) => {
    res.render("destination");
});

app.get("/landingpage",(req,res)=>{
    res.render("landingpage");
})

app.get("/plans", (req, res) => {

    const id = req.params.id;
    const city = req.query.city;
    const placelistParam = req.query.placelist; // Retrieve placelist from query parameters
    const descriptionListParam = req.query.description_list;
    console.log("hello");
    console.log(typeof(descriptionListParam))
    console.log(descriptionListParam)
    let placelist = [];
    let descriptionList=[];

    if (placelistParam) {
        placelist = placelistParam.split(','); // Split placelist into an array
    }

    try{
     descriptionList=JSON.parse(descriptionListParam);
    }catch{
     console.log(Error);

    }

    console.log(placelist)
    console.log(descriptionList);

    res.render("myplans", { id: id, city: city, placelist: placelist, descriptionList: descriptionList });
});


app.post("/flight", (req, res) => {
    const formData = req.body; // Access form data from the request body
    console.log(formData); // Logging the form data received from the client

    // Handle the form data as needed, e.g., save to a database

    // Send a response to the client
    res.json({ message: "Form data received successfully" });
    res.render("flight");
});
app.get("/flight", async (req, res) => {
    const originName = req.query.origin;
    const destinationName = req.query.destination;

    try {
        // Find the airport codes for both origin and destination
        console.log(originName);
        console.log(destinationName)
        const originPlace = await place.findOne({ name: originName });
        const destinationPlace = await place.findOne({ name: destinationName });
        console.log(originPlace);
        console.log(destinationPlace);
        // If both places are found, extract the airport codes
        if (originPlace && destinationPlace) {
            const originCode = originPlace.airportCode;
            const destinationCode = destinationPlace.airportCode;
            
            
            const outboundDate =req.query.arrivalTime;
            const inboundDate =  req.query.departureTime;

        const outflightlist = await getFlightList(originCode, destinationCode, outboundDate)
        const inflightlist= await getFlightList( destinationCode,originCode, inboundDate)
            console.log(outflightlist);
            console.log('-----------------');
            console.log(inflightlist);
        res.render('Flight', { outflightlist: outflightlist, inflightlist: inflightlist,userId:UserId,outboundDate:outboundDate,inboundDate:inboundDate,destinationName:destinationName });    
        } else {
            // Handle the case where one or both places are not found
            res.status(404).send("Origin or destination not found");
        }
    } catch (error) {
        // Handle any possible errors that occur during the database query
        console.error("Database query failed", error);
        res.status(500).send("Error retrieving airport codes");
    }
    
});


app.get("/Hotel", async (req, res) => {
    const userId = req.query.userId;
    const departingFlight = JSON.parse(req.query.departing);
    const returningFlight = JSON.parse(req.query.returning);

    try {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
         return res.status(400).send("Invalid userId");
        }
        // Assuming each user only has one itinerary for simplicity
        // Otherwise, you'll need a way to identify which itinerary to update
        const user = await collection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Check if itineraries exist, if not, initialize
        if (user.itineraries.length === 0) {
            user.itineraries.push({ DepartingFlights: [], ArrivalFlights: [] });
        }

        // Add flights to the first itinerary for this user
        user.itineraries[0].DepartingFlights.push({
            flighttime: departingFlight.flightNumber,
            flightprice: departingFlight.price,
            departureloc: departingFlight.departureAirport,
            destinationloc: departingFlight.arrivalAirport,
            departuretime: departingFlight.departureTime,
            arrivaltime: departingFlight.arrivalTime,
            price: departingFlight.price
        });
        user.itineraries[0].ArrivalFlights.push({
            flighttime: returningFlight.flightNumber,
            flightprice: returningFlight.price,
            departureloc: returningFlight.departureAirport,
            destinationloc: returningFlight.arrivalAirport,
            departuretime: returningFlight.departureTime,
            arrivaltime: returningFlight.arrivalTime,
            price: returningFlight.price
        });

        // Save the updated user
        await user.save();

        // Redirect or render as needed
        const placeName = req.query.destinationName; // Assuming you have a query parameter for the place name
        const checkInDate = req.query.odate; // Assuming you have a query parameter for check-in date
        const checkOutDate = req.query.idate; // Assuming you have a query parameter for check-out date
        var dateString1 = checkInDate ;
        var dateString2 = checkOutDate;
        console.log(checkInDate);
        console.log(checkOutDate);
        console.log(placeName);

        // Convert date strings to Date objects
        var date1 = new Date(dateString1);
        var date2 = new Date(dateString2);

        // Calculate the difference in milliseconds
        var difference = date2.getTime() - date1.getTime();

        // Convert milliseconds to days
        var days = difference / (1000 * 3600 * 24);

            console.log('Number of days between the two dates:', days);
            console.log(checkInDate)
            try {
                const hotellist = await fetchHotelList(placeName, checkInDate, checkOutDate);
                console.log(hotellist);
                res.render("Hotel",{hotellist:hotellist,days:days,placeName:placeName,checkInDate:checkInDate,checkOutDate:checkOutDate}); // Log the hotel list to the console
            } catch (error) {
                console.error("Failed to retrieve hotels:", error);
                res.status(500).send("Error retrieving hotel list");
            }
    } catch (error) {
        console.error("Failed to save flights:", error);
        res.status(500).send("Error saving flight details");
    }
});

app.get("/Places", async (req, res) => { // Assume the place name is passed as a query parameter
    const placeName = "Mumbai" // Assuming you have a query parameter for the place name
    const checkInDate = "2024-03-24"; // Assuming you have a query parameter for check-in date
    const checkOutDate = "2024-03-27"; // Assuming you have a query parameter for check-out date
    var dateString1 = checkInDate ;
   var dateString2 = checkOutDate;

// Convert date strings to Date objects
   var date1 = new Date(dateString1);
   var date2 = new Date(dateString2);

// Calculate the difference in milliseconds
   var difference = date2.getTime() - date1.getTime();

// Convert milliseconds to days
   var days = difference / (1000 * 3600 * 24);

   console.log('Number of days between the two dates:', days);
    try {
        // Fetch place details from the MongoDB database
        const placeDetails = await place.findOne({ name: placeName });

        // Fetch the list of tourist places using the SerpAPI
        const placesList = await fetchPlacesList(placeName);
        console.log(placesList); // Log the places list to the console
        res.render("Places",{placelist:placelist,days:days});
        // Render the places.ejs template with the places list
    } catch (error) {
        console.error("Failed to retrieve places:", error);
    }
});

app.get("/Itinerary", async (req, res) => {
    try {
        // Fetch the user document containing the itineraries
        const userId = UserId; // Assuming userId is provided as a query parameter
        const user = await collection.findOne({ _id: userId }).exec();

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Extract itineraries from the user document
        const itineraries = user.itineraries;

        // Render the Itinerary template with the itineraries
        res.render("Itinerary", { itineraries: itineraries });
    } catch (error) {
        console.error("Error fetching itineraries:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(5050,()=>{
    console.log("port connected");
});
