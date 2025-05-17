import { useMutation } from "@tanstack/react-query";
import { logout } from "../api/logout";

interface UseLogoutOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useLogout = (options?: UseLogoutOptions) => {
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      if (options?.onSuccessCallback) {
        options.onSuccessCallback();
      }
    },
    onError: (error) => {
      if (options?.onErrorCallback) {
        options.onErrorCallback(error);
      }
    },
  });
};
