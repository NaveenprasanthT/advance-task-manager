"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  image: string | null;
  authProviders: string[];
  puzzleAccess: boolean;
  taskCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      return res.json() as Promise<AdminUser[]>;
    },
  });

  const updatePuzzleAccess = useMutation({
    mutationFn: async ({ id, puzzleAccess }: { id: string; puzzleAccess: boolean }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleAccess }),
      });
      if (!res.ok) throw new Error("Failed to update puzzle access");
      return res.json();
    },
    onMutate: async ({ id, puzzleAccess }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "users"] });
      const previous = queryClient.getQueryData<AdminUser[]>(["admin", "users"]);
      queryClient.setQueryData<AdminUser[]>(["admin", "users"], (old) =>
        (old ?? []).map((u) => (u.id === id ? { ...u, puzzleAccess } : u)),
      );
      return { previous };
    },
    onError: (error: Error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(["admin", "users"], context.previous);
      toast.error(error.message);
    },
    onSuccess: () => toast.success("Puzzle access updated"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading users...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Sign-in methods</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Puzzle game</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.authProviders.length ? user.authProviders.join(", ") : "—"}
                </TableCell>
                <TableCell>{user.taskCount}</TableCell>
                <TableCell>
                  {user.role === "admin" ? (
                    <span className="text-xs text-muted-foreground">Always on</span>
                  ) : (
                    <Switch
                      checked={user.puzzleAccess}
                      onCheckedChange={(checked) => updatePuzzleAccess.mutate({ id: user.id, puzzleAccess: checked })}
                    />
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
