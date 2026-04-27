import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AiHelpChat } from "@/components/ai-help/AiHelpChat";

export const metadata = {
  title: "Aide KAÏA — chat",
  description: "Pose-moi tes questions sur l'app, le bien-être ou ta routine.",
};

export const dynamic = "force-dynamic";

export default async function AiHelpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/ai-help");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col" style={{ minHeight: "calc(100vh - 100px)" }}>
      <header className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-6 w-6 text-amber-300" />
          <h1 className="font-display text-2xl">Pose-moi ta question</h1>
        </div>
        <p className="text-sm text-white/70">
          Je réponds sur l&apos;app KAÏA, ta routine et le bien-être quotidien. Pour tout
          ce qui est médical, juridique ou en cas d&apos;urgence : pas moi 🙏
        </p>
      </header>
      <AiHelpChat />
    </div>
  );
}
