// Vercel Serverless Function - Admin Panel API
// Protected with Bearer ADMIN_SECRET
// Generic: works with any wallet_id

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Auth check
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) return res.status(500).json({ error: 'ADMIN_SECRET not configured' });

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (token !== adminSecret) return res.status(401).json({ error: 'Unauthorized' });

    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { action, session_id, content, wallet_id, last_message_id } = req.body;
    // Default wallet_id for the main website chatbot
    const wid = wallet_id || 'scibasku-web';

    try {
        switch (action) {
            case 'list_sessions': {
                const { data, error } = await supabase
                    .from('chat_sessions')
                    .select('id, wallet_id, visitor_name, is_taken_over, created_at, last_message_at, ip_address, user_agent')
                    .eq('wallet_id', wid)
                    .order('last_message_at', { ascending: false })
                    .limit(50);
                if (error) throw error;

                const enriched = await Promise.all((data || []).map(async (s) => {
                    const { count } = await supabase
                        .from('chat_messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('session_id', s.id);
                    const { data: lastMsg } = await supabase
                        .from('chat_messages')
                        .select('role, content, created_at')
                        .eq('session_id', s.id)
                        .order('created_at', { ascending: false })
                        .limit(1);
                    return {
                        ...s,
                        message_count: count || 0,
                        last_message: lastMsg?.[0] || null
                    };
                }));

                return res.status(200).json({ sessions: enriched });
            }

            case 'get_messages': {
                if (!session_id) return res.status(400).json({ error: 'session_id required' });

                const query = supabase
                    .from('chat_messages')
                    .select('id, role, content, created_at')
                    .eq('session_id', session_id)
                    .order('created_at', { ascending: true });

                if (last_message_id) query.gt('id', last_message_id);

                const { data, error } = await query;
                if (error) throw error;

                const { data: session } = await supabase
                    .from('chat_sessions')
                    .select('is_taken_over, visitor_name, created_at, last_message_at')
                    .eq('id', session_id)
                    .single();

                return res.status(200).json({
                    messages: data || [],
                    session: session || null
                });
            }

            case 'takeover': {
                if (!session_id) return res.status(400).json({ error: 'session_id required' });
                const { error } = await supabase
                    .from('chat_sessions')
                    .update({ is_taken_over: true })
                    .eq('id', session_id);
                if (error) throw error;

                await supabase.from('chat_messages').insert({
                    session_id,
                    role: 'admin',
                    content: '--- Giora se ha conectado al chat ---'
                });

                return res.status(200).json({ ok: true, is_taken_over: true });
            }

            case 'release': {
                if (!session_id) return res.status(400).json({ error: 'session_id required' });
                const { error } = await supabase
                    .from('chat_sessions')
                    .update({ is_taken_over: false })
                    .eq('id', session_id);
                if (error) throw error;

                await supabase.from('chat_messages').insert({
                    session_id,
                    role: 'admin',
                    content: '--- Giora se ha desconectado, el asistente vuelve a estar activo ---'
                });

                return res.status(200).json({ ok: true, is_taken_over: false });
            }

            case 'send_message': {
                if (!session_id || !content) {
                    return res.status(400).json({ error: 'session_id and content required' });
                }
                const { data, error } = await supabase
                    .from('chat_messages')
                    .insert({ session_id, role: 'admin', content })
                    .select('id, role, content, created_at')
                    .single();
                if (error) throw error;

                await supabase.from('chat_sessions')
                    .update({ last_message_at: new Date().toISOString() })
                    .eq('id', session_id);

                return res.status(200).json({ message: data });
            }

            case 'verify': {
                return res.status(200).json({ ok: true });
            }

            default:
                return res.status(400).json({ error: 'Unknown action: ' + action });
        }
    } catch (err) {
        console.error('Admin API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
