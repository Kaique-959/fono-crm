import { NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { createAdminClient } from '@/lib/supabase-admin'
import { validateWebhookToken } from '@/lib/webhook-auth'

export async function POST(request: Request) {
  const authError = validateWebhookToken(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { paciente_id, image_base64, mime_type } = body

    if (!paciente_id || !image_base64) {
      return NextResponse.json({ error: 'Faltou paciente_id ou image_base64' }, { status: 400 })
    }

    const cleanBase64 = image_base64.replace(/^data:[^;]+;base64,/, '')
    const bytes = Buffer.from(cleanBase64, 'base64')

    const pdfDoc = await PDFDocument.create()
    const isJpeg = (mime_type || '').includes('jpeg') || (mime_type || '').includes('jpg')
    const isPng = (mime_type || '').includes('png')

    let image
    if (isJpeg) {
      image = await pdfDoc.embedJpg(bytes)
    } else if (isPng) {
      image = await pdfDoc.embedPng(bytes)
    } else {
      return NextResponse.json({ error: 'Formato de imagem nao suportado. Use JPEG ou PNG.' }, { status: 400 })
    }

    const A4_W = 595.28
    const A4_H = 841.89
    const margin = 20
    const maxW = A4_W - margin * 2
    const maxH = A4_H - margin * 2
    const scale = Math.min(maxW / image.width, maxH / image.height)
    const drawW = image.width * scale
    const drawH = image.height * scale
    const page = pdfDoc.addPage([A4_W, A4_H])
    page.drawImage(image, {
      x: (A4_W - drawW) / 2,
      y: (A4_H - drawH) / 2,
      width: drawW,
      height: drawH,
    })

    const pdfBytes = await pdfDoc.save()

    const fileName = `pedido_${paciente_id}_${Date.now()}.pdf`
    const supabase = createAdminClient()

    const { data: paciente } = await supabase
      .from('pacientes')
      .select('id')
      .eq('id', paciente_id)
      .single()

    if (!paciente) {
      return NextResponse.json({ error: 'Paciente nao encontrado' }, { status: 404 })
    }

    const { error: uploadErr } = await supabase.storage
      .from('pedidos-medicos')
      .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) {
      return NextResponse.json({ error: 'Erro no upload: ' + uploadErr.message }, { status: 500 })
    }

    const { data: signedUrlData, error: urlErr } = await supabase.storage
      .from('pedidos-medicos')
      .createSignedUrl(fileName, 3600)

    if (urlErr || !signedUrlData?.signedUrl) {
      return NextResponse.json({ error: 'Erro ao gerar URL assinada: ' + (urlErr?.message || 'unknown') }, { status: 500 })
    }

    await supabase.from('pacientes').update({ pedido_file: signedUrlData.signedUrl }).eq('id', paciente_id)

    return NextResponse.json({
      success: true,
      pedido_file: signedUrlData.signedUrl,
      file_name: fileName,
      expires_in: 3600,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
