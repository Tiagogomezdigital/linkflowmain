import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Função para obter o cliente Supabase no contexto de Server Components
// Deve ser usada APENAS em: page.tsx (server), layout.tsx (server), route.ts (api)
// Função para obter o cliente Supabase no contexto de Server Components
// Deve ser usada APENAS em: page.tsx (server), layout.tsx (server), route.ts (api)
export async function getSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            }
        }
    );
}

export async function getUserSession() {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
}
