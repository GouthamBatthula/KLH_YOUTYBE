import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import VideoCard from "@/components/VideoCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface Video {
  id: string;
  title: string;
  subject: string;
  semester: string;
  views: number;
  created_at: string;
  uploader_id: string;
  thumbnail_url?: string;
  video_url: string;
}

interface Profile {
  full_name: string;
  avatar_url?: string | null;
}

import { SUBJECTS } from "@/config/constants";

const subjects = ["All", ...SUBJECTS];

const Browse = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");

  useEffect(() => {
    fetchVideos();
  }, [selectedSubject, selectedSemester, searchQuery]);

  const fetchVideos = async () => {
    console.log('Starting to fetch videos...');
    try {
      setLoading(true);
      let queryBuilder = supabase
        .from("videos")
        .select("*");
      
      console.log('Initial query builder created');
    
      // Debug: Log the query being made
      console.log('Fetching videos...');

      if (selectedSubject !== "All") {
        queryBuilder = queryBuilder.eq("subject", selectedSubject);
      }

      if (selectedSemester !== "All") {
        queryBuilder = queryBuilder.eq("semester", selectedSemester);
      }

      if (searchQuery) {
        queryBuilder = queryBuilder.ilike("title", `%${searchQuery}%`);
      }

      const { data: videosData, error } = await queryBuilder.order("created_at", { ascending: false });

    if (!error && videosData) {
        console.log('Videos data received:', videosData);
        setVideos(videosData);

        // Fetch profiles
        const uploaderIds = [...new Set(videosData.map(v => v.uploader_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", uploaderIds);

        if (profilesData) {
          const profilesMap: Record<string, Profile> = {};
          profilesData.forEach((p: any) => {
            profilesMap[p.id] = { full_name: p.full_name || "Unknown", avatar_url: p.avatar_url || null };
          });
          setProfiles(profilesMap);
        }
      } else if (error) {
        console.error('Error fetching videos:', error);
      }
    } catch (error) {
      console.error('Error in fetchVideos:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      );
    }

    if (!videos || videos.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No videos found matching your criteria.</p>
        </div>
      );
    }

    return (
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
    );
  };

  return (
    <AppLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Browse Videos</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Semesters</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <SelectItem key={sem} value={sem.toString()}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default Browse;
