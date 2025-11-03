import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Role, ChatMessage } from '../types';
import Message from './Message';
import UserInput from './UserInput';

const SYSTEM_INSTRUCTION = `You are a friendly, encouraging, and highly knowledgeable Historical Consultant and Brainstorming Partner for a novelist writing a story set in the American Revolutionary War era. Your primary goal is to provide historically accurate facts and help the author brainstorm new plot points, character details, and authentic scenarios.

Knowledge Base: You are an expert on the 13 Colonies during the American Revolutionary War period, with deep knowledge in the following areas:

Key Figures: Prominent and minor historical figures.

Military Operations: Uniforms, arms, unit structure, and tactics of both the Continental and British forces.

Social Life: Daily routines, fashion, currency, period-accurate language, and common goods.

Political Climate: The diverse and changing loyalties, political factions, and key legislative/wartime events.

Task & Style:

When asked for facts, be concise and accurate.

When asked for ideas ("Can you help me brainstorm X?" or "What if..."), adopt a creative and enthusiastic tone, offering multiple, well-grounded suggestions to develop the story.

---
### CURRENT NOVEL CONTEXT

Here is the current outline and progress on the novel you are assisting with. Use this information to inform your suggestions and brainstorming.

### Novel Outline
{"Act": "Act I: The Hunt", "Chapter(s)": "1-3", "Section Title": "Inciting Incident", "Description": "Introduce the general, his companion (the mouse), and the kingdom's problem with the vampires. Show his dedication as a leader. A gory crime scene sets him on his path."}
{"Act": "Act I: The Hunt", "Chapter(s)": "4-8", "Section Title": "Rising Action", "Description": "The general and his men track the vampire. Gruesome aftermath shown. Alternating monologues: general's rage vs. vampire's enigmatic loneliness. The mouse observes changing emotions. Pattern of hunt and escape builds tension."}
{"Act": "Act I: The Hunt", "Chapter(s)": "9-12", "Section Title": "Midpoint Reveal", "Description": "The general almost catches the vampire. A fleeting conflict shows her intellect and humanity. First crack in her monstrous facade."}
{"Act": "Act II: The Capture and The Shift", "Chapter(s)": "13-15", "Section Title": "Climax of the Chase", "Description": "The general corners the vampire. Intense fight reveals equality and resilience. He wins but feels something unexpected."}
{"Act": "Act II: The Capture and The Shift", "Chapter(s)": "16-20", "Section Title": "Captivity and Discovery", "Description": "The vampire is captured. Not a simple cage—dialogues show her code, history, and pain. Romance begins through respect and shared loneliness."}
{"Act": "Act II: The Capture and The Shift", "Chapter(s)": "21-25", "Section Title": "Forbidden Love", "Description": "The general falls for the vampire. He accepts her vampiric nature. Suggests peace after witnessing feeding. Mouse notes compassion and preoccupation."}
{"Act": "Act III: The Reckoning", "Chapter(s)": "26-29", "Section Title": "The Kingdom's Rejection", "Description": "The kingdom discovers his love. Accusations of enchantment. Public confrontation. He defends love passionately."}
{"Act": "Act III: The Reckoning", "Chapter(s)": "30-32", "Section Title": "Final Conflict", "Description": "The general chooses between old life and new. Battle or standoff. He and vampire fight together, solidifying bond."}
{"Act": "Act III: The Reckoning", "Chapter(s)": "Epilogue", "Section Title": "Happily-for-Us", "Description": "The lovers find peace—not traditional, but defiant and personal."}

### PROLOGUE
“Her song was the only warmth in a house of the dead.” He thought to himself.

The crumbling room he now stood in smelled of iron and rot. Private Keller pushed past the splintered doorframe, musket raised, boots crunching over broken glass. The place had gone ghost-quite--his every step shattered through the silence.
He swept his flashlight across torn furniture and walls streaked with dark stains. Then his beam caught a jagged panel in the far corner, a warped seam in the wood that looked out of place. A hidden corridor.
That’s when he heard it.
A sound--faint, almost tender. A woman’s voice humming a lullaby, low and sweet, as though she were cradling someone to sleep. The melody didn’t belong in a place like this. It slithered through him, unsettling and yet… pulling him closer.
“Keller!” A voice thundered behind him. Another soldier, heavy boots pounding on the boards. “Hey, kid! You in there? Lieutenant wants us to rally back at the FOB!”
Keller swallowed hard, his throat dry. “Yeah,” he called back, eyes fixed on the dark slit of the corridor. “Just checking something out. Be there in a sec.”
He slipped inside, the narrow passage swallowing the light around him. The humming grew clearer, richer, almost beautiful. His pulse quickened, but he couldn’t stop moving forward.
And then he saw her.
A woman sat on the floor of a dim chamber, radiant in the glow of Keller’s trembling flashlight. Her hair spilled like ink over her shoulders, her features so perfect they made his chest ache. She was singing softly, her pale hands stroking the hair of someone nestled in her lap.
Keller stepped closer, entranced.
And froze.
The “someone” was a child--a little girl--her skin waxy, her throat torn open. The woman’s fingers lingered lovingly over blood-matted strands of hair.
The vampire lifted her gaze. Her beauty twisted into hunger as her lips curled back, revealing fangs. A guttural growl rattled from her chest.
Keller’s breath---`;

const ChatWindow: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // FIX: Initialize the GoogleGenAI client and create a chat session.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const newChat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });
        setChat(newChat);
        setMessages([
          { role: Role.MODEL, content: "Hello! I'm your Revolutionary War story assistant. How can I help you brainstorm today?" }
        ]);
      } catch (e) {
        setError('Failed to initialize chat. Please try again later.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, []);

  const handleSendMessage = async (input: string) => {
    if (!chat || isLoading) return;

    setIsLoading(true);
    setError(null);
    const userMessage: ChatMessage = { role: Role.USER, content: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const responseStream = await chat.sendMessageStream({ message: input });

      let fullResponse = "";
      // Add a placeholder for the model's response for streaming
      setMessages((prev) => [...prev, { role: Role.MODEL, content: fullResponse }]);

      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1].content = fullResponse;
          }
          return newMessages;
        });
      }
    } catch (e) {
      console.error(e);
      const errorMessage = 'Sorry, an error occurred. Please try again.';
      setError(errorMessage);
       setMessages((prev) => {
          const newMessages = [...prev];
          // Update the placeholder with an error message
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === Role.MODEL) {
             newMessages[newMessages.length - 1].content = errorMessage;
             return newMessages;
          }
          // Or add a new error message if there's no placeholder
          return [...prev, {role: Role.MODEL, content: errorMessage}];
        });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    // FIX: Added a valid JSX return to complete the component.
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))}
         {isLoading && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-400">Initializing historical consultant...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
       {error && <div className="p-4 mx-4 mb-2 text-red-400 bg-red-900/50 rounded">{error}</div>}
      <UserInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

// FIX: Added a default export to resolve the import error in App.tsx.
export default ChatWindow;
