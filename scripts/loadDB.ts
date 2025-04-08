import { DataAPIClient } from '@datastax/astra-db-ts';

import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

import 'dotenv/config';

type SimilarityMetric = 'dot_product' | 'cosine' | 'euclidean';

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    HUGGINGFACE_API_KEY,
  } = process.env;
  

if (!ASTRA_DB_NAMESPACE || !ASTRA_DB_COLLECTION || !ASTRA_DB_API_ENDPOINT || !ASTRA_DB_APPLICATION_TOKEN || !HUGGINGFACE_API_KEY) {
    throw new Error('Please ensure all required environment variables are set.');
  }

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
// console.log("client::",client)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });
// console.log("db::",db)

// List of f1 related urls
const f1Data = [
  'https://en.wikipedia.org/wiki/Formula_One',
  'https://www.formula1.com/en/latest/all',
  'https://en.wikipedia.org/wiki/2023_Formula_One_World_Championship',
  'https://en.wikipedia.org/wiki/2022_Formula_One_World_Championship',
  'https://en.wikipedia.org/wiki/2024_Formula_One_World_Championship',
  'https://en.wikipedia.org/wiki/2025_Formula_One_World_Championship'
];


const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

/**
 * Create a collection in Astra DB using a Hugging Face embedding model.
 * Note: "all-MiniLM-L6-v2" produces 384-dimensional embeddings.
 */
const createCollection = async (
  similarityMetric: SimilarityMetric = 'dot_product'
) => {
  
  const res = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
        dimension: 384,   
      metric: similarityMetric,
    },
  });

  console.log("result",res);
};

// Instantiate the embeddings object.
// By default, it will use process.env.HUGGINGFACEHUB_API_KEY if not provided explicitly.
const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey:  HUGGINGFACE_API_KEY || "YOUR_API_KEY_HERE",
    // Optionally, you can specify a model; by default it uses "sentence-transformers/distilbert-base-nli-mean-tokens"
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });

  const embedText = async (text: string): Promise<number[]> => {
    // embedQuery returns a vector embedding for the provided text.
    const vector = await embeddings.embedQuery(text);
    return vector;
  };


    /**
 * Scrape the page at a given URL and return its inner text.
 * Uses Puppeteer via LangChain's PuppeteerWebBaseLoader.
 * @param url The URL to scrape.
 * @returns The scraped text.
 */
const scrapePage = async (url: string): Promise<string> => {
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: 'domcontentloaded',
      },
      evaluate: async (page, browser) => {
        // Using innerText returns visible text
        const result = await page.evaluate(() => document.body.innerText);
        await browser.close();
        return result;
      },
    });
    const scraped = await loader.scrape();
    // Remove extra whitespace and HTML remnants if needed
    return scraped ? scraped.replace(/\s+/g, ' ').trim() : "";
  };


/**
 * Load sample data: for each URL, scrape the page, split the text into chunks,
 * get embeddings for each chunk, and insert into the Astra DB collection.
 */
const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    for await (const url of f1Data) {
      console.log(`Processing URL: ${url}`);
      const content = await scrapePage(url);
      const chunks = await splitter.splitText(content);
      for await (const chunk of chunks) {
        try {
          // Get embedding vector from Hugging Face Inference API
          const vector = await embedText(chunk);
          // Insert the document (vector and text) into the collection
          const res = await collection.insertOne({
            $vector: vector,
            text: chunk,
          });
          console.log("Inserted document:", res);
        } catch (err) {
          console.error("Error processing chunk:", err);
        }
      }
    }
  };


createCollection()
  .then(() => loadSampleData())
  .catch((err) => console.error("Error:", err));