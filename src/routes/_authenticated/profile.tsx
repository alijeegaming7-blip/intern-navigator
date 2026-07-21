import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — EEF" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

type Skill = { id: string; name: string; category: string };
type InternSkill = { skill_id: string; proficiency: number; skills: Skill };

function ProfilePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any>(null);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<InternSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: s }, { data: is }] = await Promise.all([
      supabase.from("profiles").select("*").maybeSingle(),
      supabase.from("skills").select("*").order("category").order("name"),
      supabase.from("intern_skills").select("skill_id, proficiency, skills(id, name, category)"),
    ]);
    setProfile(p);
    setAllSkills(s ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMySkills((is as any) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: String(form.get("full_name") ?? "").slice(0, 100),
        github_username: String(form.get("github_username") ?? "").slice(0, 60) || null,
        target_role: String(form.get("target_role") ?? "").slice(0, 80),
        bio: String(form.get("bio") ?? "").slice(0, 500) || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    load();
  };

  const addSkill = async (skillId: string) => {
    const { error } = await supabase.from("intern_skills").insert({
      user_id: profile.id,
      skill_id: skillId,
      proficiency: 40,
    });
    if (error) return toast.error(error.message);
    load();
  };

  const setProficiency = async (skillId: string, prof: number) => {
    const { error } = await supabase
      .from("intern_skills")
      .update({ proficiency: prof })
      .eq("user_id", profile.id)
      .eq("skill_id", skillId);
    if (error) toast.error(error.message);
  };

  const removeSkill = async (skillId: string) => {
    const { error } = await supabase
      .from("intern_skills")
      .delete()
      .eq("user_id", profile.id)
      .eq("skill_id", skillId);
    if (error) return toast.error(error.message);
    load();
  };

  if (loading)
    return (
      <div className="p-8 grid place-items-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  const mySkillIds = new Set(mySkills.map((s) => s.skill_id));
  const grouped = allSkills.reduce<Record<string, Skill[]>>((acc, s) => {
    if (mySkillIds.has(s.id)) return acc;
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <header>
        <p className="mono text-[11px] text-primary tracking-widest">PROFILE & SKILLS</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">
          Tune the <span className="gradient-text">signals</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything here feeds the AI. Keep it fresh.
        </p>
      </header>

      <form onSubmit={saveProfile} className="surface-panel p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" name="full_name" defaultValue={profile.full_name} />
          <Field
            label="Target role"
            name="target_role"
            defaultValue={profile.target_role}
            placeholder="Full-Stack Engineer"
          />
          <Field
            label="GitHub username"
            name="github_username"
            defaultValue={profile.github_username ?? ""}
            placeholder="octocat"
          />
          <Field label="Email" name="email" defaultValue={profile.email} disabled />
        </div>
        <div>
          <Label className="text-xs mono tracking-wider text-muted-foreground">BIO</Label>
          <Textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            rows={3}
            maxLength={500}
            placeholder="One paragraph about you — background, interests, what you want to build."
          />
        </div>
        <div className="flex justify-end">
          <Button disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save profile
          </Button>
        </div>
      </form>

      <div className="surface-panel p-6">
        <h2 className="text-lg font-semibold">My skills</h2>
        <p className="text-sm text-muted-foreground mt-1">Set proficiency 0–100.</p>
        <div className="mt-4 grid gap-3">
          {mySkills.length === 0 && (
            <p className="text-sm text-muted-foreground">No skills added yet. Add some below.</p>
          )}
          {mySkills.map((s) => (
            <div
              key={s.skill_id}
              className="flex items-center gap-3 rounded-md border border-border bg-card/40 p-3"
            >
              <div className="flex-1">
                <div className="text-sm font-medium">{s.skills.name}</div>
                <div className="mono text-[10px] text-muted-foreground">{s.skills.category}</div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                defaultValue={s.proficiency}
                onChange={(e) => setProficiency(s.skill_id, Number(e.target.value))}
                className="w-48 accent-[oklch(0.82_0.17_195)]"
              />
              <span className="mono text-xs w-10 text-right">{s.proficiency}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSkill(s.skill_id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-panel p-6">
        <h2 className="text-lg font-semibold">Add skills</h2>
        <div className="mt-4 space-y-4">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <p className="mono text-[11px] text-muted-foreground tracking-widest mb-2">
                {cat.toUpperCase()}
              </p>
              <div className="flex flex-wrap gap-2">
                {list.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addSkill(s.id)}
                    className="mono text-xs px-3 py-1.5 rounded-md border border-border bg-card/40 hover:border-primary hover:bg-primary/10 hover:text-primary transition flex items-center gap-1.5"
                  >
                    <Plus className="h-3 w-3" /> {s.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs mono tracking-wider text-muted-foreground">
        {label.toUpperCase()}
      </Label>
      <Input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
