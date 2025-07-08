import { NextRequest as Request, NextResponse as Response } from "next/server";

export const config = {
  runtime: "edge",
};

const start = Date.now();

export default async function api(req: Request) {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get("url");
  const count = toNumber(url.searchParams.get("count"));
  const time = Date.now();

  if (!targetUrl) {
    return Response.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  let data = null;
  let fetchTime = 0;
  
  for (let i = 0; i < count; i++) {
    const fetchStart = Date.now();
    try {
      const response = await fetch(targetUrl);
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

  return Response.json(
    {
      data,
      queryDuration: Date.now() - time,
      fetchTime,
      invocationIsCold: start === time,
      invocationRegion:
        (req.headers.get("x-vercel-id") ?? "").split(":")[1] || null,
    },
    {
      headers: {
        "x-edge-is-cold": start === time ? "1" : "0",
      },
    }
  );
}

// convert a query parameter to a number
// also apply a min and a max
function toNumber(queryParam: string | null, min = 1, max = 5) {
  const num = Number(queryParam);
  return Number.isNaN(num) ? null : Math.min(Math.max(num, min), max);
} 