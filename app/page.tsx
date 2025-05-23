'use client';

import Image from 'next/image';
import f1logo from './assets/f1logo.png';

// import {useChat} from "ai/react"

// import { useChat } from '@ai-sdk/react';
// import { useChat } from '@ai-sdk/react';
import { useChat } from './lib/useChat';

import { Message } from 'ai';
import { PromptSuggestionRow } from './components/PromptSuggestionRow';
import { LoadingBubble } from './components/LoadingBubble';
import  { Bubble }  from './components/Bubble';
import { useEffect } from 'react';

const Home = () => {
  const handlePromptClick = (prompt: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: prompt,
      role: 'user',
    };
    append(msg);
  };
  const {
    append,
    isLoading,
    messages,
    input,
    handleInputChange,
    handleSubmit,
  } = useChat();

  const noMessages = !messages || messages.length === 0;

  useEffect(() => {
    console.log("All messages:", messages);
  }, [messages]);

 
  

  return (
    <main>
      <Image src={f1logo} width="250" alt="logo" />
      <section className={noMessages ? '' : 'populated'}>
        {noMessages ? (
          <>
            <p className="starter-text">
              Ask an F1 question and get the latest answers.
            </p>
            <br />
            <PromptSuggestionRow onPromptClick={handlePromptClick} />
          </>
        ) : (
          <>
            {/* {messages.map((message, index) => (
              <Bubble key={`message-${index}`} message={message} />
            ))} */}
            {messages.map((message) => (
  <Bubble key={message.id} message={message} />
))}

            {isLoading && <LoadingBubble />}
          </>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={handleInputChange}
          value={input}
          placeholder="Ask a question"
        />
        <input type="submit" />
      </form>
    </main>
  );
};

export default Home;