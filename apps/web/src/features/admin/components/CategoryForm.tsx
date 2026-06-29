"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createAdminCategory,
  updateAdminCategory,
} from "@/features/admin/actions/categories.actions";
import { ImageUploader } from "@/features/admin/components/ImageUploader";
import {
  adminCategoryFormSchema,
  type AdminCategoryFormInput,
} from "@/features/admin/schemas/admin.schemas";
import type { AdminCategory } from "@/features/admin/types";
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
import { ApiError } from "@/lib/api/client";

type CategoryFormProps = {
  accessToken: string;
  open: boolean;
  category: AdminCategory | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

type CategoryFormFieldsProps = {
  accessToken: string;
  category: AdminCategory | null;
  onSaved: () => void;
  onClose: () => void;
};

function CategoryFormFields({
  accessToken,
  category,
  onSaved,
  onClose,
}: CategoryFormFieldsProps) {
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? "");
  const [saving, setSaving] = useState(false);

  const form = useForm<AdminCategoryFormInput>({
    resolver: zodResolver(adminCategoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      image_url: category?.image_url ?? "",
    },
  });

  async function onSubmit(values: AdminCategoryFormInput) {
    if (!imageUrl) {
      toast.error("Upload a category image");
      return;
    }

    setSaving(true);

    const payload = {
      name: values.name,
      slug: values.slug?.trim() ? values.slug.trim() : undefined,
      image_url: imageUrl,
    };

    try {
      if (category) {
        await updateAdminCategory(accessToken, category._id, payload);
        toast.success("Category updated");
      } else {
        await createAdminCategory(accessToken, payload);
        toast.success("Category created");
      }

      onSaved();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to save category",
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

        <div className="space-y-2">
          <p className="text-sm font-medium">Image</p>
          <ImageUploader
            accessToken={accessToken}
            images={imageUrl ? [imageUrl] : []}
            multiple={false}
            onChange={(urls) => setImageUrl(urls[0] ?? "")}
          />
        </div>

        <Button disabled={saving} type="submit">
          {saving
            ? "Saving..."
            : category
              ? "Update category"
              : "Create category"}
        </Button>
      </form>
    </Form>
  );
}

export function CategoryForm({
  accessToken,
  open,
  category,
  onOpenChange,
  onSaved,
}: CategoryFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit category" : "Create category"}
          </DialogTitle>
        </DialogHeader>

        {open ? (
          <CategoryFormFields
            key={category?._id ?? "new"}
            accessToken={accessToken}
            category={category}
            onSaved={onSaved}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
