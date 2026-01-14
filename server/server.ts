

import path from "path";
import express, { Request, Response, NextFunction } from "express";
import apiRouter from "./routes/api";
import oauthRouter from "./routes/oauth"; // kept import (even if not used yet)

import { ServerError } from "./types";

import "dotenv/config";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

const PORT = 3000;

// initialize express
const app = express();

// Mongo
const mongoURI: any = process.env.MONGO_URI;

mongoose
  .connect(mongoURI, { dbName: "astro" })
  .then(() => console.log("Connected to Mongo DB."))
  .catch((err) => console.log(err));

// parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// PATH VARIABLES (React frontend)
const clientPath = path.resolve(import.meta.dirname, "../client");

// serving React static files
app.use("/", express.static(clientPath));

/**
 * ✅ OpenStreetMap (Nominatim) geocoding endpoint
 * Frontend will call: /api/geocode?q=Accra
 * Returns: [{ displayName, lat, lon }, ...]
 */
app.get("/api/geocode", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(200).json([]);

    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?format=json&limit=6&addressdetails=1&q=${encodeURIComponent(q)}`;

    const r = await fetch(url, {
      headers: {
        // Nominatim expects a valid User-Agent
        "User-Agent": "zodiac-match-app/1.0 (local dev)",
        "Accept-Language": "en",
      },
    });

    if (!r.ok) {
      return res.status(502).json({ err: "Geocode failed" });
    }

    const data: any = await r.json();

    const results = (Array.isArray(data) ? data : []).map((x: any) => ({
      displayName: x.display_name,
      lat: x.lat,
      lon: x.lon,
    }));

    return res.status(200).json(results);
  } catch (err) {
    // forward to your existing error handler
    return next({
      log: `Geocode error: ${err}`,
      status: 500,
      message: { err: "Geocode error" },
    });
  }
});

// Routes (most specific to least specific)
app.use("/api", apiRouter);
// app.use("/oauth", oauthRouter); // keep commented if not using

/**
 * ✅ SPA fallback: serve React index.html for any non-API route
 * Important: use "*" not "/" so refresh on nested routes works.
 */
app.get(/.*/, (_: Request, res: Response) => {
  return res.status(200).sendFile(path.join(clientPath, "index.html"));
});

// catch-all route handler for any requests to an unknown route (mostly API leftovers)
app.use((_: Request, res: Response) => {
  return res.status(404).send("404: page not found");
});

// Global error handler
app.use((err: ServerError, req: Request, res: Response, next: NextFunction) => {
  const defaultErr = {
    log: "Express error handler caught unknown middleware error",
    status: 500,
    message: { err: "An error occurred" },
  };

  const errorObj = Object.assign({}, defaultErr, err);

  console.log("error logged: ", errorObj.log);

  const { status, message } = errorObj;
  return res.status(status).json(message);
});

/**
 * start server
 */
app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

export default app;






// import path from "path";
// import express, { Request, Response, NextFunction } from "express";
// import apiRouter from "./routes/api";
// import oauthRouter from "./routes/oauth";

// import { ServerError } from "./types";

// // import dotenv from "dotenv";
// import 'dotenv/config';
// import cookieParser from 'cookie-parser';
// import mongoose from 'mongoose';



// // dotenv.config(); // process.env

// const PORT = 3000;


// // make sure to initialize express
// // This calls the imported express() function, creating a new Express application object and storing it in the app variable. This app object is what you use to define routes, middleware, and start the server.
// const app = express();

// // create a .env file at root (top-level), not nested inside any folder
// // set up mongoDB under your organization, create a project, and under project,deploy a cluster (default name: Cluster 0)
// // add teammates as database admin under Database & Network Access (need to expand left-side menu)
// // give each teammate username and password URI
// // put MONGO_URI=<uri connection string> inside .env file
// const mongoURI : any = process.env.MONGO_URI;

// // mongoose.connect(mongoURI);
// mongoose.connect(mongoURI, {
//   // sets the name of the DB that our collections are part of
//   dbName: 'astro'
// })
//   .then(() => console.log('Connected to Mongo DB.')) // check to verify connected to DB in .then clause
//   .catch(err => console.log(err));


// // add parsing middleware
// app.use(express.json()); // parsing json
// app.use(express.urlencoded({ extended: true })); // for parsing forms 
// app.use(cookieParser()); // parsing cookies for authentication


// // PATH VARIABLES (accessing React frontend)
// // REACT path
// const clientPath = path.resolve(import.meta.dirname, "../client");

// // serving REACT frontend files (HTML, CSS, JS, also images)
// app.use("/", express.static(clientPath));

// // set up routes, from most specific to least specific

// //  Use api router for routes starting with /api

// app.use("/api", apiRouter);
// //http://localhost:3000/api
// // inside of api.ts file, "/" is same as "http://localhost:3000/api"

// // app.use("/oauth", oauthRouter);
// // inside of oauth.ts file, "/" is same as "http://localhost:3000/oauth"


// // ROUTE HANDLER TO SERVE REACT APP
// // This catches ALL other routes and serves index.html
// app.get("/", (_, res) => {
//   return res.status(200).sendFile(path.join(clientPath, "index.html"));
// });




// // catch-all route handler for any requests to an unknown route
// app.use((_, res) => {
//   // res.sendStatus(404);
//   return res.status(404).send("404: page not found"); 
// });


// // 4 params for error handler middleware (vs. 3 for regular middleware)
// app.use((err: ServerError, req: Request, res: Response, next: NextFunction) => {
//   const defaultErr = {
//     log: "Express error handler caught unknown middleware error",
//     status: 500,
//     message: { err: "An error occurred" },
//   };

//   // Create error obj using defaultErr as base, overwriting w err param
//   const errorObj = Object.assign({}, defaultErr, err);
//   //                target  ↑      source1 ↑ source2 ↑

//   // If err has {log: 'custom', status: 404}, result is:
//   // {log: 'custom', status: 404, message: {err: 'An error occurred'} }

//   console.log("error logged: ", errorObj.log);

//   const { status, message } = errorObj;

//   // reply to client w err status / msg (remember to convert json)
//   return res.status(status).json(message);
// });

// /**
//  * start server
//  */
// app.listen(PORT, () => {
//   console.log(`Server listening on port: ${PORT}`);
// });

// export default app;