"use client";
import { useQuery } from "@tanstack/react-query";
import { taskQueryKeys, taskService } from "@/services/task-service";
export function useTasks() { return useQuery({ queryKey: taskQueryKeys.all, queryFn: taskService.list }); }
