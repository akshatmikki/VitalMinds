import Anthropic from '@anthropic-ai/sdk'

// Node.js runtime (Anthropic SDK requires Node crypto/path — not edge compatible)
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json()
    if (!imageBase64) return new Response('Missing image', { status: 400 })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: imageBase64 },
            },
            {
              type: 'text',
              text: 'Estimate the nutrition of this meal. Return ONLY valid JSON: {"meal": "name of the dish", "calories": number, "protein": number, "carbs": number, "fat": number}. All numbers are integers. If you cannot identify food, return {"meal": "unknown", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}.',
            },
          ],
        },
      ],
    })

    const raw = (response.content[0] as any).text?.trim() || '{}'
    const data = JSON.parse(raw)
    return Response.json({ ...data, logged_at: new Date().toISOString() })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
