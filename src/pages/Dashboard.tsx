import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import VideoCard from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

interface Video {
  id: string;
  title: string;
  subject: string;
  semester: string;
  views: number;
  created_at: string;
  uploader_id: string;
  thumbnail_url?: string;
}

interface Profile {
  full_name: string;
  avatar_url?: string | null;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyVideos();
  }, []);

  const fetchMyVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: videosData, error: videosError } = await supabase
      .from("videos")
      .select("*")
      .eq("uploader_id", user.id)
      .order("created_at", { ascending: false });

    if (!videosError && videosData) {
      setVideos(videosData);
    }

    // Fetch own profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (!profileError && profileData) {
      setProfile(profileData as Profile);
    }
    
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete video",
        description: error.message,
      });
    } else {
      toast({ title: "Video deleted successfully" });
      fetchMyVideos();
    }
    setDeleteId(null);
  };

  return (
    <AppLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Videos</h1>
          <p className="text-muted-foreground">
            Manage your uploaded educational content
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't uploaded any videos yet.</p>
            <Button onClick={() => window.location.href = "/upload"}>
              Upload Your First Video
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="space-y-2">
                <VideoCard
                  id={video.id}
                  title={video.title}
                  subject={video.subject}
                  semester={video.semester}
                  views={video.views}
                  createdAt={video.created_at}
                  uploaderName={profile?.full_name || "Unknown"}
                  thumbnailUrl={video.thumbnail_url}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setDeleteId(video.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Dashboard;
