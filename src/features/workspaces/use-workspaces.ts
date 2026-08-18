"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceQueryKeys, workspaceService, type WorkspaceInput } from "@/services/workspace-service";

export function useWorkspaces() { return useQuery({ queryKey: workspaceQueryKeys.all, queryFn: workspaceService.list }); }

export function useWorkspaceMutations() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: workspaceQueryKeys.all });
  return {
    create: useMutation({ mutationFn: (input: WorkspaceInput) => workspaceService.create(input), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<WorkspaceInput> }) => workspaceService.update(id, input), onSuccess: (_, variables) => { refresh(); return client.invalidateQueries({ queryKey: workspaceQueryKeys.detail(variables.id) }); } }),
    remove: useMutation({ mutationFn: workspaceService.remove, onSuccess: refresh }),
  };
}
