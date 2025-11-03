import React from 'react';
import ChatWindow from './components/ChatWindow';

const App: React.FC = () => {
  return (
    <div className="font-serif min-h-screen text-gray-200 flex flex-col items-center justify-center p-2 sm:p-4">
       <div className="w-full h-full max-w-4xl mx-auto flex flex-col shadow-2xl rounded-lg border border-[#a37e58] bg-[#1c1611]/80 backdrop-blur-sm min-h-[85vh]">
        <header className="bg-[#3a2d23] text-[#fdf6e3] p-4 rounded-t-lg flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">Revolutionary War Story Assistant</h1>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18" />
            </svg>
        </header>
        <ChatWindow />
       </div>
    </div>
  );
};

export default App;
