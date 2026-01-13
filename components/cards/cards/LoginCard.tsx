import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button, Input, Label } from '../Molecules';
import * as Separator from '@radix-ui/react-separator';

export default function LoginCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: theme.text.main }}>Log in</h1>
      
      <form className="space-y-4 mb-6">
        <div>
          <Label theme={theme} htmlFor="email">Email</Label>
          <Input theme={theme} id="email" placeholder="your@email.com" style={{ padding: '12px 16px' }} />
        </div>
        <div>
          <Label theme={theme} htmlFor="password">Password</Label>
          <Input theme={theme} id="password" type="password" placeholder="Enter password..." style={{ padding: '12px 16px' }} />
        </div>
        <Button theme={theme} style={{ width: '100%', padding: '12px 24px' }}>Log in</Button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <Separator.Root className="flex-1" style={{ backgroundColor: theme.border.subtle, height: '1px' }} />
        <span className="text-sm" style={{ color: theme.text.tertiary }}>OR</span>
        <Separator.Root className="flex-1" style={{ backgroundColor: theme.border.subtle, height: '1px' }} />
      </div>

      <div className="space-y-3">
        <Button theme={theme} variant="tertiary" style={{ width: '100%', padding: '12px 24px' }}>
          Continue with Microsoft
        </Button>
        <Button theme={theme} variant="tertiary" style={{ width: '100%', padding: '12px 24px' }}>
          Continue with Google
        </Button>
        <Button theme={theme} variant="tertiary" style={{ width: '100%', padding: '12px 24px' }}>
          Continue with Apple
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 text-sm">
        <a href="#" style={{ color: theme.text.secondary }}>Can't log in?</a>
        <span style={{ color: theme.text.tertiary }}>•</span>
        <a href="#" style={{ color: theme.text.secondary }}>Already have an account?</a>
      </div>
    </BaseCard>
  );
}
