import { PromptSuggestionButton } from './PromptSuggestionButton';

export const PromptSuggestionRow = ({ onPromptClick }) => {
  const prompts = [
    'Give me the top 5 drivers in the 2023 Drivers’ Championship.',
    'Who is the team principal of Mercedes?',
    "What’s the current standings in the Constructors' Championship?",
    "Who is heading of racing for Aston Martin'x f1 Academy team?",
    "is Hamilton staying with Mercedes next season?",
    "What’s the rivalry between Verstappen and Hamilton about?",
    "How does DRS work in Formula 1?"
  ];
  return (
    <div className="prompt-suggestion-row">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton
          key={index}
          text={prompt}
          onClick={() => onPromptClick(prompt)}
        />
      ))}
    </div>
  );
};