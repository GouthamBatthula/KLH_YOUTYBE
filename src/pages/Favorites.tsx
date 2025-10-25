import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getFavorites } from "@/lib/localFavorites";

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
}

const Favorites = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      const favoriteIds = getFavorites();

      if (favoriteIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .in("id", favoriteIds)
        .order("created_at", { ascending: false });

      if (videosError) {
        console.error("Error fetching favorite videos:", videosError);
        setLoading(false);
        return;
      }

      if (videosData) {
        setVideos(videosData);

        // Fetch profiles for uploaders
        const uploaderIds = [...new Set(videosData.map(v => v.uploader_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", uploaderIds as string[]);

        if (profilesData) {
          const profilesMap: Record<string, Profile> = {};
          profilesData.forEach((profile) => {
            const displayName = profile.full_name || profile.email?.split('@')[0] || 'Unknown';
            profilesMap[profile.id] = { full_name: displayName };
          });
          setProfiles(profilesMap);
        }
      }
      setLoading(false);
    };

    fetchFavorites();
  }, []);

  return (
    <AppLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Favorite Videos</h1>
          <p className="text-muted-foreground mb-6">
            Your collection of favorite educational content
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No favorite videos yet. Start adding some!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                subject={video.subject}
                semester={video.semester}
                views={video.views}
                createdAt={video.created_at}
                uploaderName={profiles[video.uploader_id]?.full_name || "Unknown"}
                thumbnailUrl={video.thumbnail_url}
                initialFavorited={true}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Favorites;