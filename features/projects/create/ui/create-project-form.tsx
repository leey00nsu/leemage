"use client";

import { useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import { AppCard } from "@/shared/ui/app/app-card";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { createCreateProjectSchema, CreateProjectFormValues } from "../model/schema";
import { useRouter } from "@/i18n/navigation";
import { useCreateProject } from "../model/create";
import { useAvailableStorageProviders } from "../model/storage-providers";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { StorageProvider } from "@/lib/storage/types";

export function CreateProjectForm() {
  const router = useRouter();
  const t = useTranslations("CreateProjectForm");
  const tStorage = useTranslations("StorageProvider");
  const tValidation = useTranslations("Validation");

  // i18n 스키마 생성
  const schema = useMemo(
    () => createCreateProjectSchema((key) => tValidation(key)),
    [tValidation]
  );

  const {
    data: availableProvidersData,
    isLoading: isLoadingProviders,
  } = useAvailableStorageProviders();

  const availableProviders = availableProvidersData?.providers ?? [];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      storageProvider: StorageProvider.OCI,
    },
  });

  // 사용 가능한 프로바이더가 로드되면 첫 번째 프로바이더를 기본값으로 설정
  useEffect(() => {
    if (availableProviders.length > 0) {
      setValue("storageProvider", availableProviders[0]);
    }
  }, [availableProviders, setValue]);

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
    <AppCard className="w-full max-w-2xl">
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
          <div className="grid gap-2">
            <Label htmlFor="storageProvider">{t("storageProviderLabel")}</Label>
            {isLoadingProviders ? (
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            ) : availableProviders.length === 0 ? (
              <p className="text-sm text-red-500 bg-red-100 p-3 rounded">
                {t("noProvidersAvailable")}
              </p>
            ) : (
              <Controller
                name="storageProvider"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isCreating || availableProviders.length === 0}
                  >
                    <SelectTrigger id="storageProvider">
                      <SelectValue placeholder={t("storageProviderLabel")} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProviders.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          <div className="flex flex-col">
                            <span>{tStorage(provider)}</span>
                            <span className="text-xs text-muted-foreground">
                              {tStorage(`${provider}_description`)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            <p className="text-xs text-muted-foreground">
              {t("storageProviderDescription")}
            </p>
            {errors.storageProvider && (
              <p className="text-xs text-red-500 mt-1">
                {errors.storageProvider.message}
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
          <Button
            type="submit"
            disabled={isCreating || isLoadingProviders || availableProviders.length === 0}
          >
            {isCreating ? t("creatingButton") : t("createButton")}
          </Button>
        </CardFooter>
      </form>
    </AppCard>
  );
}
