import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import cron from "node-cron";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const BASE_URL = process.env.HOSTED_URL || `http://localhost:${port}`;

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✔️ Connected to MongoDB");

    const database = client.db("destinaGuide");
    const touristSpotsCollection = database.collection("touristSpots");
    const usersCollection = database.collection("users");

    // ROUTES
    app.post("/users", async (req, res) => {
      try {
        const { uid, name, email, photo } = req.body;
        const existing = await usersCollection.findOne({ uid });
        if (existing) return res.json({ message: "User already exists" });
        await usersCollection.insertOne({
          uid,
          name,
          email,
          photo,
          role: "user",
          createdAt: new Date(),
        });
        res.status(201).json({ message: "User created" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Unexpected server error" });
      }
    });

    app.get("/:id/my-list", async (req, res) => {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: "UID required" });
      try {
        const spots = await touristSpotsCollection
          .find({ "addedBy.uId": id })
          .toArray();
        res.json(spots);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/tourist-spots", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const spots = await touristSpotsCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
      res.json(spots);
    });

    app.get("/tourist-spots/:id", async (req, res) => {
      try {
        const spot = await touristSpotsCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (!spot) return res.status(404).json({ message: "Not found" });
        res.json(spot);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/tourist-spots", async (req, res) => {
      const doc = {
        ...req.body,
        createdAt: new Date(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: "pending",
      };
      const result = await touristSpotsCollection.insertOne(doc);
      res.status(201).json(result);
    });

    app.patch("/tourist-spots/:id", async (req, res) => {
      try {
        const result = await touristSpotsCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { ...req.body, updatedAt: new Date() } },
          { upsert: false }
        );
        if (result.matchedCount === 0)
          return res.status(404).json({ message: "Not found" });
        res.json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.delete("/tourist-spots/:id", async (req, res) => {
      const result = await touristSpotsCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.json(result);
    });

    // Ping route
    app.get("/ping", (req, res) =>
      res.json({ status: "alive", time: new Date() })
    );

    // Cron job: run every minute
    cron.schedule("0 0 1 * *", async () => {
      console.log("⏰ Cron ping at", new Date());
      try {
        const res = await fetch(`${BASE_URL}/ping`);
        const contentType = res.headers.get("content-type") || "";
        const body = await res.text();
        if (contentType.includes("application/json")) {
          const data = JSON.parse(body);
          console.log("✅ Web ping succeeded", data);
        }
      } catch (e) {
        console.error("❌ Web ping failed", e);
      }
      try {
        await client.db().command({ ping: 1 });
        console.log("✅ DB ping succeeded");
      } catch (e) {
        console.error("❌ DB ping failed", e);
      }
    });

    app.get("/", (req, res) => {
      res.send("DestinaGuide server is running smoothly! 🚀");
    });

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (e) {
    console.error("🔥 Startup error", e);
    process.exit(1);
  }
}

run().catch(console.dir);
