require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const fetch = require("node-fetch");

const app = express();
const port = process.env.PORT || 3000;
const BASE_URL = process.env.HOSTED_URL || `http://localhost:${port}`;

//middleware
app.use(cors());
app.use(express.json());

//mongodb

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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

        const newUser = {
          uid,
          name,
          email,
          photo,
          role: "user",
          createdAt: new Date(),
        };

        const result = await usersCollection.insertOne(newUser);
        console.log("User created:", result);
        return res.status(201).json({ message: "User created" });
      } catch (err) {
        console.error("Error creating user:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/:id/my-list", async (req, res) => {
      const { id } = req.params; // Extract UID from URL

      if (!id) {
        return res.status(400).json({ error: "UID is required in URL" });
      }

      try {
        const spots = await touristSpotsCollection
          .find({ "addedBy.uId": id })
          .toArray();

        return res.json(spots);
      } catch (err) {
        console.error("Error fetching user's list:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    });

    // Get all tourist spots
    app.get("/tourist-spots", async (req, res) => {
      const cursor = touristSpotsCollection.find({});
      const touristSpots = await cursor.toArray();
      res.json(touristSpots);
    });

    app.get("/tourist-spots/:id", async (req, res) => {
      const { id } = req.params;
      console.log(id);

      const touristSpot = await touristSpotsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!touristSpot) {
        return res.status(404).json({ message: "Tourist spot not found" });
      }
      res.json(touristSpot);
    });

    //Update tourist spot
    app.patch("/tourist-spots/:id", async (req, res) => {
      const { id } = req.params;
      const updatedTouristSpot = req.body;

      console.log(id, updatedTouristSpot);

      try {
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true }; // This creates a new doc if none matches. ⚡
        const updateDoc = {
          $set: {
            ...updatedTouristSpot,
            updatedAt: new Date(), // Always a smart move to track updates ✅
          },
        };

        const result = await touristSpotsCollection.updateOne(
          filter,
          updateDoc,
          options
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Tourist spot not found" });
        }

        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
      }
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

    // delete tourist spot
    app.delete("/tourist-spots/:id", async (req, res) => {
      const { id } = req.params;
      console.log(id);

      const result = await touristSpotsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.status(200).json(result);
    });

    // ✅ Get tourist spots that match the user's country
    // app.get("/matched-country/:uid", async (req, res) => {
    //   const { uid } = req.params;

    //   try {
    //     // Step 1: Get the user by UID
    //     const user = await usersCollection.findOne({ uid });

    //     if (!user || !user.country) {
    //       return res.status(404).json({ error: "User or country not found" });
    //     }

    //     const userCountry = user.country;

    //     // Step 2: Find tourist spots from the same country
    //     const spots = await touristSpotsCollection
    //       .find({ country: { $regex: new RegExp(`^${userCountry}$`, "i") } }) // Case-insensitive match
    //       .toArray();

    //     res.json(spots);
    //   } catch (error) {
    //     console.error("Error fetching matched country spots:", error);
    //     res.status(500).json({ error: "Internal Server Error" });
    //   }
    // });

    // 1️⃣ Ping route for keep-alive
    app.get("/ping", (req, res) =>
      res.json({ status: "alive", time: new Date() })
    );

    // 2️⃣ Cron job: self-ping monthly at midnight on the 1st
    cron.schedule("0 0 1 * *", async () => {
      console.log("🌙 Monthly keep-alive at", new Date());
      try {
        // Web dyno keep-alive
        await fetch(`${process.env.HOSTED_URL}/ping`);
        console.log("✅ Web ping succeeded");
      } catch (e) {
        console.error("❌ Web ping failed", e);
      }

      try {
        // DB keep-alive
        await client.db().command({ ping: 1 });
        console.log("✅ DB ping succeeded");
      } catch (e) {
        console.error("❌ DB ping failed", e);
      }
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
