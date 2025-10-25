import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Clock, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { addFavorite, removeFavorite, isFavorite } from "@/lib/localFavorites";

interface VideoCardProps {
  id: string;
  title: string;
  subject: string;
  semester: string;
  views: number;
  createdAt: string;
  uploaderName: string;
  thumbnailUrl?: string;
  initialFavorited?: boolean;
}

const VideoCard = ({
  id,
  title,
  subject,
  semester,
  views,
  createdAt,
  uploaderName,
  thumbnailUrl,
  initialFavorited = false,
}: VideoCardProps) => {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialFavorited) {
      setFavorited(isFavorite(id));
    }
  }, [id, initialFavorited]);

  const { toast } = useToast();
  const [imageLoading, setImageLoading] = useState(true);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    setLoading(true);

    try {
      if (favorited) {
        removeFavorite(id);
      } else {
        addFavorite(id);
      }
      setFavorited(!favorited);
      toast({
        title: favorited ? "Removed from favorites" : "Added to favorites"
      });
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error updating favorites",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Link to={`/video/${id}`}>
      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
  <div className="aspect-video bg-muted relative overflow-hidden">
          {thumbnailUrl ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              <img 
                src={thumbnailUrl} 
                alt={title} 
                className={cn(
                  "w-full h-full object-cover transition-all duration-300 group-hover:scale-110",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
                onError={(e) => {
                  console.error('Error loading thumbnail:', {
                    url: thumbnailUrl,
                    videoId: id,
                    videoTitle: title
                  });
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>';
                  setImageLoading(false);
                }}
                onLoad={() => setImageLoading(false)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center flex-col gap-2">
              <svg
                className="h-8 w-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-muted-foreground text-sm">No thumbnail</span>
            </div>
          )}
          <div className="absolute top-2 right-2 transform transition-transform duration-300 group-hover:scale-105">
            <Badge variant="secondary" className="shadow-sm">{subject}</Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {uploaderName ? uploaderName.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold line-clamp-2 mb-1 transition-colors duration-300 group-hover:text-primary">{title}</h3>
              <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-300">By {uploaderName}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {views}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "hover:text-primary",
                      favorited && "text-primary",
                      loading && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={toggleFavorite}
                    disabled={loading}
                  >
                    <Heart className={cn(
                      "h-4 w-4 transition-all duration-300",
                      favorited && "fill-current scale-110"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{favorited ? 'Remove from favorites' : 'Add to favorites'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge variant="outline">Sem {semester}</Badge>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default VideoCard;
