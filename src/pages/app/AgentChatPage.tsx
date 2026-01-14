import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/StatusChip';
import { JsonViewer } from '@/components/JsonViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Bot, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { ChatMessage, PaymentIntent } from '@/types';
import { paymentsService } from '@/services/payments';
import { cn } from '@/lib/utils';

export default function AgentChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<PaymentIntent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadPendingIntent();
  }, []);

  const loadPendingIntent = async () => {
    try {
      const intents = await paymentsService.getIntents();
      const pending = intents.find(i => i.status === 'awaiting_approval');
      setPendingIntent(pending || null);
    } catch (error) {
      console.error('Failed to load pending intent:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Agent response would come from backend/MCP integration
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: "I'll help you with that. Let me check the current status and available options.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <PageHeader 
        title="Agent Chat" 
        description="Interact with your payment agent"
      />

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.toolCalls.map((call, idx) => (
                        <div key={idx} className="rounded-md border bg-background p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                              {call.tool}
                            </code>
                            {call.output && (
                              <CheckCircle className="h-3 w-3 text-success" />
                            )}
                          </div>
                          {call.output && (
                            <JsonViewer data={call.output} className="text-xs" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the agent to make a payment, check balances, or transfer funds..."
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Side Panel - Pending Approval */}
        <div className="w-80 space-y-4 shrink-0">
          {pendingIntent && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Approval Required</h3>
                  <StatusChip status={pendingIntent.status} />
                </div>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-lg font-semibold">${pendingIntent.amount.toLocaleString()} {pendingIntent.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recipient</p>
                    <p className="text-sm font-medium">{pendingIntent.recipient}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm">{pendingIntent.description}</p>
                  </div>
                </div>

                <div className="border-t pt-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Guard Results</p>
                  {pendingIntent.guardResults.map((result, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1">
                      <span>{result.guardName}</span>
                      {result.passed ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    Reject
                  </Button>
                  <Button className="flex-1">
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setInput('Check my wallet balances')}>
                  Check balances
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setInput('Show recent transactions')}>
                  Recent transactions
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setInput('Bridge 1000 USDC from Ethereum to Polygon')}>
                  Bridge funds
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
