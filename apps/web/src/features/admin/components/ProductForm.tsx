"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createAdminProduct,
  updateAdminProduct,
} from "@/features/admin/actions/products.actions";
import { fetchAdminCategories } from "@/features/admin/actions/categories.actions";
import { ImageUploader } from "@/features/admin/components/ImageUploader";
import {
  adminProductFormSchema,
  parseCommaList,
  type AdminProductFormInput,
} from "@/features/admin/schemas/admin.schemas";
import type { AdminCategory, AdminProduct } from "@/features/admin/types";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";

type ProductFormProps = {
  accessToken: string;
  open: boolean;
  product: AdminProduct | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

type ProductFormFieldsProps = {
  accessToken: string;
  product: AdminProduct | null;
  onSaved: () => void;
  onClose: () => void;
};

function ProductFormFields({
  accessToken,
  product,
  onSaved,
  onClose,
}: ProductFormFieldsProps) {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [saving, setSaving] = useState(false);

  const form = useForm<AdminProductFormInput>({
    resolver: zodResolver(adminProductFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      category_id: product?.category_id ?? "",
      sizes: product?.sizes.join(", ") ?? "",
      colors: product?.colors.join(", ") ?? "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    void fetchAdminCategories(accessToken).then((response) => {
      if (!cancelled) {
        setCategories(response.data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function onSubmit(values: AdminProductFormInput) {
    setSaving(true);

    const payload = {
      name: values.name,
      slug: values.slug?.trim() ? values.slug.trim() : undefined,
      description: values.description,
      price: values.price,
      category_id: values.category_id,
      sizes: parseCommaList(values.sizes),
      colors: parseCommaList(values.colors),
      images,
    };

    try {
      if (product) {
        await updateAdminProduct(accessToken, product._id, payload);
        toast.success("Product updated");
      } else {
        await createAdminProduct(accessToken, payload);
        toast.success("Product created");
      }

      onSaved();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to save product",
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (BDT)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.target.valueAsNumber || 0);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
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
          name="sizes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sizes (comma-separated)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="S, M, L, XL" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colors (comma-separated)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Red, Black" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Product images</p>
            <p className="text-xs leading-relaxed text-foreground/65">
              The first image is the main storefront image. Other images appear
              after it in the product gallery.
            </p>
          </div>
          <ImageUploader
            accessToken={accessToken}
            images={images}
            showProductRoles
            onChange={setImages}
          />
        </div>

        <Button disabled={saving} type="submit">
          {saving ? "Saving..." : product ? "Update product" : "Create product"}
        </Button>
      </form>
    </Form>
  );
}

export function ProductForm({
  accessToken,
  open,
  product,
  onOpenChange,
  onSaved,
}: ProductFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit product" : "Create product"}
          </DialogTitle>
        </DialogHeader>

        {open ? (
          <ProductFormFields
            key={product?._id ?? "new"}
            accessToken={accessToken}
            product={product}
            onSaved={onSaved}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
