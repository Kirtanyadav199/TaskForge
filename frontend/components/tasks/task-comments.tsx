"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { commentsApi } from "@/lib/api/comments";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/format";
import type { Comment } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TaskCommentsProps {
  orgId: string;
  projectId: string;
  taskId: string;
}

export function TaskComments({ orgId, projectId, taskId }: TaskCommentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [newContent, setNewContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deletingComment, setDeletingComment] = useState<Comment | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["org", orgId, "task", taskId, "comments"],
    queryFn: () => commentsApi.getComments(orgId, projectId, taskId),
    staleTime: 30 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (content: string) =>
      commentsApi.createComment(orgId, projectId, taskId, { content }),
    onSuccess: () => {
      // Backend returns userId as string on create, so refetch the list
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "task", taskId, "comments"],
      });
      setNewContent("");
      toast.success("Comment added");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to add comment";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) =>
      commentsApi.updateComment(orgId, projectId, taskId, commentId, {
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "task", taskId, "comments"],
      });
      setEditingCommentId(null);
      setEditingContent("");
      toast.success("Comment updated");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to update comment";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) =>
      commentsApi.deleteComment(orgId, projectId, taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "task", taskId, "comments"],
      });
      setDeletingComment(null);
      toast.success("Comment deleted");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to delete comment";
      toast.error(msg);
    },
  });

  const handleCreateSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newContent.trim() || createMutation.isPending) return;
    createMutation.mutate(newContent.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl or Cmd plus Enter submits
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleCreateSubmit();
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditingContent(comment.content);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editingContent.trim() || updateMutation.isPending) return;
    updateMutation.mutate({ commentId, content: editingContent.trim() });
  };

  return (
    <div className="space-y-4 pt-6 border-t border-border">
      <h3 className="text-sm font-semibold text-foreground">
        Comments ({comments.length})
      </h3>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading comments…</div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const isAuthor =
              comment.userId?._id === user?.id ||
              // If userId is plain string in some responses
              (typeof comment.userId === "string" && comment.userId === user?.id);

            const isEditing = editingCommentId === comment._id;

            return (
              <div
                key={comment._id}
                className="rounded-[6px] border border-border bg-background p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-foreground">
                      {comment.userId?.name || "User"}
                    </span>
                    <span className="text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>

                  {isAuthor && !isEditing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Comment options"
                          className="flex size-6 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-[#F5F5F5] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-28 rounded-[6px] border border-border bg-background p-1 text-xs shadow-xs"
                      >
                        <DropdownMenuItem
                          onClick={() => handleStartEdit(comment)}
                          className="flex cursor-pointer items-center gap-1.5 rounded-[4px] px-2 py-1.5"
                        >
                          <Pencil className="size-3 text-muted-foreground" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingComment(comment)}
                          className="flex cursor-pointer items-center gap-1.5 rounded-[4px] px-2 py-1.5 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={2}
                      className="resize-none text-xs"
                      disabled={updateMutation.isPending}
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingContent("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        disabled={
                          !editingContent.trim() || updateMutation.isPending
                        }
                        onClick={() => handleSaveEdit(comment._id)}
                      >
                        {updateMutation.isPending ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-xs text-foreground leading-relaxed">
                    {comment.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add comment textarea */}
      <form onSubmit={handleCreateSubmit} className="space-y-2 pt-2">
        <Textarea
          placeholder="Leave a comment… (Ctrl+Enter to post)"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={createMutation.isPending}
          className="resize-none text-xs"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Press Ctrl+Enter to submit
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={!newContent.trim() || createMutation.isPending}
            className="h-8 px-3 text-xs"
          >
            {createMutation.isPending ? "Saving…" : "Comment"}
          </Button>
        </div>
      </form>

      {/* Delete Comment Confirm Dialog */}
      <AlertDialog
        open={Boolean(deletingComment)}
        onOpenChange={(open) => {
          if (!open) setDeletingComment(null);
        }}
      >
        <AlertDialogContent className="max-w-[360px] rounded-[6px] border border-border p-6 shadow-xs">
          <AlertDialogHeader className="gap-1 text-left">
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Delete comment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this comment? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-3 gap-2 sm:justify-end">
            <AlertDialogCancel
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => setDeletingComment(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deletingComment) {
                  deleteMutation.mutate(deletingComment._id);
                }
              }}
            >
              {deleteMutation.isPending ? "Saving…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
