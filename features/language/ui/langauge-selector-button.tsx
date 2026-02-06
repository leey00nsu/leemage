"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

const languages = [
  { value: "en", label: "English" },
  { value: "ko", label: "한국어" },
];

interface LanguageSelectorButtonProps {
  className?: string;
}

export function LanguageSelectorButton({ className }: LanguageSelectorButtonProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = React.useState(false);

  const currentLanguage = languages.find((lang) => lang.value === locale);

  const handleLanguageChange = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[150px] justify-between", className)}
        >
          <div className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            {currentLanguage ? currentLanguage.label : "Select language..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {languages.map((language) => (
                <CommandItem
                  key={language.value}
                  value={language.value}
                  onSelect={(currentValue: string) => {
                    if (currentValue !== locale) {
                      handleLanguageChange(currentValue);
                    } else {
                      setOpen(false);
                    }
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      locale === language.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Link
                    href={pathname}
                    locale={language.value}
                    className="w-full h-full"
                    onClick={(e) => {
                      e.preventDefault();
                      if (language.value !== locale) {
                        handleLanguageChange(language.value);
                      } else {
                        setOpen(false);
                      }
                    }}
                  >
                    {language.label}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
