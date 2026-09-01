import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000/optimization/run'

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const responseText = await backendResponse.text()

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          error: responseText || 'Optimization backend request failed.',
        },
        { status: backendResponse.status }
      )
    }

    const contentType = backendResponse.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return NextResponse.json(JSON.parse(responseText))
    }

    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: {
        'Content-Type': contentType || 'application/json',
      },
    })
  } catch (error) {
    console.error('Optimization proxy failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error while proxying optimization request.',
      },
      { status: 500 }
    )
  }
}
