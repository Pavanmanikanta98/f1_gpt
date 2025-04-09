# 🏎️ F1 Chatbot – Real-time Formula 1 Assistant

This project is an AI-powered chatbot that answers questions about Formula 1 using natural language processing and a fine-tuned transformer model. Built with Next.js and integrated with Hugging Face Inference API, it delivers fast, context-aware responses about races, drivers, stats, and more.

![F1 Logo](./public/f1logo.png)

## 🚀 Features

- 🤖 Chatbot interface powered by `@ai-sdk/react` (or custom hooks)
- 🧠 Uses Hugging Face model (`flan-t5-large`) via their Inference API
- 🗃️ Dynamic backend API using Next.js API routes
- ⚙️ Model can be swapped, tuned for better F1 performance
- 🌐 Real-time Q&A about Formula 1 teams, drivers, history, and standings

---

## 📦 Tech Stack

- **Frontend:** React + Next.js 14
- **Backend:** API Routes (Edge/Server)
- **AI Model:** Hugging Face Inference API (`flan-t5-large` or similar)
- **Chat Hook:** a custom `useChat` hook
  

---
## 🧑‍💻 Setup Instructions

1\. **Clone the repo**

   ```bash

   git clone https://github.com/your-username/f1-chatbot.git

   cd f1-chatbot

Install dependencies

bash

Copy

Edit

npm install

Configure environment

Create a .env.local file and add your Hugging Face token:

env

Copy

Edit

HUGGINGFACE_API_KEY=your_huggingface_token

Run the development server

bash

Copy

Edit

npm run dev

Access the app

Visit http://localhost:3000 in your browser.

🛠️ Model Configuration

The chatbot uses the Hugging Face textGeneration method with configurable parameters in app/api/chat/route.ts.

Example settings:

ts

Copy

Edit

parameters: {

  max_new_tokens: 100,

  temperature: 0.7,

  repetition_penalty: 1.1,

}

You can replace the model with:

google/flan-t5-large

meta-llama/Llama-3-8B

tiiuae/falcon-7b or any other supported model on 🤗 Hugging Face.

🧪 Example Prompt

text

Copy

Edit

Q: Who is the head of racing for Aston Martin?

A: The head of racing for Aston Martin is...

📌 To-Do

 Add full prompt-tuning for F1 context

 Integrate with live F1 APIs for real-time standings

 Add streaming support for longer responses

 Deploy on Vercel

📄 License

MIT License. Free to use and modify.
