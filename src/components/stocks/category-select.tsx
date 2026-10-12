"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddCategoryMutation, useGetCategoriesQuery } from "@/store/api/categoriesApi";
import { useAppSelector } from "@/store/hooks";

const ADD_NEW_VALUE = "__add_new__";

interface CategorySelectProps {
  userId: string;
  value: string;
  onChange: (value: string) => void;
}

/** Types are global and admin-managed (3.x) — only an admin sees the "Add new type" option; everyone else gets a read-only picker over the shared list. */
export function CategorySelect({ userId, value, onChange }: CategorySelectProps) {
  const isAdmin = useAppSelector((state) => state.auth.user?.isAdmin ?? false);
  const { data: categories = [], isLoading } = useGetCategoriesQuery();
  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleCreate() {
    try {
      const created = await addCategory({ createdBy: userId, name: newName }).unwrap();
      onChange(created.name);
      toast.success(`Added "${created.name}" to types`);
      setIsCreating(false);
      setNewName("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add type.");
    }
  }

  if (isCreating && isAdmin) {
    return (
      <div className="flex gap-2">
        <Input
          autoFocus
          placeholder="New type name"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleCreate();
            }
          }}
        />
        <Button type="button" onClick={handleCreate} disabled={isAdding || !newName.trim()}>
          <PlusCircle className="size-4" />
          Add
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreating(false);
            setNewName("");
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next === ADD_NEW_VALUE) {
          setIsCreating(true);
          return;
        }
        onChange(next);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? "Loading types..." : "Select a type"} />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.name}>
            {category.name}
          </SelectItem>
        ))}
        {isAdmin && (
          <SelectItem value={ADD_NEW_VALUE}>
            <PlusCircle className="size-4" />
            Add new type
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
