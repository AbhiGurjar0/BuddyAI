import { getVectorStore } from "./chroma.js";

export async function retrieveMemory(query) {
  const vectorStore = getVectorStore(); // instant access

  const retriever = vectorStore.asRetriever({
    k: 3,
  });

  const docs = await retriever.getRelevantDocuments(query);

  return docs.map(doc => doc.pageContent);
}