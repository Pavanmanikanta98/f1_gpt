// @ts-ignore

import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
// import { RunnableConfig } from "langchain/schema/runnable";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  HUGGINGFACE_API_KEY,
} = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const model = new HuggingFaceInference({
  model: "google/flan-t5-base",
  apiKey: HUGGINGFACE_API_KEY,
 
});

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: HUGGINGFACE_API_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2", // or any other good sentence embedding model
});




export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    let docContext = "";

    const embeddedQuery = await embeddings.embedQuery(latestMessage);

    
    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find(null, {
        sort: {
          $vector: embeddedQuery //implementing vector similarity
        },
        limit: 10,
      });

      const documents = await cursor?.toArray();
      const docsMap = documents?.map((doc) => doc.text);
      docContext = JSON.stringify(docsMap);
     
    } catch (err) {
      console.error("Error querying collection:", err);
      docContext = "";
    }

    const prompt = `You are an AI assistant who knows everything about Formula One. Use the below context to answer the user's question.
------
START CONTEXT
${docContext}
END CONTEXT
------
QUESTION: ${latestMessage}`;

const response = await model.invoke(prompt);
    console.log(response)
    return new Response(
      JSON.stringify({ id: crypto.randomUUID(), role: "assistant", content: response }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error handling POST request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
