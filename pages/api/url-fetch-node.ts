import { NextApiRequest, NextApiResponse } from 'next';

const start = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url: targetUrl, count } = req.query;
  const queryCount = toNumber(count as string);
  const time = Date.now();

  if (!targetUrl) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  let data = null;
  let fetchTime = 0;
  
  for (let i = 0; i < queryCount; i++) {
    const fetchStart = Date.now();
    try {
      const response = await fetch(targetUrl as string);
      data = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
        // Only get a small portion of the response to avoid memory issues
        contentLength: response.headers.get('content-length'),
        contentType: response.headers.get('content-type'),
      };
      fetchTime = Date.now() - fetchStart;
    } catch (error) {
      data = {
        error: error.message,
        url: targetUrl,
      };
      fetchTime = Date.now() - fetchStart;
    }
  }

  res.setHeader('x-edge-is-cold', start === time ? '1' : '0');
  
  return res.json({
    data,
    queryDuration: Date.now() - time,
    fetchTime,
    invocationIsCold: start === time,
    invocationRegion:
      (req.headers['x-vercel-id'] as string ?? "").split(":")[1] || null,
  });
}

// convert a query parameter to a number
// also apply a min and a max
function toNumber(queryParam: string | null, min = 1, max = 5) {
  const num = Number(queryParam);
  return Number.isNaN(num) ? null : Math.min(Math.max(num, min), max);
} 