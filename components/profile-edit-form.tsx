"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/current-user-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { normalizeUsername } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

type ProfileEditFormProps = {
  user: User;
  onCancel: () => void;
  onSaved: () => void;
};

export function ProfileEditForm({ user, onCancel, onSaved }: ProfileEditFormProps) {
  const { refresh } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const normalizedUsername = normalizeUsername(username);

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      setError("Username must be 3–20 characters (letters, numbers, underscore).");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (normalizedUsername !== user.username) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", normalizedUsername)
          .maybeSingle();

        if (existing) {
          setError("Username is already taken.");
          return;
        }
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: trimmedName,
          username: normalizedUsername,
          bio: bio.trim(),
          avatar: avatar.trim() || user.avatar,
        })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await supabase.auth.updateUser({
        data: {
          name: trimmedName,
          username: normalizedUsername,
        },
      });

      await refresh();
      toast.success("Profile updated.");
      onSaved();
    } catch {
      setError("Could not save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="profile-name">Full name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-username">Username</Label>
        <Input
          id="profile-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell people about yourself"
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-avatar">Avatar URL</Label>
        <Input
          id="profile-avatar"
          type="url"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://..."
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
