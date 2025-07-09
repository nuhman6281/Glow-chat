import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Chat } from '@shared/api';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useChats = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['chats', params],
    queryFn: () => api.chats.getChats(params),
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useChat = (chatId: string) => {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => api.chats.getChatById(chatId),
    enabled: !!chatId,
    staleTime: 30000,
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.chats.createChat,
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        toast({
          title: 'Chat created',
          description: 'New chat has been created successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create chat',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create chat. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateChat = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ chatId, updates }: { chatId: string; updates: { name?: string; description?: string } }) =>
      api.chats.updateChat(chatId, updates),
    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['chat', variables.chatId] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        toast({
          title: 'Chat updated',
          description: 'Chat has been updated successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update chat',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update chat. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useLeaveChat = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.chats.leaveChat,
    onSuccess: (response, chatId) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        queryClient.removeQueries({ queryKey: ['chat', chatId] });
        toast({
          title: 'Left chat',
          description: 'You have left the chat successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to leave chat',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to leave chat. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.chats.deleteChat,
    onSuccess: (response, chatId) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        queryClient.removeQueries({ queryKey: ['chat', chatId] });
        toast({
          title: 'Chat deleted',
          description: 'Chat has been deleted successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete chat',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete chat. Please try again.',
        variant: 'destructive',
      });
    },
  });
}; 