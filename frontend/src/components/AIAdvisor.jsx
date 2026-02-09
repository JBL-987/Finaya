import { useState, useRef, useEffect } from 'react';
import { Send, Brain, Bot, User, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { agentAPI } from '../services/api';

const AIAdvisor = ({ analysisData, businessParams }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Auto-Consultation
  useEffect(() => {
    const generateInitialAdvice = async () => {
      if (!analysisData || hasInitialized.current) return;
      
      hasInitialized.current = true;
      
      // Check for guest mode
      const token = localStorage.getItem('access_token');
      if (token === 'guest-token') {
        setMessages([{
          role: 'assistant',
          content: "👋 **Welcome to Finaya's AI Advisor!**\n\nI'm here to provide strategic insights and recommendations for your business locations.\n\nUnfortunately, **AI Advisor is only available for registered users**. To access this powerful feature:\n\n✅ **Sign in** to your account, or\n✅ **Create a free account** to get started\n\nOnce you're logged in, I'll be able to:\n- Analyze your location data\n- Provide strategic recommendations\n- Answer questions about competitors\n- Suggest improvements\n\nLooking forward to helping you make data-driven decisions! 🚀",
          type: 'guest_info'
        }]);
        return;
      }
      
      setIsLoading(true);

      try {
        const currentDate = new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        const contextData = {
          location_name: analysisData?.locationName,
          metrics: analysisData?.metrics,
          area_distribution: analysisData?.areaDistribution,
          business_params: businessParams,
          competitors: analysisData?.competitors || [],
          current_date: currentDate
        };

        const response = await agentAPI.getAdvice(
          `Current Date: ${currentDate}. Generate a comprehensive executive summary and strategic recommendation for this location based on the provided analysis data. Act as a senior business consultant. Keep it concise but impactful.`,
          contextData,
          []
        );

        setMessages([{
          role: 'assistant',
          content: response.advice,
          type: 'initial'
        }]);
      } catch (error) {
        console.error('Initial advice error:', error);
        setMessages([{
          role: 'assistant',
          content: "I've analyzed the data, but I'm having trouble generating a summary right now. What specific questions do you have?",
          isError: true
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    if (analysisData) {
      generateInitialAdvice();
    }
  }, [analysisData, businessParams]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Check for guest mode
    const token = localStorage.getItem('access_token');
    if (token === 'guest-token') {
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: userMessage },
        { 
          role: 'assistant', 
          content: "🔒 **AI Advisor is a premium feature**\n\nTo interact with me and get personalized strategic advice, please:\n\n✅ **Sign in** to your existing account\n✅ **Create a free account** if you're new\n\nI'm here to help you make smarter business decisions! 💡",
          type: 'guest_reminder'
        }
      ]);
      return;
    }
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const contextData = {
        location_name: analysisData?.locationName,
        metrics: analysisData?.metrics,
        area_distribution: analysisData?.areaDistribution,
        business_params: businessParams,
        competitors: analysisData?.competitors || [],
        current_date: currentDate
      };

      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        text: m.content
      }));

      const response = await agentAPI.getAdvice(userMessage, contextData, history);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.advice 
      }]);
    } catch (error) {
      console.error('Agent advice error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-transparent">
      
      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
        {messages.length === 0 && isLoading && (
           <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-75">
             <div className="relative">
               <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <Brain className="w-5 h-5 text-yellow-500 animate-pulse" />
               </div>
             </div>
             <div>
               <h4 className="text-base font-semibold text-white">Analyzing Business Data...</h4>
             </div>
           </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}
          >
            <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md mt-1 ${
                msg.role === 'user' 
                  ? 'bg-neutral-800 border border-neutral-700' 
                  : 'bg-yellow-500/10 border border-yellow-500/20'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-neutral-400" /> : <Bot className="w-4 h-4 text-yellow-400" />}
              </div>

              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-yellow-500 text-black font-medium rounded-tr-none' 
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none'
              }`}>
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-base font-bold text-yellow-400 mb-2 mt-3 first:mt-0" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-sm font-bold text-white mb-2 mt-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xs font-bold text-neutral-200 mb-1 mt-2" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed text-neutral-300" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1 text-neutral-300" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-neutral-300" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="text-yellow-400 font-bold" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-yellow-500/50 pl-4 py-2 my-4 bg-yellow-500/5 rounded-r-lg italic text-neutral-400" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
                
                {msg.isError && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 text-xs bg-red-900/10 p-2 rounded">
                    <AlertCircle className="w-3 h-3" />
                    Failed to generate response
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && messages.length > 0 && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-4 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center mt-1">
                <Bot className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="p-3 bg-neutral-900 rounded-2xl rounded-tl-none border border-neutral-800 flex gap-1.5 items-center h-10">
                <div className="w-1.5 h-1.5 bg-yellow-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-yellow-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-yellow-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-4 mt-2 border-t border-neutral-800/50">
        <form onSubmit={handleSend} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about strategy, competitors, or improvements..."
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder:text-neutral-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all transform active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
         <button 
          onClick={() => { setMessages([]); hasInitialized.current = false; }} 
          className="absolute -top-12 right-0 p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-white flex items-center gap-2 text-xs"
          title="Reset Conversation"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

export default AIAdvisor;
