import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    message: 'API çalışıyor!',
    timestamp: new Date().toISOString(),
    env: {
      vercel: process.env.VERCEL ? true : false,
      node_env: process.env.NODE_ENV
    }
  });
}