import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const app = new Hono()

// Supabaseと接続する準備
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// 確認用のページ（http://localhost:3000/ にアクセスした時）
app.get('/', (c) => {
  return c.text('カップ麺APIが元気に稼働中です🍜')
})

// ★ここがメインのAPI！ JANコードからデータを検索する
app.get('/api/noodles/:jan_code', async (c) => {
  // 1. URLから入力されたJANコードを受け取る
  const janCode = c.req.param('jan_code')

  // 2. Supabaseの「noodles」テーブルから、jan_codeが一致するデータを検索
  const { data, error } = await supabase
    .from('noodles')
    .select('*')
    .eq('jan_code', janCode)
    .single() // 1件だけ取得する

  // 3. データが見つからなかった場合のエラー処理
  if (error || !data) {
    return c.json({ error: '該当するカップ麺が見つかりませんでした' }, 404)
  }

  // 4. 無事に見つかったら、必要なデータだけをJSON形式で返す
  return c.json({
    jan_code: data.jan_code,
    name: data.name,
    time_minutes: data.cook_time  // ※ここで cooktime を取得しています
  })
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})