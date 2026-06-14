import { groq } from '@/lib/ai/groq'

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json()
    if (!imageBase64) return new Response('Missing image', { status: 400 })

    const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition estimator. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            {
              type: 'text',
              text: 'Estimate the nutrition of this meal. Return ONLY this JSON shape: {"meal": "name of the dish", "calories": number, "protein": number, "carbs": number, "fat": number}. All numbers must be integers. If you cannot identify food, return {"meal": "unknown", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}.',
            },
          ],
        },
      ],
    })

    const text = response.choices[0].message.content?.trim() || '{}'
    const match = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(match ? match[0] : '{}')

    const fallback = { meal: 'unknown', calories: 0, protein: 0, carbs: 0, fat: 0 }
    return Response.json({ ...fallback, ...data, logged_at: new Date().toISOString() })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
