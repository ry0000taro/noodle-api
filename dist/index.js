import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
const app = new Hono();
// 環境変数の取得（Workers か Node の両方に対応）
const getEnv = () => {
    if (typeof process !== 'undefined' && process.env) {
        return {
            SUPABASE_URL: process.env.SUPABASE_URL || '',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ''
        };
    }
    return {
        SUPABASE_URL: globalThis.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: globalThis.SUPABASE_ANON_KEY || ''
    };
};
let cachedSupabase = null;
const getSupabase = () => {
    if (cachedSupabase)
        return cachedSupabase;
    const { SUPABASE_URL: supabaseUrl = '', SUPABASE_ANON_KEY: supabaseKey = '' } = getEnv();
    if (!supabaseUrl)
        return null;
    cachedSupabase = createClient(supabaseUrl, supabaseKey);
    return cachedSupabase;
};
// 確認用のページ（http://localhost:3000/ にアクセスした時）
app.get('/', (c) => {
    return c.text('カップ麺APIが元気に稼働中です🍜');
});
// ★ここがメインのAPI！ JANコードからデータを検索する
app.get('/api/noodles/:jan_code', async (c) => {
    // 1. URLから入力されたJANコードを受け取る
    const janCode = c.req.param('jan_code');
    // 2. Supabaseの「noodles」テーブルから、jan_codeが一致するデータを検索
    const supabase = getSupabase();
    if (!supabase) {
        return c.json({ error: 'Supabase が設定されていません (SUPABASE_URL を確認してください)' }, 500);
    }
    const { data, error } = await supabase
        .from('noodles')
        .select('*')
        .eq('jan_code', janCode)
        .single(); // 1件だけ取得する
    // 3. データが見つからなかった場合のエラー処理
    if (error || !data) {
        return c.json({ error: '該当するカップ麺が見つかりませんでした' }, 404);
    }
    // 4. 無事に見つかったら、必要なデータだけをJSON形式で返す
    const noodle = data;
    return c.json({
        jan_code: noodle.jan_code,
        name: noodle.name,
        time_minutes: noodle.cook_time // ※ここで cooktime を取得しています
    });
});
if (typeof addEventListener !== 'undefined') {
    addEventListener('fetch', (event) => {
        event.respondWith(app.fetch(event.request));
    });
}
export default app.fetch;
export async function fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
}
