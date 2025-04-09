export const Bubble = ({ message }) => {
  const isUser = message.role === "user";

  // Get the message text safely
  const text = message.parts?.[0]?.text || message.content;

  return (
    <div className={`bubble ${isUser ? "user" : "assistant"}`}>
      <p>{text}</p>
    </div>
  );
};
