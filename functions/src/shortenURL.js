const functions = require("firebase-functions");

// The Firebase Admin SDK to access the Cloud Firestore.
const admin = require("firebase-admin");
admin.initializeApp();
const collection = admin.firestore().collection("urls");

const cors = require("cors")({
  origin: true
});

// Used for input validation
const { URL } = require("url");

exports = functions.https.onRequest(async (req, res) => {
  const { url } = req.query;

  if (url) {
    if (typeof url === "string") {
      try {
        new URL(url);
      } catch (error) {
        return cors(req, res, () =>
          res
            .status(400)
            .json({ error: "Not a valid URL" })
            .end()
        );
      }

      // Find documents that have the same long URL (duplicates)
      const { docs } = await collection.where("url", "==", url).get();
      const [entry] = docs;

      if (entry) {
        // Someone already shortened this URL so give it to them
        return cors(req, res, () =>
          res
            .status(200)
            .json({ short: entry.id })
            .end()
        );
      } else {
        // This is a new URL so enter it into the database
        const spaces = ["\u180e", "\u200b"];

        const short = new Array(24)
          .fill(0)
          .map(() => (Math.random() > 0.5 ? spaces[0] : spaces[1]))
          .join("");

        await collection.doc(short).set({ url });
        return cors(req, res, () =>
          res
            .status(201)
            .json({ short })
            .end()
        );
      }
    } else {
      return cors(req, res, () =>
        res
          .status(400)
          .json({ error: "URL must be string type" })
          .end()
      );
    }
  } else {
    return cors(req, res, () =>
      res
        .status(400)
        .json({ error: "You must specify a URL" })
        .end()
    );
  }
});