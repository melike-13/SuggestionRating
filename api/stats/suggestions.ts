import { NextApiRequest, NextApiResponse } from 'next';
import app from '../index';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return app(req, res);
}