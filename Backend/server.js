import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import Routes from "./routes/user.js";
import { initVectorStore } from "./services/chroma.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api", Routes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
initVectorStore()
  .then(() => {
    console.log("Vector store ready");
  })
  .catch((err) => {
    console.error("Vector store failed:", err); 
  });
