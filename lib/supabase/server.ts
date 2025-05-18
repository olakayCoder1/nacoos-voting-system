import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export function createServerClient() {
  const cookieStore = cookies()


  console.log(process.env.SUPABASE_URL)
  console.log(process.env.SUPABASE_ANON_KEY)
  return createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}
