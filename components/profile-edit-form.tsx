"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { Alert, AlertContent, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appToast } from "@/lib/app-toast";
import { getErrorMessage } from "@/lib/errors";
import { uploadPostAttachment } from "@/lib/post-media";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProfileEditFormProps = {
  user: User;
  onCancel: () => void;
  onSaved: () => void;
};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

const fieldInputClass =
  "h-12 rounded-xl border-0 bg-[#f3f3f3] px-4 text-base text-foreground shadow-none outline-none placeholder:text-muted-foreground/70 hover:bg-[#eeeeee] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-ring dark:bg-muted dark:hover:bg-muted/80 dark:focus-visible:bg-background";

function Field({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function ProfileEditForm({
  user,
  onCancel,
  onSaved,
}: ProfileEditFormProps) {
  const { refresh } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const initial = splitName(user.name);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [state, setState] = useState(user.state ?? "");
  const [zipCode, setZipCode] = useState(user.zipCode ?? "");
  const [avatar, setAvatar] = useState(user.avatar);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || user.name;
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  async function handleAvatarChange(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, GIF, or WebP).");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const localPreview = URL.createObjectURL(file);
    previewUrlRef.current = localPreview;
    setAvatar(localPreview);
    setUploadingAvatar(true);
    setError(null);

    try {
      const uploaded = await uploadPostAttachment(file);
      if (uploaded.attachmentType !== "image") {
        throw new Error("Please choose an image file.");
      }

      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar: uploaded.url })
        .eq("id", user.id);

      if (updateError) throw updateError;

      URL.revokeObjectURL(localPreview);
      previewUrlRef.current = null;
      setAvatar(uploaded.url);
      await refresh();
      appToast.success("Photo updated", "Your profile photo was uploaded.");
    } catch (err) {
      setAvatar(user.avatar);
      setError(getErrorMessage(err, "Could not upload photo."));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = [trimmedFirst, trimmedLast].filter(Boolean).join(" ");

    if (fullName.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const avatarToSave = avatar.startsWith("blob:") ? user.avatar : avatar;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: fullName,
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zip_code: zipCode.trim() || null,
          avatar: avatarToSave.trim() || user.avatar,
        })
        .eq("id", user.id);

      if (updateError) {
        if (
          updateError.message.toLowerCase().includes("phone") ||
          updateError.message.toLowerCase().includes("address") ||
          updateError.message.toLowerCase().includes("zip_code") ||
          updateError.message.toLowerCase().includes("schema cache")
        ) {
          throw new Error(
            "Contact fields need database setup. Run supabase/migrate-profile-contact.sql in Supabase → SQL Editor.",
          );
        }
        throw updateError;
      }

      await supabase.auth.updateUser({
        data: { name: fullName },
        ...(email.trim() ? { email: email.trim() } : {}),
      });

      await refresh();
      appToast.success("Profile updated", "Your profile changes were saved.");
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save profile. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (passwordError) throw passwordError;

      setNewPassword("");
      setConfirmPassword("");
      appToast.success("Password updated", "Your password has been changed.");
    } catch (err) {
      setError(
        getErrorMessage(err, "Could not update password. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
      <aside className="flex flex-col items-start">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          My Profile
        </h1>

        <div className="relative mt-8">
          <Avatar
            size="3xl"
            className="size-32 rounded-full bg-[#e8e8e8] text-3xl font-medium text-muted-foreground dark:bg-muted"
          >
            <AvatarImage
              src={avatar}
              alt={displayName}
              className="rounded-full object-cover"
            />
            <AvatarFallback className="rounded-full bg-[#e8e8e8] text-3xl font-medium text-muted-foreground dark:bg-muted">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="sr-only"
            onChange={(e) => void handleAvatarChange(e.target.files?.[0])}
          />

          <button
            type="button"
            disabled={uploadingAvatar || loading}
            aria-label="Upload profile photo"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-1 bottom-1 flex size-9 items-center justify-center rounded-full bg-foreground text-background shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {uploadingAvatar ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
          </button>
        </div>

        <div className="mt-5 space-y-1">
          <p className="text-xl font-semibold tracking-tight">{displayName}</p>
          <p className="text-base text-muted-foreground">
            {email.trim() || `@${user.username}`}
          </p>
        </div>
      </aside>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8 dark:border-border dark:bg-card">
        {error && (
          <Alert variant="error" className="mb-6 w-full max-w-none">
            <AlertContent>
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </AlertContent>
          </Alert>
        )}

        <Tabs defaultValue="personal" variant="underline" className="gap-8">
          <TabsList className="h-auto w-full justify-start gap-8 rounded-none border-b border-border/70 bg-transparent p-0">
            <TabsTrigger
              value="personal"
              className="rounded-none border-b-2 border-transparent px-0 pb-3 text-base font-medium shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Personal Information
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="rounded-none border-b-2 border-transparent px-0 pb-3 text-base font-medium text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Change Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0 outline-none">
            <form className="space-y-6" onSubmit={handleSaveProfile}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="profile-first-name" label="First Name">
                  <Input
                    id="profile-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className={fieldInputClass}
                    disabled={loading}
                    required
                  />
                </Field>
                <Field id="profile-last-name" label="Last Name">
                  <Input
                    id="profile-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className={fieldInputClass}
                    disabled={loading}
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="profile-email" label="Email Address">
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className={fieldInputClass}
                    disabled={loading}
                  />
                </Field>
                <Field id="profile-phone" label="Phone Number">
                  <Input
                    id="profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className={fieldInputClass}
                    disabled={loading}
                  />
                </Field>
              </div>

              <Field id="profile-address" label="Address">
                <Input
                  id="profile-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address"
                  className={fieldInputClass}
                  disabled={loading}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-3">
                <Field id="profile-city" label="City">
                  <Input
                    id="profile-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city"
                    className={fieldInputClass}
                    disabled={loading}
                  />
                </Field>
                <Field id="profile-state" label="State">
                  <Input
                    id="profile-state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Enter state"
                    className={fieldInputClass}
                    disabled={loading}
                  />
                </Field>
                <Field id="profile-zip" label="Zip Code">
                  <Input
                    id="profile-zip"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Enter zip code"
                    className={fieldInputClass}
                    disabled={loading}
                  />
                </Field>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  disabled={loading || uploadingAvatar}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="min-w-36 rounded-xl"
                  loading={loading}
                  disabled={uploadingAvatar}
                >
                  Edit Profile
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password" className="mt-0 outline-none">
            <form
              className="mx-auto max-w-md space-y-6"
              onSubmit={handleChangePassword}
            >
              <Field id="profile-new-password" label="New Password">
                <Input
                  id="profile-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={fieldInputClass}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
              </Field>
              <Field id="profile-confirm-password" label="Confirm Password">
                <Input
                  id="profile-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={fieldInputClass}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
              </Field>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="min-w-36 rounded-xl"
                  loading={loading}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
