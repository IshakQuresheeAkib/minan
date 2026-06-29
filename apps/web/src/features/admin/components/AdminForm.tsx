"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createAdminUser,
  updateAdminUser,
} from "@/features/admin/actions/admins.actions";
import {
  adminCreateFormSchema,
  adminUpdateFormSchema,
  type AdminCreateFormInput,
  type AdminUpdateFormInput,
} from "@/features/admin/schemas/admin.schemas";
import type { AdminUser } from "@/features/admin/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";

type AdminFormProps = {
  accessToken: string;
  open: boolean;
  admin: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function AdminCreateFields({
  accessToken,
  onSaved,
  onClose,
}: {
  accessToken: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const form = useForm<AdminCreateFormInput>({
    resolver: zodResolver(adminCreateFormSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "general",
    },
  });

  async function onSubmit(values: AdminCreateFormInput) {
    setSaving(true);

    try {
      await createAdminUser(accessToken, values);
      toast.success("Admin created");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to create admin",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={saving} type="submit">
          {saving ? "Creating..." : "Create admin"}
        </Button>
      </form>
    </Form>
  );
}

function AdminUpdateFields({
  accessToken,
  admin,
  onSaved,
  onClose,
}: {
  accessToken: string;
  admin: AdminUser;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const form = useForm<AdminUpdateFormInput>({
    resolver: zodResolver(adminUpdateFormSchema),
    defaultValues: {
      email: admin.email,
      role: admin.role,
      is_active: admin.is_active,
    },
  });

  async function onSubmit(values: AdminUpdateFormInput) {
    setSaving(true);

    try {
      await updateAdminUser(accessToken, admin._id, values);
      toast.success("Admin updated");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update admin",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <FormLabel>Active</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button disabled={saving} type="submit">
          {saving ? "Saving..." : "Update admin"}
        </Button>
      </form>
    </Form>
  );
}

export function AdminForm({
  accessToken,
  open,
  admin,
  onOpenChange,
  onSaved,
}: AdminFormProps) {
  const isCreate = admin === null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Create admin" : "Edit admin"}</DialogTitle>
        </DialogHeader>

        {open ? (
          isCreate ? (
            <AdminCreateFields
              key="create"
              accessToken={accessToken}
              onSaved={onSaved}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <AdminUpdateFields
              key={admin._id}
              accessToken={accessToken}
              admin={admin}
              onSaved={onSaved}
              onClose={() => onOpenChange(false)}
            />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
