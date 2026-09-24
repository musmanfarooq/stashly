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

const ADD_NEW_VALUE = "__add_new__";

interface CategorySelectProps {
  userId: string;
  value: string;
  onChange: (value: string) => void;
}

export function CategorySelect({ userId, value, onChange }: CategorySelectProps) {
  const { data: categories = [], isLoading } = useGetCategoriesQuery(userId);
  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleCreate() {
    try {
      const created = await addCategory({ userId, name: newName }).unwrap();
      onChange(created.name);
      toast.success(`Added "${created.name}" to types`);
      setIsCreating(false);
      setNewName("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add type.");
    }
  }

  if (isCreating) {
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
        <SelectItem value={ADD_NEW_VALUE}>
          <PlusCircle className="size-4" />
          Add new type
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
