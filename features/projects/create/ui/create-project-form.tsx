"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { createProjectSchema, CreateProjectFormValues } from "../model/schema";
import { useRouter } from "@/i18n/navigation";
import { useCreateProject } from "../model/create";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function CreateProjectForm() {
  const router = useRouter();
  const t = useTranslations("CreateProjectForm");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const {
    mutate: createProject,
    isPending: isCreating,
    error: createError,
  } = useCreateProject({
    onSuccessCallback: () => {
      toast.success(t("createSuccessToast"));
      router.push("/projects");
    },
    onErrorCallback: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: CreateProjectFormValues) => {
    createProject(data);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-6">
          {createError && (
            <p className="text-sm text-red-500 bg-red-100 p-3 rounded">
              {createError instanceof Error
                ? createError.message
                : t("unknownError")}
            </p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              placeholder={t("namePlaceholder")}
              {...register("name")}
              disabled={isCreating}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{t("descriptionLabel")}</Label>
            <Textarea
              id="description"
              placeholder={t("descriptionPlaceholder")}
              {...register("description")}
              className="min-h-[100px]"
              disabled={isCreating}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isCreating}
          >
            {t("cancelButton")}
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? t("creatingButton") : t("createButton")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
