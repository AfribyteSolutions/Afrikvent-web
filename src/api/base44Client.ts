import { createClient } from '@base44/sdk';

export const base44 = createClient({
  appId: '6ab176e29f0cf3d63860b30f',
  options: {
    onError: (error) => {
      console.error('Mwakwa Base44 error:', error);
    },
  },
});
