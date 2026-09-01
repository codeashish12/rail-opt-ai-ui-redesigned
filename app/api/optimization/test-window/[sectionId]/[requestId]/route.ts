import { NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{
    sectionId: string
    requestId: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { sectionId, requestId } = await context.params
    const configuredBackendUrl = process.env.BACKEND_URL?.trim()
    const backendBaseUrl = (configuredBackendUrl || 'http://127.0.0.1:8000')
      .replace(/\/optimization\/run\/?$/, '')
      .replace(/\/$/, '')
    const backendResponse = await fetch(
      `${backendBaseUrl}/optimization/test-window/${encodeURIComponent(sectionId)}/${encodeURIComponent(requestId)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
    )
    const responseText = await backendResponse.text()
    const contentType = backendResponse.headers.get('content-type') || 'application/json'

    if (!backendResponse.ok) {
      return new NextResponse(responseText || 'Test-window backend request failed.', {
        status: backendResponse.status,
        headers: { 'Content-Type': contentType },
      })
    }

    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: { 'Content-Type': contentType },
    })
  } catch (error) {
    console.error('Test-window proxy failed:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error while proxying the test-window request.',
      },
      { status: 500 },
    )
  }
}
