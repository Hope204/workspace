"use client";

import { useQuery } from "@tanstack/react-query";
import { workspaceQueryKeys, workspaceService } from "@/services/workspace-service";

export function useWorkspaceDetail(id: string | undefined) {
  return useQuery({
    queryKey: workspaceQueryKeys.detail(id ?? ""),
    queryFn: () => workspaceService.detail(id!),
    enabled: Boolean(id),
  });
}
