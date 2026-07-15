"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createAdminSubcategory,
  updateAdminSubcategory,
} from "@/features/admin/actions/subcategories.actions";
import {
  adminSubcategoryFormSchema,
  type AdminSubcategoryFormInput,
} from "@/features/admin/schemas/admin.schemas";
import type {
  AdminCategory,
  AdminSubcategory,
} from "@/features/admin/types";
import { Button } from "@/components/ui/Button";
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
import { ApiError } from "@/lib/api/client";

type SubcategoryFormProps = {
  accessToken: string;
  categories: AdminCategory[];
  open: boolean;
  subcategory: AdminSubcategory | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function SubcategoryFormFields({
  accessToken,
  categories,
  subcategory,
  onSaved,
  onClose,
}: Omit<SubcategoryFormProps, "open" | "onOpenChange"> & {
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const form = useForm<AdminSubcategoryFormInput>({
    resolver: zodResolver(adminSubcategoryFormSchema),
    defaultValues: {
      category_id: subcategory?.category_id ?? "",
      name: subcategory?.name ?? "",
      slug: subcategory?.slug ?? "",
    },
  });

  async function onSubmit(values: AdminSubcategoryFormInput) {
    setSaving(true);

    try {
      const payload = {
        name: values.name,
        slug: values.slug?.trim() ? values.slug.trim() : undefined,
      };

      if (subcategory) {
        await updateAdminSubcategory(
          accessToken,
          subcategory._id,
          payload,
        );
        toast.success("Subcategory updated");
      } else {
        await createAdminSubcategory(accessToken, {
          ...payload,
          category_id: values.category_id,
        });
        toast.success("Subcategory created");
      }

      onSaved();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to save subcategory",
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
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent category</FormLabel>
              <Select
                disabled={Boolean(subcategory)}
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                      {category.is_active ? "" : " (Inactive)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="auto-generated from name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={saving} type="submit">
          {saving
            ? "Saving..."
            : subcategory
              ? "Update subcategory"
              : "Create subcategory"}
        </Button>
      </form>
    </Form>
  );
}

export function SubcategoryForm({
  accessToken,
  categories,
  open,
  subcategory,
  onOpenChange,
  onSaved,
}: SubcategoryFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {subcategory ? "Edit subcategory" : "Create subcategory"}
          </DialogTitle>
        </DialogHeader>

        {open ? (
          <SubcategoryFormFields
            key={subcategory?._id ?? "new"}
            accessToken={accessToken}
            categories={categories}
            subcategory={subcategory}
            onSaved={onSaved}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
