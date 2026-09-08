import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Runner Royale - 2D Platformer',
    short_name: 'Runner Royale',
    description: 'Fast-paced 2D multiplayer platformer with race rooms, double jump, moving platforms, and coins.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#4f46e5',
    orientation: 'any',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
