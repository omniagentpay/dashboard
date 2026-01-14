import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-lg px-6">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">OmniAgentPay</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Agentic payments dashboard for USDC, x402, and cross-chain transfers.
        </p>
        <Link to="/app">
          <Button size="lg">
            Enter Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
