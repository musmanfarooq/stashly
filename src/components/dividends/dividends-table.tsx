"use client";

import { Banknote, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { useGetDividendsQuery } from "@/store/api/dividendsApi";

interface DividendsTableProps {
  userId: string;
}

export function DividendsTable({ userId }: DividendsTableProps) {
  const { data: dividends, isLoading, isError } = useGetDividendsQuery(userId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Banknote}
        title="Couldn't load dividends"
        description="Something went wrong fetching your dividends. Please try again."
      />
    );
  }

  if (!dividends || dividends.length === 0) {
    return (
      <EmptyState
        icon={Banknote}
        title="No dividends yet"
        description="Dividends you record will appear here permanently."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead className="text-right">Amount (PKR)</TableHead>
          <TableHead>Date received</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dividends.map((dividend) => (
          <TableRow key={dividend.id}>
            <TableCell className="font-medium">{dividend.symbol}</TableCell>
            <TableCell className="text-right text-profit">{dividend.amount.toFixed(2)}</TableCell>
            <TableCell>{dividend.date}</TableCell>
            <TableCell className="text-right">
              <Badge variant="outline" className="gap-1">
                <Lock className="size-3" />
                Locked
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
