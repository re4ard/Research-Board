import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { scrapeMetadata } from "@/lib/metadata";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const metadata = await scrapeMetadata(body);

    return NextResponse.json({ metadata });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid URL." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to read metadata from this URL."
      },
      { status: 400 }
    );
  }
}
