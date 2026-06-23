import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInventoryItem, deleteInventoryItem, listInventory, updateInventoryItem } from "../api/inventory";

export function useInventory(params?: { status?: string }) {
  return useQuery({ queryKey: ["inventory", params], queryFn: () => listInventory(params) });
}

export function useInventoryMutations() {
  const qc = useQueryClient();
  return {
    create: useMutation({ mutationFn: createInventoryItem, onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }) }),
    update: useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => updateInventoryItem(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }) }),
    remove: useMutation({ mutationFn: deleteInventoryItem, onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }) }),
  };
}
