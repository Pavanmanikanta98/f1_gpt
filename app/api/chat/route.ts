
import { InferenceClient } from '@huggingface/inference'
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// Environment variables (make sure they are set in your .env file)
const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  HUGGINGFACE_API_KEY,
} = process.env;

if (
  !ASTRA_DB_NAMESPACE ||
  !ASTRA_DB_COLLECTION ||
  !ASTRA_DB_API_ENDPOINT ||
  !ASTRA_DB_APPLICATION_TOKEN ||
  !HUGGINGFACE_API_KEY
) {
  throw new Error("Please ensure all required environment variables are set.");
}

// Initialize the Astra DB client
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

// Create a Hugging Face Inference client using the official library.
// This client bypasses LangChain's extra parameter handling.
const hfClient = new InferenceClient(HUGGINGFACE_API_KEY);

// Instantiate the embeddings client (using a sentence-transformer model)
const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: HUGGINGFACE_API_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;
    let docContext = "";

    // Generate an embedding for the latest user message
    const embeddedQuery = await embeddings.embedQuery(latestMessage);

    // Query Astra DB for similar documents using vector similarity
    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find(null, {
        sort: { $vector: embeddedQuery },
        limit: 10,
      });
      const documents = await cursor.toArray();
      const docsMap = documents?.map((doc) => doc.text);
      // Use up to three documents as context
      if (docsMap && docsMap.length > 3) {
        docContext = JSON.stringify(docsMap.slice(0, 3));
      } else {
        docContext = JSON.stringify(docsMap);
      }
      // Optionally truncate the context to reduce token count (e.g., 700 characters)
      // const maxContextChars = 700;
      // if (docContext.length > maxContextChars) {
      //   docContext = docContext.slice(0, maxContextChars) + " ...";
      // }

      // console.log("Context:", docContext);
    } catch (err) {
      console.error("Error querying collection:", err);
      docContext = "";
    }

    // Build the prompt using a ChatPromptTemplate.
    // This template instructs the model to answer concisely without repeating the context.
    const chatPrompt = ChatPromptTemplate.fromMessages([
      {
        role: "system",
        content:
          "You are an expert Formula 1 assistant. You know everything about teams, drivers, constructors, races, circuits, results, and the latest news. Always provide accurate, up-to-date, and concise answers. When asked about standings, stats, or historical data, respond clearly and factually. Keep answers engaging, but avoid unnecessary filler. If something is unknown or unconfirmed, state it transparently. Do not hallucinate. Cite race names, team names, or years when needed. Be prepared to answer both technical and fan-oriented questions. Aand  Always answer questions clearly, factually, and in full sentences, even if the answer is yes or no. Avoid short responses. Provide helpful context when relevant.Example: What you want vs what you get is Hamilton staying with Mercedes next season?  Current result:no expected result : No, Lewis Hamilton is not staying with Mercedes next season; he is expected to join Ferrari in 2025.",
      },
      {
        role: "system",
        content: "Context: {context}",
      },
      {
        role: "user",
        content: `Answer the following Formula 1 question in a complete sentence:\n\nQuestion: {question}\nAnswer:.`
      },
    ]);

    // Format the prompt with dynamic values.
    const formattedMessages = await chatPrompt.formatMessages({
      context: docContext,
      question: latestMessage,
    });
    // Combine the formatted messages into a single prompt string.
    const fullPrompt = formattedMessages.map((msg) => msg.content).join("\n");

    // Invoke the Hugging Face Inference client directly.
    // Use the "google/flan-t5-base" model (or change it as needed) and pass in the full prompt.
    const generationOutput = await hfClient.textGeneration({
      model: "google/flan-t5-large",
      inputs: fullPrompt,
      parameters:{
      max_new_tokens: 150,        
      temperature: 0.7,           
      repetition_penalty: 1.1,   
    },
    });
    // console.log("Generated response:",generationOutput?.generated_text);

    return new Response(
      JSON.stringify({
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [
          {
            type: "text",
            text: generationOutput.generated_text, // Must be string
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
    
    
  } catch (error: any) {
    console.error("Error handling POST request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
