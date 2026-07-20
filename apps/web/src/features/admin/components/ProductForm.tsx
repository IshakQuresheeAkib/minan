"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  createAdminProduct,
  updateAdminProduct,
} from "@/features/admin/actions/products.actions";
import { fetchAdminCategories } from "@/features/admin/actions/categories.actions";
import { fetchAdminSubcategories } from "@/features/admin/actions/subcategories.actions";
import { ImageUploader } from "@/features/admin/components/ImageUploader";
import {
  adminProductFormSchema,
  parseCommaList,
  type AdminProductFormInput,
} from "@/features/admin/schemas/admin.schemas";
import { useSessionImageCleanup } from "@/features/admin/hooks/useSessionImageCleanup";
import type {
  AdminCategory,
  AdminImageAsset,
  AdminProduct,
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
  FormDescription,
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
  uploadingImages: boolean;
  product: AdminProduct | null;
  onUploadStateChange: (uploading: boolean) => void;
  onSaved: () => void;
  onClose: () => void;
};

function toImageAssets(urls: string[]): AdminImageAsset[] {
  return urls.map((url) => ({ url }));
}

function ProductFormFields({
  accessToken,
  uploadingImages,
  product,
  onUploadStateChange,
  onSaved,
  onClose,
}: ProductFormFieldsProps) {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([]);
  const [images, setImages] = useState<AdminImageAsset[]>(() =>
    toImageAssets(product?.images ?? []),
  );
  const [saving, setSaving] = useState(false);
  const {
    cleanupRemovedSessionAssets,
    markAssetsSaved,
    registerUploadedAssets,
  } = useSessionImageCleanup(accessToken);

  const form = useForm<AdminProductFormInput>({
    resolver: zodResolver(adminProductFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      discount: product?.discount ?? 0,
      category_id: product?.category_id ?? "",
      subcategory_id: product?.subcategory_id ?? "",
      sizes: product?.sizes.join(", ") ?? "",
      colors: product?.colors.join(", ") ?? "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      fetchAdminCategories(accessToken),
      fetchAdminSubcategories(accessToken),
    ])
      .then(([categoryResponse, subcategoryResponse]) => {
        if (!cancelled) {
          setCategories(categoryResponse.data);
          setSubcategories(subcategoryResponse.data);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Failed to load product classifications",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const selectedCategoryId = useWatch({
    control: form.control,
    name: "category_id",
  });
  const selectedSubcategoryId = useWatch({
    control: form.control,
    name: "subcategory_id",
  });
  const activeSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.category_id === selectedCategoryId && subcategory.is_active,
  );
  const currentInactiveSubcategory = subcategories.find(
    (subcategory) =>
      subcategory._id === selectedSubcategoryId &&
      subcategory.category_id === selectedCategoryId &&
      !subcategory.is_active,
  );

  async function onSubmit(values: AdminProductFormInput) {
    if (uploadingImages) {
      toast.warning("Wait for image upload to finish");
      return;
    }

    const selectedSubcategory = subcategories.find(
      (subcategory) => subcategory._id === values.subcategory_id,
    );
    if (activeSubcategories.length > 0 && !values.subcategory_id) {
      form.setError("subcategory_id", {
        message: "Subcategory is required for this category",
      });
      return;
    }

    if (values.subcategory_id && !selectedSubcategory?.is_active) {
      form.setError("subcategory_id", {
        message: "Select an active subcategory",
      });
      return;
    }

    setSaving(true);

    const payload = {
      name: values.name,
      slug: values.slug?.trim() ? values.slug.trim() : undefined,
      description: values.description,
      price: values.price,
      discount: values.discount,
      category_id: values.category_id,
      subcategory_id: values.subcategory_id || null,
      sizes: parseCommaList(values.sizes),
      colors: parseCommaList(values.colors),
      images: images.map((image) => image.url),
    };

    try {
      if (product) {
        await updateAdminProduct(accessToken, product._id, payload);
        toast.success("Product updated");
      } else {
        await createAdminProduct(accessToken, payload);
        toast.success("Product created");
      }

      markAssetsSaved(images);
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

  function handleImagesChange(nextImages: AdminImageAsset[]) {
    setImages((previousImages) => {
      cleanupRemovedSessionAssets(previousImages, nextImages);
      return nextImages;
    });
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
              <FormLabel>Price (Tk)</FormLabel>
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
          name="discount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  step={1}
                  value={field.value}
                  onChange={(event) => {
                    const nextValue = event.target.valueAsNumber;
                    field.onChange(Number.isNaN(nextValue) ? 0 : nextValue);
                  }}
                />
              </FormControl>
              <FormDescription>
                Enter a whole number from 0 to 100. Use 0 for no discount.
              </FormDescription>
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
              <Select
                value={field.value}
                onValueChange={(value) => {
                  if (value !== field.value) {
                    form.setValue("subcategory_id", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.clearErrors("subcategory_id");
                  }
                  field.onChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
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
          name="subcategory_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategory</FormLabel>
              <Select
                disabled={
                  !selectedCategoryId ||
                  (activeSubcategories.length === 0 &&
                    !currentInactiveSubcategory)
                }
                value={field.value || undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        selectedCategoryId
                          ? activeSubcategories.length > 0
                            ? "Select subcategory"
                            : "Not used for this category"
                          : "Select category first"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currentInactiveSubcategory ? (
                    <SelectItem disabled value={currentInactiveSubcategory._id}>
                      {currentInactiveSubcategory.name} (Inactive)
                    </SelectItem>
                  ) : null}
                  {activeSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory._id} value={subcategory._id}>
                      {subcategory.name}
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
            onChange={handleImagesChange}
            onUploadStateChange={onUploadStateChange}
            onUploaded={registerUploadedAssets}
          />
        </div>

        <Button disabled={saving || uploadingImages} type="submit">
          {uploadingImages
            ? "Uploading images..."
            : saving
              ? "Saving..."
              : product
                ? "Update product"
                : "Create product"}
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
  const [uploadingImages, setUploadingImages] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && uploadingImages) {
      toast.warning("Wait for image upload to finish");
      return;
    }

    if (!nextOpen) {
      setUploadingImages(false);
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            uploadingImages={uploadingImages}
            product={product}
            onUploadStateChange={setUploadingImages}
            onSaved={onSaved}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
