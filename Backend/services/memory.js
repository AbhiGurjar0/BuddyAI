import { getVectorStore } from "./chroma.js";
import { Document } from "@langchain/core/documents";

export async function saveMemory(text) {
  try {
    const vectorStore = getVectorStore();

    if (!vectorStore) {
      throw new Error("Vector store not ready");
    }

    await vectorStore.addDocuments([
      new Document({
        pageContent: text,
      }),
    ]);

    console.log("Memory saved");

  } catch (error) {
    console.error("Memory save failed:", error.message);
    throw error;
  }
}