import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Deberc Score App',
                short_name: 'Деберць',
                description: 'Додаток для ведення рахунку в Деберці',
                theme_color: '#4f46e5',
                icons: [
                    {
                        src: 'favicon-32x32.png',
                        sizes: '32x32',
                        type: 'image/png'
                    },
                    {
                        src: 'favicon-32x32.png',
                        sizes: '192x192',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    server: {
        port: 5173,
    },
});