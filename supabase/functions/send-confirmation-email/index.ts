import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { AccountConfirmationEmail } from './_templates/account-confirmation.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  confirmation_link: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmation_link }: ConfirmationEmailRequest = await req.json();

    console.log('Envoi de l\'email de confirmation à:', email);
    console.log('Lien de confirmation:', confirmation_link);

    // Render the React email template
    const html = await renderAsync(
      React.createElement(AccountConfirmationEmail, {
        confirmation_link,
        user_email: email,
      })
    );

    // Test if Resend API key is available
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('Resend API Key available:', !!resendApiKey);
    console.log('Resend API Key prefix:', resendApiKey?.substring(0, 7));

    const emailResponse = await resend.emails.send({
      from: "UniSubHub <onboarding@resend.dev>",
      to: ["tom.lifert@gmail.com"], // Utilise l'email vérifié pour les tests
      subject: `🎉 Test - Email de confirmation pour ${email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🧪 Email de Test UniSubHub</h2>
          <p><strong>Cet email aurait dû être envoyé à :</strong> ${email}</p>
          <hr>
          ${html}
          <hr>
          <p style="color: #666; font-size: 12px;">
            <em>Note: Cet email est envoyé à votre adresse de test car aucun domaine n'est vérifié dans Resend.</em>
          </p>
        </div>
      `,
    });

    console.log("Email de confirmation envoyé avec succès:", emailResponse);
    console.log("Email response status:", emailResponse.data?.id ? 'SUCCESS' : 'FAILED');
    console.log("Email response error:", emailResponse.error);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email de confirmation envoyé avec succès',
      data: emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erreur dans la fonction send-confirmation-email:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);