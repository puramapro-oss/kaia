import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingWizardV2 from "@/components/onboarding/OnboardingWizardV2";

export const metadata = {
  title: "Bienvenue — KAÏA",
  description: "Quelques questions pour personnaliser ton expérience du cycle.",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    redirect("/accueil");
  }

  return <OnboardingWizardV2 userId={user.id} />;
}
