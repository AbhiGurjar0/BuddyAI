import express from "express";
import { ChatOllama } from "@langchain/ollama";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Document } from "@langchain/core/documents";
import { getVectorStore } from "../services/chroma.js";
import { retrieveMemory } from "../services/retrieve.js";
import { saveMemory } from "../services/memory.js";


//model
const llm = new ChatOllama({
  model: "phi3:mini",
});

//embeddings
const embeddings = new OllamaEmbeddings({
  model: "phi3:mini", // or llama3
  baseUrl: "http://127.0.0.1:11434",
});

const router = express.Router();

router.get("/", (req, res) => {
  res.send("User route");
});
router.post("/chat", async (req, res) => {
  let { message } = req.body;

  let embeddedMessage = await embeddings.embedQuery(message);

//   await saveMemory(message); // Save the original message to the vector store

//   const retrievedMemory = await retrieveMemory(embeddedMessage);

  //   let context = retrievedMemory.join("\n"); // Combine retrieved memory into a single context string

  //   //generate response using LLM with context
    let response = await llm.invoke(`\nUser: ${message}\nBuddyAI:`);

  res.send("Message received: " + message + "\nResponse: " + response.content);
});

export default router;
