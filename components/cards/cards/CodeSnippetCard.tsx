import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { IconButton } from '../Molecules';
import { Copy } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';

export default function CodeSnippetCard({ theme }: { theme: ThemeColors }) {
  const [activeTab, setActiveTab] = useState('python');

  const code = `import cohere
co = cohere.Client('apikey')
response = co.generate(
    prompt='Once upon a time in a magical land called'
)
print('Prediction: {}'.format(response.generations[0].text))`;

  const response = `{
    "generations": [
        {
            "text": "\\"Phoenix, Arizona\\" there lived a tiny lit"
        }
    ],
    "prompt": "Once upon a time in a magical land called"
}`;

  return (
    <BaseCard theme={theme} className="overflow-hidden">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.border.subtle }}>
          <Tabs.List className="flex gap-2">
            {['PYTHON', 'NODE', 'GO', 'CURL'].map((lang) => (
              <Tabs.Trigger
                key={lang}
                value={lang.toLowerCase()}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: activeTab === lang.toLowerCase() ? theme.action.primary : theme.bg.input,
                  color: activeTab === lang.toLowerCase() ? theme.text.onPrimary : theme.text.secondary,
                }}
              >
                {lang}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <IconButton theme={theme}>
            <Copy size={16} strokeWidth={1.5}/>
          </IconButton>
        </div>

        <Tabs.Content value="python" className="p-4">
          <pre
            className="text-sm font-mono overflow-x-auto"
            style={{
              backgroundColor: theme.bg.input,
              color: theme.text.main,
              padding: '16px',
              borderRadius: '8px',
            }}
          >
            <code>{code}</code>
          </pre>
        </Tabs.Content>
      </Tabs.Root>

      <div className="p-4 border-t" style={{ borderColor: theme.border.subtle }}>
        <div className="text-xs font-bold uppercase mb-2" style={{ color: theme.text.tertiary }}>RESPONSE</div>
        <pre
          className="text-sm font-mono overflow-x-auto"
          style={{
            backgroundColor: theme.bg.input,
            color: theme.text.main,
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <code>{response}</code>
        </pre>
      </div>
    </BaseCard>
  );
}
