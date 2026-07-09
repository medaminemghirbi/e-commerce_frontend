import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const INSTANCE_ID    = '7107661547'
const INSTANCE_TOKEN = '0c61df8122b440f3b42ae1859522bcf89bdc7b93ea164d2196'

serve(async (req) => {
  try {
    const { record, old_record } = await req.json()

    // Only fire when status transitions TO 'confirmed'
    if (record?.status !== 'confirmed' || old_record?.status === 'confirmed') {
      return new Response('skipped', { status: 200 })
    }

    const phone: string = record.delivery_address?.phone ?? ''
    if (!phone) return new Response('no phone', { status: 200 })

    // Normalise Tunisian number → Green API format (216XXXXXXXX@c.us)
    const digits = phone.replace(/\D/g, '')
    const intl = digits.startsWith('216') ? digits : `216${digits}`
    const chatId = `${intl}@c.us`

    const orderId = (record.id as string).substring(0, 8).toUpperCase()
    const name    = record.delivery_address?.full_name ?? 'Client'
    const total   = record.total ?? 0

    const message = [
      `✅ Bonjour ${name},`,
      ``,
      `Votre commande *#${orderId}* a été *confirmée* ! 🎉`,
      `Montant total : *${total} TND*`,
      ``,
      `Vous serez livré(e) prochainement.`,
      `Merci de votre confiance — *MedicareInaya* 💊`,
    ].join('\n')

    const res = await fetch(
      `https://api.green-api.com/waInstance${INSTANCE_ID}/sendMessage/${INSTANCE_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message }),
      }
    )

    const data = await res.json()
    return new Response(JSON.stringify(data), { status: res.ok ? 200 : 500 })
  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
})
