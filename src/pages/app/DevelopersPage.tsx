import { PageHeader } from '@/components/PageHeader';
import { CodeSnippet } from '@/components/CodeSnippet';
import { JsonViewer } from '@/components/JsonViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { mcpService, mcpConfig, requiredEnvVars } from '@/services/mcp';
import type { McpToolResult } from '@/types';

export default function DevelopersPage() {
  const [toolResults, setToolResults] = useState<Record<string, McpToolResult | null>>({});
  const [runningTool, setRunningTool] = useState<string | null>(null);

  const handleRunTool = async (toolName: string) => {
    setRunningTool(toolName);
    const result = await mcpService.executeTool(toolName, {
      wallet_id: 'wallet_1',
      limit: 5,
      amount: 100,
      source_chain: 'ethereum',
      dest_chain: 'polygon',
    });
    setToolResults((prev) => ({ ...prev, [toolName]: result }));
    setRunningTool(null);
  };

  const tools = ['check_balance', 'simulate', 'pay', 'history', 'bridge', 'unified_balance'];

  return (
    <div>
      <PageHeader
        title="Developers"
        description="MCP integration and API tools"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* MCP Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Claude Desktop MCP Config</CardTitle>
            <CardDescription>Add to your claude_desktop_config.json</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeSnippet
              code={JSON.stringify(mcpConfig, null, 2)}
              language="json"
              title="claude_desktop_config.json"
            />
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Required Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requiredEnvVars.map((envVar) => (
                <div key={envVar.name} className="border rounded-lg p-3">
                  <code className="text-sm font-mono text-primary">{envVar.name}</code>
                  <p className="text-xs text-muted-foreground mt-1">{envVar.description}</p>
                  {envVar.default && (
                    <p className="text-xs mt-1">Default: <code>{envVar.default}</code></p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tool Tester */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tool Tester</CardTitle>
            <CardDescription>Test MCP tools and view responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              {tools.map((tool) => (
                <Button
                  key={tool}
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunTool(tool)}
                  disabled={runningTool === tool}
                >
                  {runningTool === tool && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  {tool}
                </Button>
              ))}
            </div>

            {Object.entries(toolResults).map(([tool, result]) => (
              result && (
                <div key={tool} className="border rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <code className="font-mono text-sm">{tool}</code>
                    {result.success ? (
                      <Badge className="bg-success/10 text-success">
                        <CheckCircle className="h-3 w-3 mr-1" /> Success
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive">
                        <XCircle className="h-3 w-3 mr-1" /> Failed
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">{result.duration}ms</span>
                  </div>
                  <JsonViewer data={result.data || result.error} />
                </div>
              )
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
