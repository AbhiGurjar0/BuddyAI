import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/ollama";

const embeddings = new OllamaEmbeddings({
  model: "phi3:mini", // or llama3
  baseUrl: "http://127.0.0.1:11434",
});

let vectorStore;

export async function initVectorStore() {

  vectorStore = await Chroma.fromDocuments(
    [],
    embeddings,
    {
      collectionName: "buddyai-memory",
      persistDirectory: "./chroma-db",
    }
  );

  console.log("Chroma initialized locally");
}

export function getVectorStore() {
  return vectorStore;
}