import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { workspacesService } from '@/services/workspaces';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { workspace, setWorkspace } = useApp();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteWorkspace = async () => {
    try {
      setDeleting(true);
      setError(null);
      await workspacesService.deleteWorkspace(workspace.id);
      toast({
        title: 'Success',
        description: 'Workspace deleted successfully',
      });
      // Reset to default workspace after deletion
      setWorkspace({
        id: 'ws_1',
        name: 'Default Workspace',
        plan: 'pro',
      });
      setDeleteDialogOpen(false);
      // Optionally redirect to a different page
      window.location.href = '/';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workspace';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your workspace settings" />

      <div className="max-w-2xl space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input defaultValue={workspace.name} />
            </div>
            <div className="space-y-2">
              <Label>Workspace ID</Label>
              <Input value={workspace.id} disabled />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete this workspace and all associated data. This action cannot be undone.
            </p>
            <Button 
              variant="destructive" 
              onClick={() => setDeleteDialogOpen(true)}
              disabled={workspace.id === 'ws_1'}
            >
              Delete Workspace
            </Button>
            {workspace.id === 'ws_1' && (
              <p className="text-xs text-muted-foreground mt-2">
                The default workspace cannot be deleted.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the workspace
              <strong> {workspace.name}</strong> and all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All payment intents</li>
                <li>All transactions</li>
                <li>All wallets</li>
                <li>All API keys</li>
                <li>All guard configurations</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
