import { NextApiRequest, NextApiResponse } from 'next';
import { fileURLToPath } from 'url';
import path from 'path';

// ESM uyumlu __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    message: 'Kaizen sistemi API çalışıyor!',
    timestamp: new Date().toISOString(),
    paths: {
      filename: __filename,
      dirname: __dirname
    }
  });
}