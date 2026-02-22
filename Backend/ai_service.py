from fastapi import FastAPI
from pydantic import BaseModel
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_core.prompts import PromptTemplate
from fastapi.middleware.cors import CORSMiddleware
import os


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "faiss_db"

# embedding model for memory
embeddings = OllamaEmbeddings(
    model="nomic-embed-text", base_url="http://127.0.0.1:11434"
)

# chat model
chat_model = ChatOllama(model="phi3:mini", base_url="http://127.0.0.1:11434")

# load or create vectorstore
if os.path.exists(DB_PATH):
    vectorstore = FAISS.load_local(
        DB_PATH, embeddings, allow_dangerous_deserialization=True
    )
else:
    vectorstore = FAISS.from_texts(["initial memory"], embeddings)
    vectorstore.save_local(DB_PATH)


class SearchRequest(BaseModel):
    query: str


@app.post("/chat")
def chat(req: SearchRequest):

    ## here i want to add incoming query into memory
    vectorstore.add_texts([f"User: {req.query}"])

    ## then here retrieve relevant memory and return it as context for the response
    docs = vectorstore.similarity_search(req.query, k=10)
    memory_context = "\n".join([d.page_content for d in docs])

    ## here create prompt through langchain
    prompt_template = PromptTemplate.from_template(
        """You are BuddyAI, a smart personal assistant with memory.

Follow these rules:
- Use the provided memory to answer the user.
- If memory contains relevant information, prioritize it.
- If memory does not contain relevant information, answer normally.
- Be concise, clear, and helpful.
- Do NOT invent facts that are not in memory.
- Maintain conversational tone.

Memory Context:
{memory}

User Question:
{query}

BuddyAI Response:"""
    )

    prompt = prompt_template.format(memory=memory_context, query=req.query)

    response = chat_model.invoke(prompt)

    answer = response.content

    ## save AI response into memory
    vectorstore.add_texts([f"Buddy: {answer}"])
    vectorstore.save_local(DB_PATH)

    return {"response": answer}
