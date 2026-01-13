import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button } from '../Molecules';
import * as Avatar from '@radix-ui/react-avatar';

export default function SalesCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6">
      <div className="mb-6">
        <img
          src="https://i.postimg.cc/qRfqRZdc/image.png"
          alt="Sales workspace"
          className="w-full rounded-lg mb-6"
        />
      </div>
      <h2 className="text-2xl font-bold mb-3" style={{ color: theme.text.main }}>For Smarter Sales</h2>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: theme.text.secondary }}>
        Book more meetings and close deals quicker with Us, click-to-dial, real-time coaching,
        and Ai cloud capabilities.
      </p>
      <Button theme={theme} variant="secondary" style={{ marginBottom: '24px' }}>Learn more</Button>

      <div className="p-4 rounded-lg" style={{ backgroundColor: theme.bg.input }}>
        <div className="flex items-start gap-4 mb-4">
          <Avatar.Root className="w-12 h-12 rounded-full overflow-hidden">
            <Avatar.Image src="https://i.postimg.cc/cJTwTVps/Captura-de-pantalla-2024-12-31-a-las-20-32-35.png" />
            <Avatar.Fallback style={{ backgroundColor: theme.action.primary }} />
          </Avatar.Root>
          <div>
            <h3 className="font-semibold mb-1" style={{ color: theme.text.main }}>María Balerio</h3>
            <p className="text-xs" style={{ color: theme.text.secondary }}>
              Sales Operations Manager <a href="#" style={{ color: theme.action.primary }}>@workharcompany</a>
            </p>
          </div>
        </div>
        <blockquote className="text-sm italic" style={{ color: theme.text.secondary }}>
          "We have increased our quotas by 20% because of the data we've gathered from Ai call
          tagging and analytics."
        </blockquote>
      </div>
    </BaseCard>
  );
}
