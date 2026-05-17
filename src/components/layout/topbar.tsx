import { LogOut } from 'lucide-react';
import { signOut } from '@/auth';
import { Button } from '@/components/ui/button';
import { DemoBadge } from './demo-badge';

interface TopbarProps {
  userName: string;
  userRole: string;
}

async function logoutAction() {
  'use server';
  await signOut({ redirectTo: '/login' });
}

export function Topbar({ userName, userRole }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        <DemoBadge />
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-xs leading-tight">
          <div className="font-medium">{userName}</div>
          <div className="text-muted-foreground">{userRole}</div>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Esci">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
