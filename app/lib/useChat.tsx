import { useState } from 'react';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const append = async (message:any) => {
    const newMessages = [...messages, message];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      setMessages([...newMessages, {
        id: data.id,
        role: data.role,
        content: data.parts[0].text, // simple text handling
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const handleInputChange = (e) => setInput(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    append({ id: crypto.randomUUID(), role: 'user', content: input });
  };

  return {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    append
  };
}
