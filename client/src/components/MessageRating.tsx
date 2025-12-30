import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";

interface MessageRatingProps {
  messageId: number;
}

export function MessageRating({ messageId }: MessageRatingProps) {
  const [selectedRating, setSelectedRating] = useState<"helpful" | "not_helpful" | null>(null);
  
  const { data: existingRating } = trpc.chat.getMessageRating.useQuery(
    { messageId },
    { enabled: !!messageId }
  );

  const rateMessageMutation = trpc.chat.rateMessage.useMutation({
    onSuccess: () => {
      // Rating saved successfully
    },
  });

  const handleRate = (rating: "helpful" | "not_helpful") => {
    setSelectedRating(rating);
    rateMessageMutation.mutate({
      messageId,
      rating,
    });
  };

  const currentRating = selectedRating || existingRating?.rating;

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs text-muted-foreground">هل كانت الإجابة مفيدة؟</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleRate("helpful")}
        disabled={rateMessageMutation.isPending}
        className={`h-7 px-2 ${
          currentRating === "helpful"
            ? "bg-green-100 text-green-700 hover:bg-green-100"
            : ""
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5 ml-1" />
        مفيد
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleRate("not_helpful")}
        disabled={rateMessageMutation.isPending}
        className={`h-7 px-2 ${
          currentRating === "not_helpful"
            ? "bg-red-100 text-red-700 hover:bg-red-100"
            : ""
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5 ml-1" />
        غير مفيد
      </Button>
    </div>
  );
}
