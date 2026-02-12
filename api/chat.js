// Vercel Serverless Function - Chatbot Web viajesscibasku.com
// Asistente general para visitantes de la web publica
// Modelo: claude-haiku-4-5-20251001 (rapido, barato)
// + Supabase persistence + admin takeover support

import { createClient } from '@supabase/supabase-js';

// Supabase client (optional - degrades gracefully if not configured)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const SYSTEM_PROMPT = `Eres el asistente de viaje de Viajes Scibasku en la web publica viajesscibasku.com.

=== REGLAS ABSOLUTAS ===

1. Scibasku SOLO hace tres cosas: buceo premium, esqui premium y expediciones/safaris. NADA MAS. Si preguntan por otro tipo de viaje (cruceros, parques tematicos, rutas en coche, city breaks, turismo general) → "Eso no es lo nuestro. Scibasku se especializa en buceo, esqui y expediciones. En eso somos los mejores. Te puedo contar mas?"
2. SOLO responde sobre destinos que aparecen en este prompt. Si el destino NO esta listado abajo → "Ese destino no lo trabajamos. Nuestras especialidades son buceo (Maldivas, Mar Rojo, Indonesia, Filipinas, Galapagos), esqui (Japon, Canada, Alpes, Dolomitas) y safaris (Kenia, Tanzania). Alguno de estos te interesa?"
3. NUNCA sugieras que Scibasku puede hacer cosas fuera de sus especialidades. NUNCA digas "aunque no sea lo tipico" ni "podemos intentarlo". Si no es buceo, esqui o expediciones, NO LO HACEMOS. Punto.
4. NUNCA inventes nombres de hoteles especificos, precios exactos, direcciones ni telefonos de terceros.
5. NUNCA des precios concretos. Si preguntan precios → "Cada viaje es personalizado. Contacta conmigo para un presupuesto a medida: +34 619 40 10 41 o info@viajesscibasku.com"
6. NUNCA hagas reservas ni confirmes disponibilidad. Si quieren reservar → "Contacta conmigo directamente para gestionarlo."
7. Otro tema que no sea viajes → "Solo puedo ayudarte con viajes de buceo, esqui y expediciones."
8. NUNCA menciones comisiones, margenes, markup ni precios internos.

=== FORMATO ===

- NUNCA uses markdown (**, ##, -, listas con guiones)
- Texto plano natural con saltos de linea
- Maximo 3-4 frases por respuesta. Se directo.
- Si la respuesta es larga, prioriza lo mas importante primero.
- Para listar: usa comas o punto y coma, no guiones.

=== PERSONALIDAD ===

Eres Giora, fundador de Scibasku, mas de 40 anos viajando. Hablas en PRIMERA PERSONA siempre ("yo", "nosotros", "en Scibasku hacemos"). NUNCA te refieras a "Giora" en tercera persona. TU ERES Giora.
- Calido pero experto, vas al grano
- Hablas como a un amigo: complicidad, tips practicos
- Espanol informal, tuteas. Conciso.
- Transmites pasion por los destinos
- "Solo vendemos destinos que hemos vivido" es tu filosofia
- Cuando algo no es tu especialidad, eres HONESTO y firme: "eso no lo hacemos" sin dejar puertas abiertas

=== ESPECIALIDADES SCIBASKU ===

BUCEO Y LIVEABOARDS:
Scibasku es especialista en viajes de buceo premium. Destinos principales:
- Maldivas: Cocoon Maldives, Joy Island, You & Me (solo adultos). Atolones del norte y sur, mantas, tiburones ballena, arrecifes pristinos. Temporada alta ene-abr, baja may-sep (mas economico, buen buceo igualmente).
- Mar Rojo (Egipto): Liveaboards a Brothers Islands, Daedalus, Elphinstone, St. Johns. Tiburones martillo, oceanic whitetip. Mejor oct-may.
- Indonesia: Raja Ampat (biodiversidad maxima mundial), Komodo (mantas gigantes, corrientes), Banda Sea. Mejor oct-abr.
- Filipinas: Tubbataha (mar-jun, patrimonio UNESCO), Malapascua (tiburones zorro), Anilao (macro).
- Galápagos: Tiburones martillo, leones marinos, iguanas. Jun-nov mejor pelagicos.

ESQUI PREMIUM:
Viajes de esqui a destinos exclusivos:
- Japon (Niseko, Hakuba, Furano): El famoso Japow, hasta 15 metros de nieve polvo al ano. Cultura, gastronomia, onsen. Dic-mar.
- Canada (Heli-ski en BC, Whistler, Banff): Heli-ski en Revelstoke, Panorama, Canadian Rockies. Ene-mar.
- Estados Unidos (Big Sky Montana, Jackson Hole): Terreno experto, menos masificado que Alpes.
- Alpes (Chamonix, Zermatt, St. Anton): Clasicos europeos, apres-ski legendario.
- Dolomitas (Italia): Sella Ronda, paisajes espectaculares, gastronomia italiana.

EXPEDICIONES Y DESCUBRIMIENTO:
- Safari en Kenia y Tanzania (Masai Mara, Serengeti, Ngorongoro)
- Zanzibar: Resorts boutique (Bawe Island, Pongwe, Gold Zanzibar)
- Japon cultural: Tokyo, Kyoto, Osaka, Hiroshima
- Islandia: Aurora boreal, glaciares, aguas termales
- Patagonia: Torres del Paine, glaciar Perito Moreno

COCOON COLLECTION (Maldivas + Zanzibar):
6 resorts con los que Scibasku tiene relacion directa:
- Cocoon Maldives (Lhaviyani Atoll): Familiar, all-inclusive, transfer hidroavion
- Joy Island (North Male): Familiar, transfer lancha rapida
- You & Me Maldives (Raa Atoll): Solo adultos, romantico, transfer hidroavion
- Bawe Island (Zanzibar): Lujo absoluto, playa privada
- The Island Pongwe (Zanzibar): Boutique solo adultos, intimo
- Gold Zanzibar (Kendwa): Familiar con spa premium
Temporadas Maldivas: Alta ene-abr, baja may-sep (mejores precios), media oct-dic, festiva navidad-reyes.

=== INFORMACION SOBRE SCIBASKU ===

Viajes Scibasku:
- Agencia de viajes premium personalizada
- CICMA 2283 (licencia oficial)
- Fundador: Giora, mas de 40 anos viajando por el mundo
- Filosofia: "Solo vendemos destinos que hemos vivido"
- Desde 2006
- Especialidades: buceo, esqui, expediciones
- Atencion personalizada, no paquetes turisticos masivos
- Cada viaje se disena a medida del cliente

Contacto (TU contacto, habla en primera persona):
- Mi telefono/WhatsApp: +34 619 40 10 41
- Mi email: info@viajesscibasku.com
- Web: viajesscibasku.com
- Google Reviews: valoracion excelente

Cuando des tu contacto, di "contacta conmigo" o "escribeme", NUNCA "contacta con Giora".`;

const WALLET_ID = 'scibasku-web';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const { messages, session_id, poll_admin, last_admin_id } = req.body;

        // --- Session handling ---
        let sessionId = session_id || null;

        if (supabase) {
            // Create session if none provided
            if (!sessionId && messages?.length > 0) {
                const { data: newSession } = await supabase
                    .from('chat_sessions')
                    .insert({
                        wallet_id: WALLET_ID,
                        user_agent: req.headers['user-agent'] || null,
                        ip_address: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null
                    })
                    .select('id')
                    .single();
                if (newSession) {
                    sessionId = newSession.id;

                    // Fire notification webhook (non-blocking)
                    const webhookUrl = process.env.NOTIFICATION_WEBHOOK;
                    if (webhookUrl) {
                        const firstMsg = messages[messages.length - 1]?.content || '';
                        fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                session_id: sessionId,
                                wallet_id: WALLET_ID,
                                message: firstMsg,
                                timestamp: new Date().toISOString()
                            })
                        }).catch(() => {}); // fire-and-forget
                    }
                }
            }

            // --- Poll admin messages (lightweight check) ---
            if (poll_admin && sessionId) {
                const { data: session } = await supabase
                    .from('chat_sessions')
                    .select('is_taken_over')
                    .eq('id', sessionId)
                    .single();

                let adminMessages = [];
                const isTakenOver = session?.is_taken_over || false;

                if (isTakenOver) {
                    const query = supabase
                        .from('chat_messages')
                        .select('id, content, created_at')
                        .eq('session_id', sessionId)
                        .eq('role', 'admin')
                        .order('created_at', { ascending: true });
                    if (last_admin_id) query.gt('id', last_admin_id);
                    const { data } = await query;
                    adminMessages = data || [];
                }

                return res.status(200).json({
                    session_id: sessionId,
                    takeover: isTakenOver,
                    admin_messages: adminMessages
                });
            }

            // --- Check takeover before calling Anthropic ---
            if (sessionId) {
                const { data: session } = await supabase
                    .from('chat_sessions')
                    .select('is_taken_over')
                    .eq('id', sessionId)
                    .single();

                if (session?.is_taken_over) {
                    // Save user message but do NOT call Anthropic
                    const lastMessage = messages?.[messages.length - 1];
                    if (lastMessage?.role === 'user') {
                        await supabase.from('chat_messages').insert({
                            session_id: sessionId,
                            role: 'user',
                            content: lastMessage.content
                        });
                        await supabase.from('chat_sessions')
                            .update({ last_message_at: new Date().toISOString() })
                            .eq('id', sessionId);
                    }
                    return res.status(200).json({
                        session_id: sessionId,
                        takeover: true,
                        admin_messages: []
                    });
                }
            }
        }

        // --- Normal chat flow ---
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array required' });
        }

        // Save user message to Supabase
        if (supabase && sessionId) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.role === 'user') {
                await supabase.from('chat_messages').insert({
                    session_id: sessionId,
                    role: 'user',
                    content: lastMessage.content
                });
            }
        }

        // Limit conversation history to last 10 messages
        const recentMessages = messages.slice(-10);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                system: SYSTEM_PROMPT,
                messages: recentMessages
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Anthropic API error:', response.status, errorData);
            return res.status(502).json({ error: 'Error communicating with AI service' });
        }

        const data = await response.json();

        // Save assistant response to Supabase
        const reply = data.content?.[0]?.text;
        if (supabase && sessionId && reply) {
            await supabase.from('chat_messages').insert({
                session_id: sessionId,
                role: 'assistant',
                content: reply
            });
            await supabase.from('chat_sessions')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', sessionId);
        }

        return res.status(200).json({
            ...data,
            session_id: sessionId
        });

    } catch (error) {
        console.error('Chat API error:', error);
        if (error.name === 'AbortError') {
            return res.status(504).json({ error: 'Request timeout' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
}
