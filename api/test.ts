import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Kaizen API Test Endpoint',
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      method: req.method,
      path: req.url,
    });
  }
  
  return res.status(405).json({ error: 'Method Not Allowed' });
}