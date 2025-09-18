import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Twilio } from 'https://esm.sh/twilio@4.20.0'

interface OverdueCustomer {
  customer_id: string
  full_name: string
  phone_1: string
  overdue_amount: number
}

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient( Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' )
    const { data: customers, error: rpcError } = await supabaseClient.rpc('get_overdue_customers')
    if (rpcError) throw new Error(`Failed to get overdue customers: ${rpcError.message}`)
    if (!customers || customers.length === 0) {
      return new Response(JSON.stringify({ message: 'No overdue customers found.' }), { headers: { 'Content-Type': 'application/json' }, status: 200, })
    }
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
    if (!accountSid || !authToken || !twilioPhoneNumber) { throw new Error('Twilio credentials are not set in environment variables.') }
    const twilioClient = new Twilio(accountSid, authToken)
    let sentMessages = 0;
    for (const customer of customers as OverdueCustomer[]) {
      let toPhoneNumber = customer.phone_1.startsWith('+') ? customer.phone_1 : `+965${customer.phone_1}`;
      toPhoneNumber = `whatsapp:${toPhoneNumber}`;
      const messageBody = `
        مرحباً ${customer.full_name},
        نود تذكيركم بوجود مبلغ متأخر عليكم بقيمة ${customer.overdue_amount.toFixed(2)} د.ك.
        يرجى التواصل معنا لترتيب عملية السداد.
        شكراً لتعاونكم.
      `
      try {
        await twilioClient.messages.create({ from: twilioPhoneNumber, to: toPhoneNumber, body: messageBody.trim() })
        sentMessages++;
      } catch (twilioError) {
        console.error(`Failed to send message to ${customer.full_name}:`, twilioError)
      }
    }
    return new Response(JSON.stringify({ message: `Successfully sent ${sentMessages} reminders.` }), { headers: { 'Content-Type': 'application/json' }, status: 200, })
  } catch (error) {
    return new Response(String(error?.message ?? error), { status: 500 })
  }
})
