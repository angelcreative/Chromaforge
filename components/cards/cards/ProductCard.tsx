import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button, IconButton } from '../Molecules';
import { Heart, ShoppingCart } from 'lucide-react';

export default function ProductCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="overflow-hidden" style={{ width: '380px', maxWidth: '380px' }}>
      <div className="relative">
        <img
          src="https://github.com/angelcreative/colortokenbuilder/raw/main/a00dd77f-e6c3-4d68-894b-e3edd658bc2e-1_animation%20(1).gif"
          alt="Sport Shoes"
          className="w-full aspect-square object-cover"
        />
        <div className="absolute top-4 right-4">
          <IconButton theme={theme}>
            <Heart size={20} />
          </IconButton>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold mb-1" style={{ color: theme.text.main }}>Sneakers 270</h3>
        <p className="text-sm mb-3" style={{ color: theme.text.secondary }}>Running Collection</p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl font-bold" style={{ color: theme.text.main }}>$199.00</span>
          <span className="text-sm line-through" style={{ color: theme.text.tertiary }}>$249.00</span>
        </div>
        <Button theme={theme} className="w-full" icon={<ShoppingCart size={16} />}>
          Add to Cart
        </Button>
      </div>
    </BaseCard>
  );
}
