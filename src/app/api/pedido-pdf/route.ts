import { NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
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
      image = await pdfDoc.embedPng(bytes)
    }

    const pageWidth = image.width
    const pageHeight = image.height
    const page = pdfDoc.addPage([pageWidth, pageHeight])
    page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight })

    const pdfBytes = await pdfDoc.save()

    const fileName = `pedido_${paciente_id}_${Date.now()}.pdf`
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { error: uploadErr } = await supabase.storage
      .from('pedidos-medicos')
      .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) {
      return NextResponse.json({ error: 'Erro no upload: ' + uploadErr.message }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from('pedidos-medicos').getPublicUrl(fileName)

    await supabase.from('pacientes').update({ pedido_file: publicUrl.publicUrl }).eq('id', paciente_id)

    return NextResponse.json({
      success: true,
      pedido_file: publicUrl.publicUrl,
      file_name: fileName,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
