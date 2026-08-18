"use client";
import { useQuery } from "@tanstack/react-query";
import { planQueryKeys, planService } from "@/services/plan-service";
export function usePlans() { return useQuery({ queryKey: planQueryKeys.all, queryFn: planService.list }); }
