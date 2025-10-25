import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import VideoCard from "@/components/VideoCard";
import SearchBox from "@/components/SearchBox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SUBJECTS } from "@/config/constants";
import { cn } from "@/lib/utils";

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

const Home = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [allVideos, setAllVideos] = useState<Video[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);

      if (!videosError && videosData) {
        setAllVideos(videosData);
        setVideos(videosData);

        // Fetch profiles for uploaders
        const uploaderIds = [...new Set(videosData.map(v => v.uploader_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", uploaderIds);

        if (!profilesError && profilesData) {
          const profilesMap: Record<string, Profile> = {};
          profilesData.forEach((profile) => {
            // Use email as fallback if no full name
            const displayName = profile.full_name || profile.email?.split('@')[0] || 'Unknown';
            profilesMap[profile.id] = {
              full_name: displayName,
              avatar_url: null // We're not using avatar images for now
            };
          });
          setProfiles(profilesMap);
        } else {
          console.error('Error fetching profiles:', profilesError);
        }
      }
      setLoading(false);
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    if (selectedSubject === "All") {
      setVideos(allVideos);
    } else {
      setVideos(allVideos.filter(video => video.subject === selectedSubject));
    }
  }, [selectedSubject, allVideos]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      // If search is empty, reset to filtered by subject
      if (selectedSubject === "All") {
        setVideos(allVideos);
      } else {
        setVideos(allVideos.filter(video => video.subject === selectedSubject));
      }
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = allVideos.filter(video => {
      const matchesSubject = selectedSubject === "All" || video.subject === selectedSubject;
      const matchesSearch = 
        video.title.toLowerCase().includes(searchLower) ||
        video.subject.toLowerCase().includes(searchLower) ||
        profiles[video.uploader_id]?.full_name.toLowerCase().includes(searchLower);
      return matchesSubject && matchesSearch;
    });
    setVideos(filtered);
  };

  return (
    <AppLayout>
      <div>
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Recent Videos</h1>
              <p className="text-muted-foreground">
                Discover educational content shared by the KLH community
              </p>
            </div>
            <SearchBox onSearch={handleSearch} />
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedSubject === "All" ? "default" : "outline"}
              onClick={() => setSelectedSubject("All")}
              className={cn(
                "transition-all",
                selectedSubject === "All" ? "shadow-md" : ""
              )}
            >
              All
            </Button>
            {SUBJECTS.map((subject) => (
              <Button
                key={subject}
                variant={selectedSubject === subject ? "default" : "outline"}
                onClick={() => setSelectedSubject(subject)}
                className={cn(
                  "transition-all",
                  selectedSubject === subject ? "shadow-md" : ""
                )}
              >
                {subject}
              </Button>
            ))}
          </div>
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
            <p className="text-muted-foreground">No videos yet. Be the first to upload!</p>
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
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Home;
