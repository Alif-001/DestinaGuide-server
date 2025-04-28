require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

//mongodb

const { MongoClient, ServerApiVersion } = require("mongodb");

// const uri = process.env.MONGODB_URI;

// connect to mongodb locally
const uri = "mongodb://localhost:27017/";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // Connect to the database and access its collection
    const database = client.db("destinaGuide");
    const touristSpotsCollection = database.collection("touristSpots");
    const usersCollection = database.collection("users");

    /************************/
    // routes
    /***********************/

    app.post("/users", async (req, res) => {
      const { uid, name, email, photo } = req.body;

      try {
        const existingUser = await usersCollection.findOne({ uid });

        if (existingUser) {
          return res.json({ message: "User already exists" });
        }

        const newUser = ({
          uid,
          name,
          email,
          photo,
          role: "user",
          createdAt: new Date(),
        });

        const result = await usersCollection.insertOne(newUser);
        console.log("User created:", result);
        return res.status(201).json({ message: "User created" });
      } catch (err) {
        console.error("Error creating user:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    });

    // Get all tourist spots
    app.get("/tourist-spots", async (req, res) => {
      const cursor = touristSpotsCollection.find({});
      const touristSpots = await cursor.toArray();
      res.json(touristSpots);
    });

    //add tourist spot
    app.post("/tourist-spots", async (req, res) => {
      const touristSpot = {
        ...req.body,
        createdAt: new Date(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: "pending",
       
      };
      const result = await touristSpotsCollection.insertOne(touristSpot);
      res.status(201).json(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port} ✨`);
});
