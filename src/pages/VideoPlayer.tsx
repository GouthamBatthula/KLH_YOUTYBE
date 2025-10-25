import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Eye, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Video {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  semester: string;
  video_url: string;
  views: number;
  created_at: string;
  uploader_id: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface Profile {
  id: string;
  full_name: string;
}

const VideoPlayer = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchComments();
      incrementViews();
    }
  }, [id]);

  const fetchVideo = async () => {
    const { data: videoData, error: videoError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .single();

    if (!videoError && videoData) {
      setVideo(videoData);

      // Fetch uploader profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", videoData.uploader_id)
        .single();

      if (profileData) {
        setProfiles(prev => ({ ...prev, [profileData.id]: profileData.full_name || "Unknown" }));
      }
    }
  };

  const fetchComments = async () => {
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("video_id", id)
      .is("parent_comment_id", null)
      .order("created_at", { ascending: false });

    if (!commentsError && commentsData) {
      setComments(commentsData);

      // Fetch all comment author profiles
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesData) {
        const profilesMap: Record<string, string> = {};
        profilesData.forEach(p => {
          profilesMap[p.id] = p.full_name || "Unknown";
        });
        setProfiles(prev => ({ ...prev, ...profilesMap }));
      }
    }
  };

  const incrementViews = async () => {
    await supabase.rpc("increment_video_views", { video_id: id });
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({ variant: "destructive", title: "Please login to comment" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("comments").insert({
      video_id: id,
      user_id: user.id,
      content: newComment,
    });

    if (error) {
      toast({ variant: "destructive", title: "Failed to post comment" });
    } else {
      setNewComment("");
      fetchComments();
      toast({ title: "Comment posted!" });
    }
    setLoading(false);
  };

  if (!video) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Video Player */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={video.video_url}
            controls
            className="w-full h-full"
          />
        </div>

        {/* Video Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge>{video.subject}</Badge>
              <Badge variant="outline">Semester {video.semester}</Badge>
              {video.topic && <Badge variant="secondary">{video.topic}</Badge>}
            </div>

            <h1 className="text-2xl font-bold mb-2">{video.title}</h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {video.views} views
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
              </span>
            </div>

            <p className="text-sm mb-4">
              <span className="font-semibold">Uploaded by:</span> {profiles[video.uploader_id] || "Unknown"}
            </p>

            {video.description && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{video.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">{comments.length} Comments</h2>

            <div className="space-y-4 mb-6">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button onClick={handleCommentSubmit} disabled={loading}>
                {loading ? "Posting..." : "Post Comment"}
              </Button>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{profiles[comment.user_id] || "Unknown"}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default VideoPlayer;
